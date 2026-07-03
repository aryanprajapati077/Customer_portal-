import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyOtpHash, createResetToken } from "@/lib/auth-session"

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json()
    const normalized = String(email || "").toLowerCase().trim()
    const code = String(otp || "").trim()

    if (!normalized || !code) {
      return NextResponse.json({ success: false, error: "Email and OTP required" }, { status: 400 })
    }

    const record = await prisma.passwordResetOtp.findFirst({
      where: {
        email: normalized,
        purpose: "customer",
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    })

    if (!record) {
      return NextResponse.json({ success: false, error: "OTP expired or invalid" }, { status: 400 })
    }

    if (record.attempts >= 5) {
      return NextResponse.json({ success: false, error: "Too many attempts. Request a new OTP." }, { status: 429 })
    }

    if (!(await verifyOtpHash(code, normalized, record.otpHash))) {
      await prisma.passwordResetOtp.update({
        where: { id: record.id },
        data: { attempts: record.attempts + 1 },
      })
      return NextResponse.json({ success: false, error: "Invalid OTP" }, { status: 400 })
    }

    const resetToken = createResetToken()
    await prisma.passwordResetOtp.update({
      where: { id: record.id },
      data: { verifiedAt: new Date(), resetToken },
    })

    return NextResponse.json({ success: true, resetToken })
  } catch (error) {
    console.error("Verify OTP error:", error)
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 })
  }
}
