import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const rows = await sql`
      SELECT c.id, c."customerId", c.name, c.type, c."issueDate",
             c."certificateNumber", c.description,
             cu."companyName"
      FROM "Certificate" c
      JOIN "Customer" cu ON cu.id = c."customerId"
      ORDER BY c."issueDate" DESC
      LIMIT 500
    `

    return NextResponse.json({ success: true, certificates: rows })
  } catch (error) {
    console.error("Admin certificates error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
