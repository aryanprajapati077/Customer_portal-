import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateOtp, hashOtp } from "@/lib/auth-session"
import { sendOtpEmail } from "@/lib/auth-email"
import { sql } from "@/lib/db"

/** Login emails are no longer unique (one person can cover several locations), so look up by any match. */
async function accountExists(email: string) {
  const customer = await prisma.customer.findFirst({ where: { email }, select: { id: true } })
  if (customer) return true
  try {
    const rows = await sql`SELECT 1 FROM "CustomerPortalUser" WHERE lower(email) = ${email} AND active = true LIMIT 1`
    return rows.length > 0
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    const normalized = String(email || "").toLowerCase().trim()

    if (!normalized) {
      return NextResponse.json({ success: false, error: "Email required" }, { status: 400 })
    }

    // Always return success to prevent email enumeration
    if (!(await accountExists(normalized))) {
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
