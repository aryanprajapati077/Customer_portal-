import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { requireCustomerSession } from "@/lib/customer-api-auth"
import {
  PORTAL_SESSION_COOKIE,
  heartbeatPortalSession,
  recordPortalPageView,
  startPortalSession,
} from "@/lib/portal-analytics"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const auth = await requireCustomerSession()
    if (!auth.ok) return auth.response

    const body = await request.json().catch(() => ({}))
    const path = String(body?.path || "/dashboard").slice(0, 300)
    const recordView = body?.recordView !== false

    const jar = await cookies()
    let sessionId = jar.get(PORTAL_SESSION_COOKIE)?.value || ""

    let ok = false
    if (sessionId) {
      ok = await heartbeatPortalSession({
        sessionId,
        customerId: auth.customerId,
        path,
      })
    }

    // Recover session if cookie missing/stale but user is authenticated
    if (!ok) {
      const rows = await sql`
        SELECT email, "companyName" FROM "Customer" WHERE id = ${auth.customerId} LIMIT 1
      `
      const customer = rows[0] as { email?: string; companyName?: string } | undefined
      sessionId = await startPortalSession({
        customerId: auth.customerId,
        email: customer?.email,
        companyName: customer?.companyName,
        userAgent: request.headers.get("user-agent"),
        ip:
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          request.headers.get("x-real-ip") ||
          null,
        path,
      })
    }

    if (recordView) {
      await recordPortalPageView({
        sessionId,
        customerId: auth.customerId,
        path,
      })
    }

    const response = NextResponse.json({ success: true, sessionId })
    response.cookies.set(PORTAL_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })
    return response
  } catch (error) {
    console.error("Presence heartbeat error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
