import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get("customerId")
    const month = request.nextUrl.searchParams.get("month")

    let rows

    if (customerId && month) {
      rows = await sql`
        SELECT c.id, c."customerId", c.date, c.weight, c.location, c.status,
               cu."companyName"
        FROM "Collection" c
        JOIN "Customer" cu ON cu.id = c."customerId"
        WHERE c."customerId" = ${customerId}
          AND to_char(c.date, 'YYYY-MM') = ${month}
        ORDER BY c.date DESC
        LIMIT 300
      `
    } else if (customerId) {
      rows = await sql`
        SELECT c.id, c."customerId", c.date, c.weight, c.location, c.status,
               cu."companyName"
        FROM "Collection" c
        JOIN "Customer" cu ON cu.id = c."customerId"
        WHERE c."customerId" = ${customerId}
        ORDER BY c.date DESC
        LIMIT 300
      `
    } else if (month) {
      rows = await sql`
        SELECT c.id, c."customerId", c.date, c.weight, c.location, c.status,
               cu."companyName"
        FROM "Collection" c
        JOIN "Customer" cu ON cu.id = c."customerId"
        WHERE to_char(c.date, 'YYYY-MM') = ${month}
        ORDER BY c.date DESC
        LIMIT 300
      `
    } else {
      rows = await sql`
        SELECT c.id, c."customerId", c.date, c.weight, c.location, c.status,
               cu."companyName"
        FROM "Collection" c
        JOIN "Customer" cu ON cu.id = c."customerId"
        ORDER BY c.date DESC
        LIMIT 300
      `
    }

    return NextResponse.json({ success: true, collections: rows })
  } catch (error) {
    console.error("Error fetching collections (admin):", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const customerId = String(body?.customerId || "")
    const weight = Number(body?.weight)
    const location = body?.location ? String(body.location) : null
    const status = body?.status ? String(body.status) : "Completed"
    const collectionDate = body?.date ? String(body.date) : null

    if (!customerId || !Number.isFinite(weight)) {
      return NextResponse.json({ success: false, error: "customerId and weight required" }, { status: 400 })
    }

    const id = `col_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const dateValue = collectionDate ? new Date(collectionDate).toISOString() : new Date().toISOString()

    const rows = await sql`
      INSERT INTO "Collection" (id, "customerId", date, weight, location, status)
      VALUES (${id}, ${customerId}, ${dateValue}, ${weight}, ${location}, ${status})
      RETURNING *
    `

    await sql`
      UPDATE "Customer"
      SET "totalWasteCollected" = (
            SELECT COALESCE(SUM(weight), 0) FROM "Collection" WHERE "customerId" = ${customerId}
          ),
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${customerId}
    `

    return NextResponse.json({ success: true, collection: rows?.[0] || null })
  } catch (error) {
    console.error("Error creating collection (admin):", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
