import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sql } from "@/lib/db"
import { hashPassword, verifyPassword, isPasswordHashed } from "@/lib/password"
import { CUSTOMER_COOKIE, signCustomerSession } from "@/lib/auth-session"
import { PORTAL_SESSION_COOKIE, startPortalSession } from "@/lib/portal-analytics"

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

async function attachPortalSession(
  response: NextResponse,
  request: NextRequest,
  customer: { id: string; email: string; companyName: string },
) {
  try {
    const sessionId = await startPortalSession({
      customerId: customer.id,
      email: customer.email,
      companyName: customer.companyName,
      userAgent: request.headers.get("user-agent"),
      ip: clientIp(request),
      path: "/dashboard",
    })
    response.cookies.set(PORTAL_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })
  } catch (err) {
    console.error("Portal session start failed:", err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 })
    }

    const normalizedEmail = String(email).toLowerCase().trim()

    const customer = await prisma.customer.findUnique({
      where: { email: normalizedEmail },
    })

    if (customer) {
      const valid = await verifyPassword(password, customer.password)
      if (!valid) {
        return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 })
      }

      if (!isPasswordHashed(customer.password)) {
        await prisma.customer.update({
          where: { id: customer.id },
          data: { password: await hashPassword(password) },
        })
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

      response.cookies.set(CUSTOMER_COOKIE, await signCustomerSession(customer.id), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      })
      await attachPortalSession(response, request, {
        id: customer.id,
        email: customer.email,
        companyName: customer.companyName,
      })
      return response
    }

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

    response.cookies.set(CUSTOMER_COOKIE, await signCustomerSession(org.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })
    await attachPortalSession(response, request, {
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
