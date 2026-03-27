import { NextResponse } from "next/server"

const ADMIN_COOKIE = "buffindia_admin"

export async function POST() {
  const res = NextResponse.json({ success: true })
  res.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 })
  return res
}

