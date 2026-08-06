import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { hashPassword } from "@/lib/password"
import { generatePortalPassword, sendWelcomeEmail } from "@/lib/welcome-email"
import { queueEmail } from "@/lib/email-queue"
import { isEmailEnabled } from "@/lib/email-settings"

async function ensureWelcomeColumn() {
  await sql.query(`
    ALTER TABLE "Customer"
      ADD COLUMN IF NOT EXISTS "welcomeEmailSentAt" TIMESTAMP(3)
  `)
}

type WelcomeCustomer = {
  id: string
  email: string
  companyName: string
  primaryPocName: string | null
  contactPerson: string | null
  welcomeEmailSentAt?: string | Date | null
}

export async function GET() {
  try {
    await ensureWelcomeColumn()
    const [stats] = (await sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE "welcomeEmailSentAt" IS NULL)::int AS pending,
        COUNT(*) FILTER (WHERE "welcomeEmailSentAt" IS NOT NULL)::int AS sent
      FROM "Customer"
      WHERE COALESCE("isGroup", false) = false
    `) as { total: number; pending: number; sent: number }[]

    return NextResponse.json({
      success: true,
      total: stats?.total ?? 0,
      pending: stats?.pending ?? 0,
      sent: stats?.sent ?? 0,
    })
  } catch (error) {
    console.error("Welcome email stats error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

/**
 * Send welcome emails.
 * Body:
 *  - customerId?: string — single customer
 *  - customerIds?: string[] — subset
 *  - onlyPending?: boolean — default true (skip already-sent unless false / forceResend)
 *  - forceResend?: boolean — allow re-send (new temp password)
 */
export async function POST(request: NextRequest) {
  try {
    await ensureWelcomeColumn()
    const body = await request.json().catch(() => ({}))
    const forceResend = Boolean(body?.forceResend)
    const onlyPending = forceResend ? false : body?.onlyPending !== false
    const singleId = body?.customerId ? String(body.customerId).trim() : ""
    const idList = Array.isArray(body?.customerIds)
      ? body.customerIds.map((x: unknown) => String(x).trim()).filter(Boolean)
      : singleId
        ? [singleId]
        : []

    let customers: WelcomeCustomer[]

    if (idList.length > 0) {
      customers = await sql.query<WelcomeCustomer>(
        `SELECT id, email, "companyName", "primaryPocName", "contactPerson", "welcomeEmailSentAt"
         FROM "Customer"
         WHERE id = ANY($1::text[])
           AND COALESCE("isGroup", false) = false
           AND email IS NOT NULL
           AND email LIKE '%@%'
         ORDER BY "companyName" ASC`,
        [idList],
      )

      if (onlyPending) {
        customers = customers.filter((c) => !c.welcomeEmailSentAt)
      }

      if (idList.length === 1 && customers.length === 0) {
        const [row] = (await sql`
          SELECT id, email, "welcomeEmailSentAt", COALESCE("isGroup", false) AS "isGroup"
          FROM "Customer" WHERE id = ${idList[0]} LIMIT 1
        `) as { id: string; email: string | null; welcomeEmailSentAt: string | null; isGroup: boolean }[]

        if (!row) {
          return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 })
        }
        if (row.isGroup) {
          return NextResponse.json(
            { success: false, error: "Group accounts use the Group Clients welcome flow" },
            { status: 400 },
          )
        }
        if (!row.email || !String(row.email).includes("@")) {
          return NextResponse.json(
            { success: false, error: "Customer has no valid login email" },
            { status: 400 },
          )
        }
        if (onlyPending && row.welcomeEmailSentAt) {
          return NextResponse.json({
            success: false,
            error: "Welcome email already sent. Use Resend to send again with a new password.",
            alreadySent: true,
          }, { status: 409 })
        }
      }
    } else {
      customers = onlyPending
        ? ((await sql`
            SELECT id, email, "companyName", "primaryPocName", "contactPerson", "welcomeEmailSentAt"
            FROM "Customer"
            WHERE COALESCE("isGroup", false) = false
              AND "welcomeEmailSentAt" IS NULL
              AND email IS NOT NULL
              AND email LIKE '%@%'
            ORDER BY "companyName" ASC
          `) as WelcomeCustomer[])
        : ((await sql`
            SELECT id, email, "companyName", "primaryPocName", "contactPerson", "welcomeEmailSentAt"
            FROM "Customer"
            WHERE COALESCE("isGroup", false) = false
              AND email IS NOT NULL
              AND email LIKE '%@%'
            ORDER BY "companyName" ASC
          `) as WelcomeCustomer[])
    }

    if (customers.length === 0) {
      return NextResponse.json({
        success: true,
        queued: 0,
        total: 0,
        message: onlyPending
          ? "No pending clients — welcome email already sent (or no matching customers)."
          : "No customers found.",
      })
    }

    if (!(await isEmailEnabled("welcome_email"))) {
      return NextResponse.json(
        { success: false, error: "Welcome emails are turned off in Email On/Off settings." },
        { status: 403 },
      )
    }

    let queued = 0
    for (const customer of customers) {
      const to = String(customer.email || "")
        .toLowerCase()
        .trim()
      if (!to.includes("@")) continue

      const password = generatePortalPassword(10)
      const passwordHash = await hashPassword(password)
      await sql`
        UPDATE "Customer"
        SET password = ${passwordHash},
            "welcomeEmailSentAt" = CURRENT_TIMESTAMP,
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = ${customer.id}
      `

      const contactName =
        customer.primaryPocName || customer.contactPerson || customer.companyName || "Partner"

      queueEmail(`welcome-${customer.id}-${Date.now()}`, () =>
        sendWelcomeEmail({
          to,
          brandName: customer.companyName,
          contactName,
          customerId: customer.id,
          email: to,
          password,
        }),
      )
      queued++
    }

    return NextResponse.json({
      success: true,
      queued,
      total: customers.length,
      message:
        idList.length === 1
          ? `Welcome email queued for ${customers[0]?.companyName || idList[0]}. A new temporary password was set.`
          : `Welcome emails queued for ${queued} client(s). New temporary passwords were set.`,
    })
  } catch (error) {
    console.error("Bulk welcome email error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
