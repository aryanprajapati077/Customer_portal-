import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/admin-auth-server"
import { hasAdminPermission } from "@/lib/admin-permissions"
import { getEmailStatusDashboard } from "@/lib/email-status"

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSession(request)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    if (!hasAdminPermission(session.role, session.permissions, "email-status")) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const sp = request.nextUrl.searchParams
    const data = await getEmailStatusDashboard({
      from: sp.get("from") || undefined,
      to: sp.get("to") || undefined,
      status: sp.get("status") || "all",
      kind: sp.get("kind") || "all",
      q: sp.get("q") || "",
      take: Number(sp.get("take") || 80),
      offset: Number(sp.get("offset") || 0),
    })
    return NextResponse.json({ success: true, ...data })
  } catch (error) {
    console.error("email-status GET:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
