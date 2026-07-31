import { NextResponse, type NextRequest } from "next/server"
import { CUSTOMER_COOKIE, verifyCustomerSession } from "@/lib/auth-session"
import { verifyAdminSessionToken } from "@/lib/admin-auth"

const ADMIN_COOKIE = "buffindia_admin"

const ADMIN_PUBLIC = [
  "/admin/login",
  "/admin/forgot-password",
  "/admin/reset-password",
]

const ADMIN_API_PUBLIC = [
  "/api/admin/login",
  "/api/admin/verify-2fa",
  "/api/admin/forgot-password",
  "/api/admin/verify-otp",
  "/api/admin/reset-password",
  "/api/admin/logout",
]

function withSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/dashboard")) {
    const session = request.cookies.get(CUSTOMER_COOKIE)?.value
    if (!(await verifyCustomerSession(session))) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("next", pathname)
      return NextResponse.redirect(url)
    }
  }

  if (pathname.startsWith("/api/customer") || pathname.startsWith("/api/notifications")) {
    const session = request.cookies.get(CUSTOMER_COOKIE)?.value
    if (!(await verifyCustomerSession(session))) {
      return withSecurityHeaders(
        NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
      )
    }
  }

  if (pathname.startsWith("/api/support/ticket") && request.method === "GET") {
    const session = request.cookies.get(CUSTOMER_COOKIE)?.value
    if (!(await verifyCustomerSession(session))) {
      return withSecurityHeaders(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      )
    }
  }

  if (pathname.startsWith("/admin")) {
    if (ADMIN_PUBLIC.some((p) => pathname === p)) {
      return NextResponse.next()
    }
    const token = request.cookies.get(ADMIN_COOKIE)?.value
    if (!(await verifyAdminSessionToken(token))) {
      const url = request.nextUrl.clone()
      url.pathname = "/admin/login"
      url.searchParams.set("next", pathname)
      return NextResponse.redirect(url)
    }
  }

  if (pathname.startsWith("/api/admin")) {
    if (ADMIN_API_PUBLIC.includes(pathname)) return NextResponse.next()

    const token = request.cookies.get(ADMIN_COOKIE)?.value
    if (!(await verifyAdminSessionToken(token))) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
  }

  return withSecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/customer/:path*",
    "/api/notifications/:path*",
    "/api/support/ticket",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
}
