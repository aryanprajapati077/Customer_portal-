import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sql } from "@/lib/db"
import { hashPassword, verifyPassword, isPasswordHashed } from "@/lib/password"
import { CUSTOMER_COOKIE, customerSessionCookieOptions, signCustomerSession } from "@/lib/auth-session"
import {
  PORTAL_SESSION_COOKIE,
  createPortalSessionId,
  startPortalSession,
} from "@/lib/portal-analytics"
import { clientIpFromRequest, consumeRateLimit } from "@/lib/rate-limit"

async function findPortalUser(email: string) {
  try {
    const rows = await sql`
      SELECT id, "customerId", email, name, password, active
      FROM "CustomerPortalUser"
      WHERE lower(email) = ${email} AND active = true
      LIMIT 1
    `
    return (rows[0] as
      | {
          id: string
          customerId: string
          email: string
          name: string | null
          password: string
          active: boolean
        }
      | undefined) || null
  } catch {
    return null
  }
}

function clientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  )
}

/** Set analytics cookie immediately; persist session in background so login stays fast. */
function attachPortalSession(
  response: NextResponse,
  request: NextRequest,
  customer: { id: string; email: string; companyName: string },
) {
  const sessionId = createPortalSessionId()
  response.cookies.set(PORTAL_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
  void startPortalSession({
    sessionId,
    customerId: customer.id,
    email: customer.email,
    companyName: customer.companyName,
    userAgent: request.headers.get("user-agent"),
    ip: clientIp(request),
    path: "/dashboard",
  }).catch((err) => console.error("Portal session start failed:", err))
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 })
    }

    const normalizedEmail = String(email).toLowerCase().trim()
    const ip = clientIpFromRequest(request)
    const limited = consumeRateLimit(`login:${ip}:${normalizedEmail}`, 8, 60_000)
    if (!limited.ok) {
      return NextResponse.json(
        { success: false, error: "Too many login attempts. Please wait and try again." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
      )
    }

    const customer = await prisma.customer.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        password: true,
        companyName: true,
        contactPerson: true,
        phone: true,
        address: true,
        status: true,
        disposalUnitInstalled: true,
        totalWasteCollected: true,
        cigaretteButtsCollected: true,
        microplasticsUpcycled: true,
        waterResourcesProtected: true,
        pendingCollection: true,
        certificatesEarned: true,
        co2Saved: true,
        kraftrebornCredits: true,
        treesEquivalent: true,
        isGroup: true,
        parentCustomerId: true,
        serviceStartDate: true,
        primaryPocName: true,
        joinDate: true,
        monthlyTarget: true,
        industry: true,
        employeeCount: true,
      },
    })

    if (customer) {
      const valid = await verifyPassword(password, customer.password)
      if (!valid) {
        return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 })
      }

      if (!isPasswordHashed(customer.password)) {
        await prisma.customer
          .update({
            where: { id: customer.id },
            data: { password: await hashPassword(password) },
          })
          .catch((err) => console.error("Password upgrade failed:", err))
      }

      const { password: _, ...customerData } = customer
      const response = NextResponse.json({
        success: true,
        customer: {
          ...customerData,
          disposalUnitInstalled: customerData.disposalUnitInstalled ?? 0,
          totalWasteCollected: customerData.totalWasteCollected || 0,
          cigaretteButtsCollected: customerData.cigaretteButtsCollected || 0,
          microplasticsUpcycled: customerData.microplasticsUpcycled || 0,
          waterResourcesProtected: customerData.waterResourcesProtected || 0,
          pendingCollection: customerData.pendingCollection || 0,
          certificatesEarned: customerData.certificatesEarned || 0,
          co2Saved: customerData.co2Saved || 0,
          kraftrebornCredits: customerData.kraftrebornCredits || 0,
          treesEquivalent: customerData.treesEquivalent || 0,
          isGroup: customerData.isGroup ?? false,
          parentCustomerId: customerData.parentCustomerId ?? null,
        },
      })

      response.cookies.set(CUSTOMER_COOKIE, await signCustomerSession(customer.id), customerSessionCookieOptions())
      attachPortalSession(response, request, {
        id: customer.id,
        email: customer.email,
        companyName: customer.companyName,
      })
      return response
    }

    // Keep timing similar when email unknown
    await verifyPassword(password, "")

    const portalUser = await findPortalUser(normalizedEmail)
    if (!portalUser) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 })
    }

    const validPortal = await verifyPassword(password, portalUser.password)
    if (!validPortal) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 })
    }

    const org = await prisma.customer.findUnique({ where: { id: portalUser.customerId } })
    if (!org) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 })
    }

    const { password: _, ...customerData } = org
    const response = NextResponse.json({
      success: true,
      customer: {
        ...customerData,
        contactPerson: portalUser.name || customerData.contactPerson,
        email: portalUser.email,
        disposalUnitInstalled: customerData.disposalUnitInstalled ?? 0,
        totalWasteCollected: customerData.totalWasteCollected || 0,
        cigaretteButtsCollected: customerData.cigaretteButtsCollected || 0,
        microplasticsUpcycled: customerData.microplasticsUpcycled || 0,
        waterResourcesProtected: customerData.waterResourcesProtected || 0,
        pendingCollection: customerData.pendingCollection || 0,
        certificatesEarned: customerData.certificatesEarned || 0,
        co2Saved: customerData.co2Saved || 0,
        kraftrebornCredits: customerData.kraftrebornCredits || 0,
        treesEquivalent: customerData.treesEquivalent || 0,
        isGroup: customerData.isGroup ?? false,
        parentCustomerId: customerData.parentCustomerId ?? null,
      },
    })

    response.cookies.set(CUSTOMER_COOKIE, await signCustomerSession(org.id), customerSessionCookieOptions())
    attachPortalSession(response, request, {
      id: org.id,
      email: portalUser.email,
      companyName: org.companyName,
    })
    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
