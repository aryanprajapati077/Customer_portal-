import { NextResponse, type NextRequest } from "next/server"

const ADMIN_COOKIE = "buffindia_admin"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect all /admin routes except login
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next()
    const token = request.cookies.get(ADMIN_COOKIE)?.value
    if (!token) {
      const url = request.nextUrl.clone()
      url.pathname = "/admin/login"
      url.searchParams.set("next", pathname)
      return NextResponse.redirect(url)
    }
  }

  // Protect admin APIs (except login)
  if (pathname.startsWith("/api/admin")) {
    if (pathname === "/api/admin/login") return NextResponse.next()
    const token = request.cookies.get(ADMIN_COOKIE)?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}

