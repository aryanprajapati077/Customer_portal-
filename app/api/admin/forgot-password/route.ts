import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateOtp, hashOtp } from "@/lib/auth-session"
import { sendOtpEmail } from "@/lib/auth-email"
import { ensureSuperAdmin } from "@/lib/admin-auth-server"

export async function POST(request: NextRequest) {
  try {
    await ensureSuperAdmin()

    const body = await request.json().catch(() => ({}))
    const requestedEmail = String(body.email || process.env.ADMIN_EMAIL || "")
      .toLowerCase()
      .trim()

    if (!requestedEmail) {
      return NextResponse.json(
        { success: false, error: "Enter your admin email address." },
        { status: 400 },
      )
    }

    const admin = await prisma.adminUser.findUnique({ where: { email: requestedEmail } })
    if (!admin || !admin.active) {
      return NextResponse.json({
        success: true,
        message: "If that email is registered, an OTP has been sent.",
      })
    }

    const otp = generateOtp()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.passwordResetOtp.deleteMany({
      where: { email: requestedEmail, purpose: "admin", usedAt: null },
    })

    await prisma.passwordResetOtp.create({
      data: {
        email: requestedEmail,
        purpose: "admin",
        otpHash: await hashOtp(otp, requestedEmail),
        expiresAt,
      },
    })

    const result = await sendOtpEmail({ to: requestedEmail, otp, purpose: "admin" })

    return NextResponse.json({
      success: true,
      message: "OTP sent to your admin email.",
      ...(process.env.NODE_ENV !== "production" && result.devOtp ? { devOtp: result.devOtp } : {}),
    })
  } catch (error) {
    console.error("Admin forgot password error:", error)
    return NextResponse.json({ success: false, error: "Failed to send OTP" }, { status: 500 })
  }
}
