import { NextResponse } from "next/server"
import { getPortalAnalyticsSnapshot } from "@/lib/portal-analytics"

export async function GET() {
  try {
    const analytics = await getPortalAnalyticsSnapshot()
    return NextResponse.json({ success: true, analytics })
  } catch (error) {
    console.error("Admin analytics error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
