import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token is required" },
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

    return NextResponse.json({
      success: true,
      email: resetToken.email,
    });
  } catch (error) {
    console.error("Verify token error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}
