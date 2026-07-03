import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateOtp, hashOtp } from "@/lib/auth-session"
import { sendOtpEmail } from "@/lib/auth-email"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    const normalized = String(email || "").toLowerCase().trim()

    if (!normalized) {
      return NextResponse.json({ success: false, error: "Email required" }, { status: 400 })
    }

    const customer = await prisma.customer.findUnique({ where: { email: normalized } })

    // Always return success to prevent email enumeration
    if (!customer) {
      return NextResponse.json({
        success: true,
        message: "If an account exists, an OTP has been sent to your email.",
      })
    }

    const otp = generateOtp()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.passwordResetOtp.deleteMany({
      where: { email: normalized, purpose: "customer", usedAt: null },
    })

    await prisma.passwordResetOtp.create({
      data: {
        email: normalized,
        purpose: "customer",
        otpHash: await hashOtp(otp, normalized),
        expiresAt,
      },
    })

    const result = await sendOtpEmail({ to: normalized, otp, purpose: "customer" })

    return NextResponse.json({
      success: true,
      message: "If an account exists, an OTP has been sent to your email.",
      ...(process.env.NODE_ENV !== "production" && result.devOtp ? { devOtp: result.devOtp } : {}),
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ success: false, error: "Failed to send OTP" }, { status: 500 })
  }
}
