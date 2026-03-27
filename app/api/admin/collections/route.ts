import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get("customerId")

    const rows = customerId
      ? await sql`
          SELECT c.id, c."customerId", c.date, c.weight, c.location, c.status,
                 cu."companyName"
          FROM "Collection" c
          JOIN "Customer" cu ON cu.id = c."customerId"
          WHERE c."customerId" = ${customerId}
          ORDER BY c.date DESC
          LIMIT 300
        `
      : await sql`
          SELECT c.id, c."customerId", c.date, c.weight, c.location, c.status,
                 cu."companyName"
          FROM "Collection" c
          JOIN "Customer" cu ON cu.id = c."customerId"
          ORDER BY c.date DESC
          LIMIT 300
        `

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

    if (!customerId || !Number.isFinite(weight)) {
      return NextResponse.json({ success: false, error: "customerId and weight required" }, { status: 400 })
    }

    const id = `col_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const rows = await sql`
      INSERT INTO "Collection" (id, "customerId", date, weight, location, status)
      VALUES (${id}, ${customerId}, CURRENT_TIMESTAMP, ${weight}, ${location}, ${status})
      RETURNING *
    `

    return NextResponse.json({ success: true, collection: rows?.[0] || null })
  } catch (error) {
    console.error("Error creating collection (admin):", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

