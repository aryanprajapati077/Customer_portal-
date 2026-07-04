import { type NextRequest, NextResponse } from "next/server"
import { verifyTotp } from "@/lib/admin-totp"
import {
  ADMIN_PENDING_COOKIE,
  setAdminSessionCookie,
  signAdminSession,
  verifyAdminPending,
} from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { totpCode } = await request.json()
    const code = String(totpCode || "").trim()
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ success: false, error: "Enter a valid 6-digit code" }, { status: 400 })
    }

    const pending = request.cookies.get(ADMIN_PENDING_COOKIE)?.value
    const adminId = await verifyAdminPending(pending)
    if (!adminId) {
      return NextResponse.json({ success: false, error: "Session expired. Sign in again." }, { status: 401 })
    }

    const admin = await prisma.adminUser.findUnique({ where: { id: adminId } })
    if (!admin || !admin.active || !admin.totpEnabled || !admin.totpSecret) {
      return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 })
    }

    const totpOk = await verifyTotp(admin.totpSecret, code)
    if (!totpOk) {
      return NextResponse.json({ success: false, error: "Invalid authenticator code" }, { status: 401 })
    }

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    })

    const token = await signAdminSession(admin.id, admin.role)
    const response = NextResponse.json({
      success: true,
      admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    })
    setAdminSessionCookie(response, token)
    response.cookies.set(ADMIN_PENDING_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 })
    return response
  } catch (error) {
    console.error("Admin verify 2FA error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
