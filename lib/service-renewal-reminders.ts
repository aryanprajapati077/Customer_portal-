import { sql } from "@/lib/db"
import { sendNotificationEmail } from "@/lib/send-notification-email"
import { formatPortalDate } from "@/lib/portal-metrics"

export type RenewalReminderResult = {
  customerId: string
  email: string
  daysLeft: number
  status: "sent" | "queued" | "skipped" | "failed"
  error?: string
}

/** Email customers whose contract ends in exactly 30, 15, or 7 days. */
export async function runServiceRenewalReminders(options?: {
  dryRun?: boolean
}): Promise<{ dryRun: boolean; sent: number; results: RenewalReminderResult[] }> {
  const dryRun = Boolean(options?.dryRun)

  await sql.query(`
    ALTER TABLE "Customer"
      ADD COLUMN IF NOT EXISTS "serviceStatus" TEXT DEFAULT 'ACTIVE',
      ADD COLUMN IF NOT EXISTS "contractEndDate" TIMESTAMP(3)
  `)

  const windows = [30, 15, 7]
  const results: RenewalReminderResult[] = []

  for (const days of windows) {
    const rows = await sql`
      SELECT id, email, "primaryPocEmail", "companyName", "contactPerson", "contractEndDate"
      FROM "Customer"
      WHERE "contractEndDate" IS NOT NULL
        AND status = 'Active'
        AND DATE("contractEndDate") = (CURRENT_DATE + (${days}::int) * INTERVAL '1 day')::date
    `

    for (const row of rows as {
      id: string
      email: string
      primaryPocEmail?: string | null
      companyName: string
      contactPerson?: string | null
      contractEndDate: string | Date
    }[]) {
      const to = String(row.primaryPocEmail || row.email || "")
        .toLowerCase()
        .trim()
      if (!to.includes("@")) {
        results.push({
          customerId: row.id,
          email: row.email,
          daysLeft: days,
          status: "skipped",
          error: "No email",
        })
        continue
      }

      if (dryRun) {
        results.push({ customerId: row.id, email: to, daysLeft: days, status: "skipped" })
        continue
      }

      try {
        await sendNotificationEmail({
          templateId: "service_renewal",
          to,
          vars: {
            name: row.contactPerson?.split(" ")[0] || row.companyName || "Partner",
            company: row.companyName,
            renewalDate: formatPortalDate(row.contractEndDate),
            daysLeft: String(days),
            customerId: row.id,
          },
        })
        if (days <= 30) {
          await sql`
            UPDATE "Customer"
            SET "serviceStatus" = 'RENEWAL_DUE', "updatedAt" = CURRENT_TIMESTAMP
            WHERE id = ${row.id}
              AND COALESCE("serviceStatus", 'ACTIVE') = 'ACTIVE'
          `
        }
        results.push({ customerId: row.id, email: to, daysLeft: days, status: "queued" })
      } catch (err) {
        results.push({
          customerId: row.id,
          email: to,
          daysLeft: days,
          status: "failed",
          error: err instanceof Error ? err.message : "Send failed",
        })
      }
    }
  }

  return {
    dryRun,
    sent: results.filter((r) => r.status === "queued" || r.status === "sent").length,
    results,
  }
}

export async function listUpcomingRenewals() {
  await sql.query(`
    ALTER TABLE "Customer"
      ADD COLUMN IF NOT EXISTS "contractEndDate" TIMESTAMP(3)
  `)
  return sql`
    SELECT id, "companyName", email, "primaryPocEmail", "contractEndDate",
           (DATE("contractEndDate") - CURRENT_DATE) AS days_left
    FROM "Customer"
    WHERE "contractEndDate" IS NOT NULL
      AND status = 'Active'
      AND DATE("contractEndDate") BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')
    ORDER BY "contractEndDate" ASC
    LIMIT 100
  `
}
