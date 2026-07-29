import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { assertCustomerAccess, requireCustomerSession } from "@/lib/customer-api-auth"

export async function GET(request: NextRequest) {
  try {
    const auth = await requireCustomerSession()
    if (!auth.ok) return auth.response

    const requested = request.nextUrl.searchParams.get("customerId")
    const denied = assertCustomerAccess(auth.customerId, requested)
    if (denied) return denied

    const customerId = auth.customerId
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
    const session = await requireCustomerSession()
    if (!session.ok) return session.response

    const body = await request.json()
    const denied = assertCustomerAccess(session.customerId, body?.customerId)
    if (denied) return denied

    const customerId = session.customerId

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
