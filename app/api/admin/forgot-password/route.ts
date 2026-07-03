import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateOtp, hashOtp } from "@/lib/auth-session"
import { sendOtpEmail } from "@/lib/auth-email"

export async function POST(request: NextRequest) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL
    if (!adminEmail) {
      return NextResponse.json(
        { success: false, error: "ADMIN_EMAIL not configured. Set it in environment variables." },
        { status: 503 },
      )
    }

    const otp = generateOtp()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.passwordResetOtp.deleteMany({
      where: { email: adminEmail.toLowerCase(), purpose: "admin", usedAt: null },
    })

    await prisma.passwordResetOtp.create({
      data: {
        email: adminEmail.toLowerCase(),
        purpose: "admin",
        otpHash: await hashOtp(otp, adminEmail.toLowerCase()),
        expiresAt,
      },
    })

    const result = await sendOtpEmail({ to: adminEmail, otp, purpose: "admin" })

    return NextResponse.json({
      success: true,
      message: "OTP sent to admin email.",
      ...(process.env.NODE_ENV !== "production" && result.devOtp ? { devOtp: result.devOtp } : {}),
    })
  } catch (error) {
    console.error("Admin forgot password error:", error)
    return NextResponse.json({ success: false, error: "Failed to send OTP" }, { status: 500 })
  }
}
