import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { sendNotificationEmail } from "@/lib/send-notification-email"
import { formatPortalDate } from "@/lib/portal-metrics"
import { computeRenewalDate, daysBetween } from "@/lib/admin-permissions"

async function ensureCols() {
  await sql.query(`
    ALTER TABLE "Customer"
      ADD COLUMN IF NOT EXISTS "serviceStatus" TEXT DEFAULT 'ACTIVE',
      ADD COLUMN IF NOT EXISTS "contractEndDate" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "serviceStartDate" TIMESTAMP(3)
  `)
}

type CustomerRenewalSource = {
  id: string
  companyName: string
  email: string
  primaryPocEmail?: string | null
  primaryPocName?: string | null
  contactPerson?: string | null
  lsuName?: string | null
  city?: string | null
  status: string
  serviceStatus?: string | null
  contractEndDate: string | Date | null
  serviceStartDate: string | Date | null
  joinDate?: string | Date | null
}

function buildRenewalRow(c: CustomerRenewalSource, asOf: Date) {
  const renewalDate = computeRenewalDate(
    c.serviceStartDate || c.joinDate,
    c.contractEndDate,
    asOf,
  )
  if (!renewalDate) return null
  const daysLeft = daysBetween(asOf, renewalDate)
  return {
    id: c.id,
    companyName: c.companyName,
    email: c.email,
    primaryPocEmail: c.primaryPocEmail,
    primaryPocName: c.primaryPocName,
    contactPerson: c.contactPerson,
    lsuName: c.lsuName,
    city: c.city,
    status: c.status,
    serviceStatus: c.serviceStatus,
    contractEndDate: renewalDate.toISOString(),
    serviceStartDate: c.serviceStartDate || c.joinDate || null,
    daysLeft,
    renewalSource: c.contractEndDate ? "contractEndDate" : "serviceStart+1y",
  }
}

export async function GET() {
  try {
    await ensureCols()
    const asOf = new Date()

    const customers = (await sql`
      SELECT id, "companyName", email, "primaryPocEmail", "primaryPocName", "contactPerson",
             "lsuName", city, status, "serviceStatus", "contractEndDate",
             "serviceStartDate", "joinDate"
      FROM "Customer"
      WHERE COALESCE(status, 'Active') ILIKE 'active'
        AND (
          "serviceStartDate" IS NOT NULL
          OR "joinDate" IS NOT NULL
          OR "contractEndDate" IS NOT NULL
        )
      ORDER BY id ASC
    `) as CustomerRenewalSource[]

    const upcoming = []
    const pending = []

    for (const c of customers) {
      const row = buildRenewalRow(c, asOf)
      if (!row) continue
      const flagged = ["RENEWAL_DUE", "PAUSED_RENEWAL", "PAUSED_PAYMENT"].includes(
        String(c.serviceStatus || "").toUpperCase(),
      )
      if (row.daysLeft < 0 || flagged) {
        pending.push(row)
      } else if (row.daysLeft <= 60) {
        upcoming.push(row)
      }
    }

    upcoming.sort((a, b) => a.daysLeft - b.daysLeft)
    pending.sort((a, b) => a.daysLeft - b.daysLeft)

    return NextResponse.json({
      success: true,
      upcoming,
      pending,
      counts: { upcoming: upcoming.length, pending: pending.length },
    })
  } catch (error) {
    console.error("Error fetching renewals:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureCols()
    const body = await request.json()
    const ids = Array.isArray(body?.customerIds)
      ? body.customerIds.map((x: unknown) => String(x)).filter(Boolean)
      : []
    const bucket = String(body?.bucket || "upcoming")

    if (!ids.length && bucket === "selected") {
      return NextResponse.json({ success: false, error: "Select at least one customer" }, { status: 400 })
    }

    const asOf = new Date()
    const customers = (ids.length
      ? await sql.query(
          `SELECT id, email, "primaryPocEmail", "companyName", "contactPerson", "primaryPocName",
                  "contractEndDate", "serviceStartDate", "joinDate", status, "serviceStatus"
           FROM "Customer"
           WHERE id = ANY($1::text[])`,
          [ids],
        )
      : await sql`
          SELECT id, email, "primaryPocEmail", "companyName", "contactPerson", "primaryPocName",
                 "contractEndDate", "serviceStartDate", "joinDate", status, "serviceStatus"
          FROM "Customer"
          WHERE COALESCE(status, 'Active') ILIKE 'active'
            AND (
              "serviceStartDate" IS NOT NULL
              OR "joinDate" IS NOT NULL
              OR "contractEndDate" IS NOT NULL
            )
        `) as CustomerRenewalSource[]

    const targets = []
    for (const c of customers) {
      const row = buildRenewalRow(c, asOf)
      if (!row) continue
      const flagged = ["RENEWAL_DUE", "PAUSED_RENEWAL", "PAUSED_PAYMENT"].includes(
        String(c.serviceStatus || "").toUpperCase(),
      )
      if (ids.length) {
        targets.push({ ...c, renewal: row })
        continue
      }
      if (bucket === "pending" && (row.daysLeft < 0 || flagged)) {
        targets.push({ ...c, renewal: row })
      } else if (bucket !== "pending" && row.daysLeft >= 0 && row.daysLeft <= 60 && !flagged) {
        targets.push({ ...c, renewal: row })
      }
    }

    let sent = 0
    let failed = 0
    const errors: { id: string; error: string }[] = []

    for (const row of targets) {
      const to = String(row.primaryPocEmail || row.email || "")
        .toLowerCase()
        .trim()
      if (!to.includes("@")) {
        failed++
        errors.push({ id: row.id, error: "No email" })
        continue
      }
      try {
        await sendNotificationEmail({
          templateId: "service_renewal",
          to,
          vars: {
            name:
              (row.primaryPocName || row.contactPerson || "").split(" ")[0] ||
              row.companyName ||
              "Partner",
            company: row.companyName,
            renewalDate: formatPortalDate(row.renewal.contractEndDate),
            daysLeft: String(row.renewal.daysLeft),
            customerId: row.id,
          },
        })
        if (row.renewal.daysLeft <= 30) {
          await sql`
            UPDATE "Customer"
            SET "serviceStatus" = CASE
                  WHEN ${row.renewal.daysLeft} < 0 THEN 'PAUSED_RENEWAL'
                  ELSE 'RENEWAL_DUE'
                END,
                "updatedAt" = CURRENT_TIMESTAMP
            WHERE id = ${row.id}
              AND COALESCE("serviceStatus", 'ACTIVE') = 'ACTIVE'
          `
        }
        sent++
      } catch (err) {
        failed++
        errors.push({
          id: row.id,
          error: err instanceof Error ? err.message : "Send failed",
        })
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: targets.length,
      errors: errors.slice(0, 20),
      message: `Renewal emails queued for ${sent} of ${targets.length} client(s).`,
    })
  } catch (error) {
    console.error("Error sending renewal emails:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
