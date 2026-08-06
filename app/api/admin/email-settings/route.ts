import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/admin-auth-server"
import { hasAdminPermission } from "@/lib/admin-permissions"
import { listEmailToggles, setEmailToggle, type EmailToggleId } from "@/lib/email-settings"

async function requireEmailSettingsAdmin(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session) {
    return { ok: false as const, response: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }) }
  }
  if (!hasAdminPermission(session.role, session.permissions, "email-settings")) {
    return { ok: false as const, response: NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }) }
  }
  return { ok: true as const, session }
}

export async function GET(request: NextRequest) {
  const auth = await requireEmailSettingsAdmin(request)
  if (!auth.ok) return auth.response

  try {
    const toggles = await listEmailToggles()
    return NextResponse.json({ success: true, toggles })
  } catch (error) {
    console.error("Email settings GET error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireEmailSettingsAdmin(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const id = String(body?.id || "").trim() as EmailToggleId
    const enabled = Boolean(body?.enabled)

    if (!id) {
      return NextResponse.json({ success: false, error: "id required" }, { status: 400 })
    }

    await setEmailToggle(id, enabled)
    const toggles = await listEmailToggles()
    return NextResponse.json({ success: true, toggles })
  } catch (error) {
    console.error("Email settings PATCH error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
