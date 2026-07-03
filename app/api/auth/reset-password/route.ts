import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/password"

export async function POST(request: NextRequest) {
  try {
    const { email, resetToken, password } = await request.json()
    const normalized = String(email || "").toLowerCase().trim()
    const token = String(resetToken || "")
    const newPassword = String(password || "")

    if (!normalized || !token || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Email, reset token, and password (min 6 chars) required" },
        { status: 400 },
      )
    }

    const record = await prisma.passwordResetOtp.findFirst({
      where: {
        email: normalized,
        purpose: "customer",
        resetToken: token,
        usedAt: null,
        verifiedAt: { not: null },
        expiresAt: { gt: new Date() },
      },
    })

    if (!record) {
      return NextResponse.json({ success: false, error: "Invalid or expired reset session" }, { status: 400 })
    }

    const customer = await prisma.customer.findUnique({ where: { email: normalized } })
    if (!customer) {
      return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 })
    }

    await prisma.$transaction([
      prisma.customer.update({
        where: { id: customer.id },
        data: { password: await hashPassword(newPassword) },
      }),
      prisma.passwordResetOtp.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ])

    return NextResponse.json({ success: true, message: "Password updated. You can sign in now." })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ success: false, error: "Reset failed" }, { status: 500 })
  }
}
