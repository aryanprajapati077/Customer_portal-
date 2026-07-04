import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminSession } from "@/lib/admin-auth-server"
import { generateTotpSecret, getTotpUri, verifyTotp } from "@/lib/admin-totp"

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: session.id },
    select: { totpEnabled: true, email: true, name: true },
  })

  return NextResponse.json({
    success: true,
    totpEnabled: user?.totpEnabled ?? false,
    email: user?.email,
  })
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const action = String(body.action || "setup")

    if (action === "setup") {
      const secret = generateTotpSecret()
      await prisma.adminUser.update({
        where: { id: session.id },
        data: { totpSecret: secret, totpEnabled: false },
      })
      const uri = getTotpUri(secret, session.email)
      return NextResponse.json({ success: true, secret, uri })
    }

    if (action === "enable") {
      const code = String(body.code || "").trim()
      const user = await prisma.adminUser.findUnique({ where: { id: session.id } })
      if (!user?.totpSecret) {
        return NextResponse.json({ success: false, error: "Run setup first" }, { status: 400 })
      }
      if (!(await verifyTotp(user.totpSecret, code))) {
        return NextResponse.json({ success: false, error: "Invalid code" }, { status: 400 })
      }
      await prisma.adminUser.update({
        where: { id: session.id },
        data: { totpEnabled: true },
      })
      return NextResponse.json({ success: true, message: "Authenticator enabled" })
    }

    if (action === "disable") {
      const code = String(body.code || "").trim()
      const user = await prisma.adminUser.findUnique({ where: { id: session.id } })
      if (!user?.totpSecret || !user.totpEnabled) {
        return NextResponse.json({ success: false, error: "Authenticator not enabled" }, { status: 400 })
      }
      if (!(await verifyTotp(user.totpSecret, code))) {
        return NextResponse.json({ success: false, error: "Invalid code" }, { status: 400 })
      }
      await prisma.adminUser.update({
        where: { id: session.id },
        data: { totpEnabled: false, totpSecret: null },
      })
      return NextResponse.json({ success: true, message: "Authenticator disabled" })
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 })
  } catch (error) {
    console.error("Admin TOTP error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
