import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { randomBytes } from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get("host") || "localhost:3000";
  const proto =
    request.headers.get("x-forwarded-proto") ??
    (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const customer = await prisma.customer.findUnique({
      where: { email: normalizedEmail },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Account not found with this email" },
        { status: 404 },
      );
    }

    const token = randomBytes(32).toString("hex");
    const expireAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.passwordResetToken.create({
      data: {
        token,
        email: normalizedEmail,
        customerId: customer.id,
        expireAt,
      },
    });

    const baseUrl = getBaseUrl(request);
    const resetUrl = `${baseUrl}/forgot-pass?token=${token}`;

    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set");
      return NextResponse.json(
        { success: false, error: "Email service not configured" },
        { status: 500 },
      );
    }

    const { error } = await resend.emails.send({
      from: "Buffindia <onboarding@resend.dev>",
      to: normalizedEmail,
      subject: "Reset your password - Buffindia",
      html: `
        <p>Hi,</p>
        <p>You requested a password reset for your Buffindia account.</p>
        <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#16A34A;color:white;text-decoration:none;border-radius:8px;">Reset Password</a></p>
        <p>This link expires in 5 minutes.</p>
        <p>If you didn't request this, you can ignore this email.</p>
        <p>— Buffindia</p>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to send email" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Reset link sent to your email.",
    });
  } catch (error) {
    console.error("Forgot password request error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}
