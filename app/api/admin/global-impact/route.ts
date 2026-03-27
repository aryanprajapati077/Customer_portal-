import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const rows = await sql`
      SELECT * FROM "GlobalImpact"
      WHERE id = 'global-impact'
      LIMIT 1
    `
    return NextResponse.json({ success: true, impact: rows?.[0] || null })
  } catch (error) {
    console.error("Error fetching global impact:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const wasteCollected = Number(body?.wasteCollected)
    const productsCreated = Number(body?.productsCreated)
    const treesEquivalent = Number(body?.treesEquivalent)
    const co2Prevented = Number(body?.co2Prevented)

    const rows = await sql`
      UPDATE "GlobalImpact"
      SET
        "wasteCollected" = ${Number.isFinite(wasteCollected) ? wasteCollected : 0},
        "productsCreated" = ${Number.isFinite(productsCreated) ? productsCreated : 0},
        "treesEquivalent" = ${Number.isFinite(treesEquivalent) ? treesEquivalent : 0},
        "co2Prevented" = ${Number.isFinite(co2Prevented) ? co2Prevented : 0},
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = 'global-impact'
      RETURNING *
    `

    return NextResponse.json({ success: true, impact: rows?.[0] || null })
  } catch (error) {
    console.error("Error updating global impact:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

