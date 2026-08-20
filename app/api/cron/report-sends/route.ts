import { type NextRequest, NextResponse } from "next/server"
import { drainReportSendJobs } from "@/lib/report-send-job"

export const maxDuration = 300

function authorizeCron(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim()
  if (!cronSecret) return process.env.NODE_ENV !== "production"
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
    const processed = await drainReportSendJobs(240_000)
    return NextResponse.json({ success: true, processed })
  } catch (error) {
    console.error("Cron report-sends error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
