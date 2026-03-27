import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

/**
 * GET /api/customer/children?customerId=xxx
 * Returns child customers for a group client. Only works if customer has isGroup=true.
 */
export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get("customerId")
    if (!customerId) {
      return NextResponse.json({ success: false, error: "Customer ID required" }, { status: 400 })
    }

    const parentRows = await sql`
      SELECT id, "isGroup" FROM "Customer" WHERE id = ${customerId} LIMIT 1
    `
    const parent = Array.isArray(parentRows) ? parentRows[0] : parentRows
    if (!parent) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 })
    }

    const isGroup = parent.isGroup === true || parent.isGroup === "true" || (parent as Record<string, unknown>).isgroup === true
    if (!isGroup) {
      return NextResponse.json({ success: true, children: [] })
    }

    const childrenRows = await sql`
      SELECT id, email, "companyName", "contactPerson", status
      FROM "Customer"
      WHERE "parentCustomerId" = ${customerId}
      ORDER BY "companyName" ASC
    `
    const children = Array.isArray(childrenRows) ? childrenRows : [childrenRows].filter(Boolean)

    return NextResponse.json({ success: true, children })
  } catch (error) {
    console.error("Error fetching children:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
