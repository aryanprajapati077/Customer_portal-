import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Token and new password are required" },
        { status: 400 },
      );
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { customer: true },
    });

    if (!resetToken) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 400 },
      );
    }

    if (resetToken.expireAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
      return NextResponse.json(
        { success: false, error: "Token has expired" },
        { status: 400 },
      );
    }

    await prisma.$transaction([
      prisma.customer.update({
        where: { id: resetToken.customerId },
        data: { password: newPassword },
      }),
      prisma.passwordResetToken.delete({ where: { id: resetToken.id } }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}
