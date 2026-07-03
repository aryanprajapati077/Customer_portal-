import { NextResponse, type NextRequest } from "next/server"
import { CUSTOMER_COOKIE, verifyCustomerSession } from "@/lib/auth-session"

const ADMIN_COOKIE = "buffindia_admin"

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

  if (pathname.startsWith("/api/customer")) {
    const session = request.cookies.get(CUSTOMER_COOKIE)?.value
    if (!(await verifyCustomerSession(session))) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
  }

  if (pathname.startsWith("/admin")) {
    if (
      pathname === "/admin/login" ||
      pathname === "/admin/forgot-password" ||
      pathname === "/admin/reset-password"
    ) {
      return NextResponse.next()
    }
    const token = request.cookies.get(ADMIN_COOKIE)?.value
    if (!token) {
      const url = request.nextUrl.clone()
      url.pathname = "/admin/login"
      url.searchParams.set("next", pathname)
      return NextResponse.redirect(url)
    }
  }

  if (pathname.startsWith("/api/admin")) {
    const publicAdmin = [
      "/api/admin/login",
      "/api/admin/forgot-password",
      "/api/admin/verify-otp",
      "/api/admin/reset-password",
    ]
    if (publicAdmin.includes(pathname)) return NextResponse.next()

    const token = request.cookies.get(ADMIN_COOKIE)?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/customer/:path*", "/admin/:path*", "/api/admin/:path*"],
}
