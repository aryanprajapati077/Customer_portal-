import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sql } from "@/lib/db"
import { hashPassword } from "@/lib/password"
import { CUSTOMER_COOKIE, verifyCustomerSession } from "@/lib/auth-session"

async function ensurePortalUsersTable() {
  await sql.query(`
    CREATE TABLE IF NOT EXISTS "CustomerPortalUser" (
      id TEXT PRIMARY KEY,
      "customerId" TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      password TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await sql.query(`
    CREATE INDEX IF NOT EXISTS "CustomerPortalUser_customerId_idx"
    ON "CustomerPortalUser" ("customerId")
  `)
}

async function requireCustomerId() {
  const jar = await cookies()
  return verifyCustomerSession(jar.get(CUSTOMER_COOKIE)?.value)
}

export async function GET() {
  try {
    const customerId = await requireCustomerId()
    if (!customerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    await ensurePortalUsersTable()
    const users = await sql`
      SELECT id, name, email, "createdAt"
      FROM "CustomerPortalUser"
      WHERE "customerId" = ${customerId} AND active = true
      ORDER BY "createdAt" DESC
    `
    return NextResponse.json({ success: true, users })
  } catch (error) {
    console.error("portal-users GET:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const customerId = await requireCustomerId()
    if (!customerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    await ensurePortalUsersTable()

    const body = await request.json()
    const email = String(body?.email || "")
      .toLowerCase()
      .trim()
    const name = String(body?.name || "").trim()
    const password = String(body?.password || "")

    if (!email.includes("@") || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Valid email and password (min 6 chars) required" },
        { status: 400 },
      )
    }

    const existingCustomer = await sql`
      SELECT id FROM "Customer" WHERE lower(email) = ${email} LIMIT 1
    `
    if (existingCustomer[0]) {
      return NextResponse.json(
        { success: false, error: "This email already has a customer login" },
        { status: 409 },
      )
    }

    const existingUser = await sql`
      SELECT id FROM "CustomerPortalUser" WHERE lower(email) = ${email} LIMIT 1
    `
    if (existingUser[0]) {
      return NextResponse.json(
        { success: false, error: "This email already has portal access" },
        { status: 409 },
      )
    }

    const id = `cpu_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const passwordHash = await hashPassword(password)
    const rows = await sql`
      INSERT INTO "CustomerPortalUser" (id, "customerId", email, name, password, active)
      VALUES (${id}, ${customerId}, ${email}, ${name || null}, ${passwordHash}, true)
      RETURNING id, name, email, "createdAt"
    `

    return NextResponse.json({ success: true, user: rows[0] })
  } catch (error) {
    console.error("portal-users POST:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const customerId = await requireCustomerId()
    if (!customerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    await ensurePortalUsersTable()
    const id = request.nextUrl.searchParams.get("id")
    if (!id) {
      return NextResponse.json({ success: false, error: "id required" }, { status: 400 })
    }
    await sql`
      UPDATE "CustomerPortalUser"
      SET active = false, "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${id} AND "customerId" = ${customerId}
    `
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("portal-users DELETE:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
