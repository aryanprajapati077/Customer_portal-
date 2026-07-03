import { NextResponse } from "next/server"
import { CUSTOMER_COOKIE } from "@/lib/auth-session"

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.set(CUSTOMER_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 })
  return response
}
