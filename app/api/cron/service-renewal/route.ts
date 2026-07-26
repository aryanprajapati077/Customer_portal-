import { type NextRequest, NextResponse } from "next/server"
import { runServiceRenewalReminders } from "@/lib/service-renewal-reminders"

/**
 * Daily cron: send service_renewal emails at 30 / 15 / 7 days before contractEndDate.
 * Secured with CRON_SECRET (Vercel Cron sends Authorization: Bearer <CRON_SECRET>).
 */
function authorizeCron(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim()
  if (!cronSecret) {
    // Allow in development without secret so local testing works
    return process.env.NODE_ENV !== "production"
  }
  const auth = request.headers.get("authorization") || ""
  if (auth === `Bearer ${cronSecret}`) return true
  const headerSecret = request.headers.get("x-cron-secret") || ""
  return headerSecret === cronSecret
}

export async function GET(request: NextRequest) {
  try {
    if (!authorizeCron(request)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const result = await runServiceRenewalReminders()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("Cron service-renewal error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
