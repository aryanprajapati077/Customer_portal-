import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { hashPassword } from "@/lib/password"
import { generatePortalPassword, sendWelcomeEmail } from "@/lib/welcome-email"
import { queueEmail } from "@/lib/email-queue"

async function ensureWelcomeColumn() {
  await sql.query(`
    ALTER TABLE "Customer"
      ADD COLUMN IF NOT EXISTS "welcomeEmailSentAt" TIMESTAMP(3)
  `)
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
 * Bulk-send welcome emails.
 * Default: only customers who have not received welcome yet.
 * Body: { onlyPending?: boolean } — default true
 */
export async function POST(request: NextRequest) {
  try {
    await ensureWelcomeColumn()
    const body = await request.json().catch(() => ({}))
    const onlyPending = body?.onlyPending !== false

    const customers = onlyPending
      ? ((await sql`
          SELECT id, email, "companyName", "primaryPocName", "contactPerson", "welcomeEmailSentAt"
          FROM "Customer"
          WHERE COALESCE("isGroup", false) = false
            AND "welcomeEmailSentAt" IS NULL
            AND email IS NOT NULL
            AND email LIKE '%@%'
          ORDER BY "companyName" ASC
        `) as {
          id: string
          email: string
          companyName: string
          primaryPocName: string | null
          contactPerson: string | null
        }[])
      : ((await sql`
          SELECT id, email, "companyName", "primaryPocName", "contactPerson", "welcomeEmailSentAt"
          FROM "Customer"
          WHERE COALESCE("isGroup", false) = false
            AND email IS NOT NULL
            AND email LIKE '%@%'
          ORDER BY "companyName" ASC
        `) as {
          id: string
          email: string
          companyName: string
          primaryPocName: string | null
          contactPerson: string | null
        }[])

    if (customers.length === 0) {
      return NextResponse.json({
        success: true,
        queued: 0,
        total: 0,
        message: onlyPending
          ? "No pending clients — all welcome emails already sent (or no customers yet)."
          : "No customers found.",
      })
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

      queueEmail(`welcome-${customer.id}`, () =>
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
      message: `Welcome emails queued for ${queued} client(s). New temporary passwords were set.`,
    })
  } catch (error) {
    console.error("Bulk welcome email error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
