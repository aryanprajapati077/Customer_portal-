import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { CUSTOMER_COOKIE, verifyCustomerSession } from "@/lib/auth-session"
import {
  PORTAL_SESSION_COOKIE,
  endPortalSession,
} from "@/lib/portal-analytics"

export async function POST() {
  try {
    const jar = await cookies()
    const sessionId = jar.get(PORTAL_SESSION_COOKIE)?.value
    const customerId = await verifyCustomerSession(jar.get(CUSTOMER_COOKIE)?.value)
    await endPortalSession(sessionId, customerId, "logout")
  } catch (err) {
    console.error("Logout session end failed:", err)
  }

  const response = NextResponse.json({ success: true })
  const cleared = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  }
  response.cookies.set(CUSTOMER_COOKIE, "", cleared)
  response.cookies.set(PORTAL_SESSION_COOKIE, "", cleared)
  return response
}
