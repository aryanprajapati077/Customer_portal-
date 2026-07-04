import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyOtpHash, createResetToken } from "@/lib/auth-session"

export async function POST(request: NextRequest) {
  try {
    const { otp, email } = await request.json()
    const adminEmail = String(email || process.env.ADMIN_EMAIL || "")
      .toLowerCase()
      .trim()
    const code = String(otp || "").trim()

    if (!adminEmail || !code) {
      return NextResponse.json({ success: false, error: "Email and OTP required" }, { status: 400 })
    }

    const record = await prisma.passwordResetOtp.findFirst({
      where: {
        email: adminEmail,
        purpose: "admin",
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    })

    if (!record || record.attempts >= 5) {
      return NextResponse.json({ success: false, error: "OTP expired or invalid" }, { status: 400 })
    }

    if (!(await verifyOtpHash(code, adminEmail, record.otpHash))) {
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

    return NextResponse.json({ success: true, resetToken, email: adminEmail })
  } catch (error) {
    console.error("Admin verify OTP error:", error)
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 })
  }
}
