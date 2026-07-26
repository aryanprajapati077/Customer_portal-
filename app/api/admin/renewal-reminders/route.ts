import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/admin-auth-server"
import {
  listUpcomingRenewals,
  runServiceRenewalReminders,
} from "@/lib/service-renewal-reminders"

/**
 * Call from Admin → Email Templates, or schedule via cron with
 * Authorization: Bearer <CRON_SECRET> (or x-cron-secret header).
 */
async function authorize(request: NextRequest): Promise<boolean> {
  const session = await requireAdminSession(request)
  if (session) return true

  const cronSecret = process.env.CRON_SECRET?.trim()
  if (!cronSecret) return false

  const auth = request.headers.get("authorization") || ""
  if (auth === `Bearer ${cronSecret}`) return true

  const headerSecret = request.headers.get("x-cron-secret") || ""
  return headerSecret === cronSecret
}

export async function POST(request: NextRequest) {
  try {
    if (!(await authorize(request))) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const result = await runServiceRenewalReminders({ dryRun: Boolean(body?.dryRun) })
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("Renewal reminders error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!(await authorize(request))) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const upcoming = await listUpcomingRenewals()
    return NextResponse.json({ success: true, upcoming })
  } catch (error) {
    console.error("Renewal reminders GET:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
