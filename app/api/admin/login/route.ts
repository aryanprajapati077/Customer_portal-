import { NextResponse, type NextRequest } from "next/server"
import { createHash, timingSafeEqual } from "crypto"

const ADMIN_COOKIE = "buffindia_admin"

function sha256(input: string) {
  return createHash("sha256").update(input).digest("hex")
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    const expected = process.env.ADMIN_PASSWORD

    if (!expected) {
      return NextResponse.json({ success: false, error: "ADMIN_PASSWORD not configured" }, { status: 500 })
    }

    if (typeof password !== "string") {
      return NextResponse.json({ success: false, error: "Password required" }, { status: 400 })
    }

    const a = Buffer.from(sha256(password))
    const b = Buffer.from(sha256(expected))
    const ok = a.length === b.length && timingSafeEqual(a, b)

    if (!ok) {
      return NextResponse.json({ success: false, error: "Invalid password" }, { status: 401 })
    }

    const res = NextResponse.json({ success: true })
    res.cookies.set(ADMIN_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
    return res
  } catch (error) {
    console.error("Admin login error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

