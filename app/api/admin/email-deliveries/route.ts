import { type NextRequest, NextResponse } from "next/server"
import {
  ensureEmailDeliveryLogTable,
  listProblemEmailDeliveries,
  resolveEmailDeliveryLog,
} from "@/lib/email-delivery-log"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    await ensureEmailDeliveryLogTable()
    const status = request.nextUrl.searchParams.get("status") || "all"
    const q = request.nextUrl.searchParams.get("q") || ""
    const deliveries = await listProblemEmailDeliveries({ status, q })

    const counts = await sql`
      SELECT status, COUNT(*)::int AS count
      FROM "EmailDeliveryLog"
      WHERE "resolvedAt" IS NULL
        AND status IN ('failed', 'bounced', 'complained')
      GROUP BY status
    `

    return NextResponse.json({
      success: true,
      deliveries,
      counts: Object.fromEntries(
        (counts as { status: string; count: number }[]).map((c) => [c.status, c.count]),
      ),
    })
  } catch (error) {
    console.error("email-deliveries GET:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const id = String(body?.id || "")
    if (!id) {
      return NextResponse.json({ success: false, error: "id required" }, { status: 400 })
    }
    await resolveEmailDeliveryLog(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("email-deliveries PATCH:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
