import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyPassword, hashPassword } from "@/lib/password"
import { createHash } from "crypto"
import { ADMIN_COOKIE } from "@/lib/auth-session"

function hashEnvPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex")
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    if (!password) {
      return NextResponse.json({ success: false, error: "Password required" }, { status: 400 })
    }

    const cred = await prisma.adminCredential.findUnique({ where: { id: "admin" } })
    let valid = false

    if (cred) {
      valid = await verifyPassword(password, cred.passwordHash)
    } else {
      const envPass = process.env.ADMIN_PASSWORD
      if (!envPass) {
        return NextResponse.json({ success: false, error: "Admin not configured" }, { status: 503 })
      }
      valid = hashEnvPassword(password) === hashEnvPassword(envPass)
    }

    if (!valid) {
      return NextResponse.json({ success: false, error: "Invalid password" }, { status: 401 })
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set(ADMIN_COOKIE, "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    })
    return response
  } catch (error) {
    console.error("Admin login error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
