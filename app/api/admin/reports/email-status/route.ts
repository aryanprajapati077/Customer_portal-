import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/admin-auth-server"
import { hasAdminPermission } from "@/lib/admin-permissions"
import { getReportEmailStatus } from "@/lib/report-email-status"

async function requireReportsAdmin(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    }
  }
  if (!hasAdminPermission(session.role, session.permissions, "reports")) {
    return {
      ok: false as const,
      response: NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }),
    }
  }
  return { ok: true as const, session }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireReportsAdmin(request)
    if (!auth.ok) return auth.response

    const period = request.nextUrl.searchParams.get("period")?.trim() || ""
    if (!/^\d{4}-\d{2}$/.test(period)) {
      return NextResponse.json(
        { success: false, error: "Invalid month. Use YYYY-MM." },
        { status: 400 },
      )
    }

    const status = request.nextUrl.searchParams.get("status") || "all"
    const q = request.nextUrl.searchParams.get("q") || ""
    const limit = Math.min(500, Math.max(1, Number(request.nextUrl.searchParams.get("limit")) || 50))
    const offset = Math.max(0, Number(request.nextUrl.searchParams.get("offset")) || 0)
    const result = await getReportEmailStatus(period, { status, q, limit, offset })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("report email-status GET:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
