import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

/**
 * GET /api/customer/group-waste-summary?customerId=xxx
 * Returns waste totals by client for a group (parent + children).
 * Used when group client views "My company" to see breakdown by each client.
 */
export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get("customerId")
    if (!customerId) {
      return NextResponse.json({ success: false, error: "Customer ID required" }, { status: 400 })
    }

    const parent = await sql`
      SELECT id, "companyName", "isGroup", "totalWasteCollected"
      FROM "Customer"
      WHERE id = ${customerId}
      LIMIT 1
    `
    const parentRow = Array.isArray(parent) ? parent[0] : parent
    if (!parentRow) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 })
    }

    if (!parentRow.isGroup) {
      return NextResponse.json({
        success: true,
        clients: [
          {
            id: parentRow.id,
            companyName: parentRow.companyName,
            totalWasteCollected: Number(parentRow.totalWasteCollected) || 0,
            isGroup: false,
          },
        ],
        totalWaste: Number(parentRow.totalWasteCollected) || 0,
      })
    }

    const children = await sql`
      SELECT c.id, c."companyName", c."totalWasteCollected",
             COALESCE(SUM(col.weight), 0)::float as collection_total
      FROM "Customer" c
      LEFT JOIN "Collection" col ON col."customerId" = c.id
      WHERE c."parentCustomerId" = ${customerId}
      GROUP BY c.id, c."companyName", c."totalWasteCollected"
      ORDER BY c."companyName" ASC
    `
    const childRows = Array.isArray(children) ? children : [children].filter(Boolean)

    const parentCollections = await sql`
      SELECT COALESCE(SUM(weight), 0)::float as total FROM "Collection" WHERE "customerId" = ${customerId}
    `
    const parentCollectionTotal = Array.isArray(parentCollections) && parentCollections[0]
      ? Number(parentCollections[0].total) || 0
      : 0
    const parentWaste = parentCollectionTotal > 0
      ? parentCollectionTotal
      : (Number(parentRow.totalWasteCollected) || 0)

    const clients = [
      {
        id: parentRow.id,
        companyName: `${parentRow.companyName} (My company)`,
        totalWasteCollected: parentWaste,
        isGroup: true,
      },
      ...childRows.map((c: { id: string; companyName: string; totalWasteCollected: number; collection_total?: number }) => {
        const fromCollections = Number(c.collection_total) || 0
        const fromCustomer = Number(c.totalWasteCollected) || 0
        const waste = fromCollections > 0 ? fromCollections : fromCustomer
        return {
          id: c.id,
          companyName: c.companyName,
          totalWasteCollected: waste,
          isGroup: false,
        }
      }),
    ]

    const totalWaste = clients.reduce((sum, c) => sum + (c.totalWasteCollected || 0), 0)

    return NextResponse.json({
      success: true,
      clients,
      totalWaste,
    })
  } catch (error) {
    console.error("Error fetching group waste summary:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
