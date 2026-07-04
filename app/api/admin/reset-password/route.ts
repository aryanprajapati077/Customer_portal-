import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/password"

export async function POST(request: NextRequest) {
  try {
    const { resetToken, password, email } = await request.json()
    const token = String(resetToken || "")
    const newPassword = String(password || "")
    const adminEmail = String(email || "").toLowerCase().trim()

    if (!token || !adminEmail || newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: "Email, reset token, and password (min 8 chars) required" },
        { status: 400 },
      )
    }

    const record = await prisma.passwordResetOtp.findFirst({
      where: {
        email: adminEmail,
        purpose: "admin",
        resetToken: token,
        usedAt: null,
        verifiedAt: { not: null },
        expiresAt: { gt: new Date() },
      },
    })

    if (!record) {
      return NextResponse.json({ success: false, error: "Invalid or expired reset session" }, { status: 400 })
    }

    const passwordHash = await hashPassword(newPassword)

    await prisma.$transaction([
      prisma.adminUser.upsert({
        where: { email: adminEmail },
        create: {
          email: adminEmail,
          name: "Admin",
          passwordHash,
          role: "admin",
        },
        update: { passwordHash },
      }),
      prisma.adminCredential.upsert({
        where: { id: "admin" },
        create: { id: "admin", email: adminEmail, passwordHash },
        update: { email: adminEmail, passwordHash },
      }),
      prisma.passwordResetOtp.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ])

    return NextResponse.json({ success: true, message: "Password updated. Sign in with your email." })
  } catch (error) {
    console.error("Admin reset password error:", error)
    return NextResponse.json({ success: false, error: "Reset failed" }, { status: 500 })
  }
}
