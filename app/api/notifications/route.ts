import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get("customerId")
    if (!customerId) {
      return NextResponse.json({ success: false, error: "Customer ID required" }, { status: 400 })
    }

    const limitRaw = Number(request.nextUrl.searchParams.get("limit") || 20)
    const limit = Number.isFinite(limitRaw) ? Math.min(100, Math.max(1, Math.floor(limitRaw))) : 20

    const notifications = await sql.query(
      `SELECT id, title, body, "createdAt", "readAt"
       FROM "Notification"
       WHERE "customerId" = $1
       ORDER BY "createdAt" DESC
       LIMIT $2`,
      [customerId, limit],
    )

    return NextResponse.json({ success: true, notifications })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const customerId = String(body.customerId || "").trim()
    if (!customerId) {
      return NextResponse.json({ success: false, error: "Customer ID required" }, { status: 400 })
    }

    if (body.markAllRead) {
      await sql`
        UPDATE "Notification"
        SET "readAt" = NOW()
        WHERE "customerId" = ${customerId} AND "readAt" IS NULL
      `
      return NextResponse.json({ success: true })
    }

    const id = String(body.id || "").trim()
    if (!id) {
      return NextResponse.json({ success: false, error: "id required" }, { status: 400 })
    }

    await sql`
      UPDATE "Notification"
      SET "readAt" = NOW()
      WHERE id = ${id} AND "customerId" = ${customerId}
    `
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating notifications:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
