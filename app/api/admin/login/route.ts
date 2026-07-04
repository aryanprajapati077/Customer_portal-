import { type NextRequest, NextResponse } from "next/server"
import { verifyPassword } from "@/lib/password"
import { verifyTotp } from "@/lib/admin-totp"
import {
  ADMIN_PENDING_COOKIE,
  setAdminSessionCookie,
  signAdminPending,
  signAdminSession,
} from "@/lib/admin-auth"
import { findAdminByEmail } from "@/lib/admin-auth-server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { email, password, totpCode } = await request.json()
    const normalizedEmail = String(email || "")
      .toLowerCase()
      .trim()
    const pass = String(password || "")

    if (!normalizedEmail || !pass) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 })
    }

    const admin = await findAdminByEmail(normalizedEmail)
    if (!admin || !admin.active) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 })
    }

    const valid = await verifyPassword(pass, admin.passwordHash)
    if (!valid) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 })
    }

    if (admin.totpEnabled && admin.totpSecret) {
      const code = String(totpCode || "").trim()
      if (!code) {
        const pending = await signAdminPending(admin.id)
        const response = NextResponse.json({
          success: false,
          requiresTotp: true,
          message: "Enter the 6-digit code from your authenticator app.",
        })
        response.cookies.set(ADMIN_PENDING_COOKIE, pending, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 300,
        })
        return response
      }

      const totpOk = await verifyTotp(admin.totpSecret, code)
      if (!totpOk) {
        return NextResponse.json({ success: false, error: "Invalid authenticator code" }, { status: 401 })
      }
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
    console.error("Admin login error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
