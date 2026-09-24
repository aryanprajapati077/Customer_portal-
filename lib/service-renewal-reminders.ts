import { sql } from "@/lib/db"
import { sendNotificationEmail } from "@/lib/send-notification-email"
import { formatPortalDate } from "@/lib/portal-metrics"
import { resolveRenewalRecipients } from "@/lib/report-recipients"
import { ensureRenewalCtaPointsToPublicPage } from "@/lib/renewal-response"

export type RenewalReminderResult = {
  customerId: string
  email: string
  daysLeft: number
  status: "sent" | "queued" | "skipped" | "failed"
  error?: string
}

export type ServiceStatusSyncResult = {
  pausedRenewal: number
  renewalDue: number
}

/**
 * Keep serviceStatus aligned with contractEndDate — independent of email success.
 * - Past renewal date → PAUSED_RENEWAL (from ACTIVE or RENEWAL_DUE)
 * - Within next 30 days → RENEWAL_DUE (from ACTIVE only)
 * Does not change PAUSED_PAYMENT / INACTIVE.
 */
export async function syncServiceStatusesFromContractDates(): Promise<ServiceStatusSyncResult> {
  await sql.query(`
    ALTER TABLE "Customer"
      ADD COLUMN IF NOT EXISTS "serviceStatus" TEXT DEFAULT 'ACTIVE',
      ADD COLUMN IF NOT EXISTS "contractEndDate" TIMESTAMP(3)
  `)

  const paused = await sql`
    UPDATE "Customer"
    SET "serviceStatus" = 'PAUSED_RENEWAL',
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "contractEndDate" IS NOT NULL
      AND COALESCE("isGroup", false) = false
      AND status = 'Active'
      AND DATE("contractEndDate") < CURRENT_DATE
      AND COALESCE("serviceStatus", 'ACTIVE') IN ('ACTIVE', 'RENEWAL_DUE')
    RETURNING id
  `

  const due = await sql`
    UPDATE "Customer"
    SET "serviceStatus" = 'RENEWAL_DUE',
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "contractEndDate" IS NOT NULL
      AND COALESCE("isGroup", false) = false
      AND status = 'Active'
      AND DATE("contractEndDate") >= CURRENT_DATE
      AND DATE("contractEndDate") <= (CURRENT_DATE + INTERVAL '30 days')
      AND COALESCE("serviceStatus", 'ACTIVE') = 'ACTIVE'
    RETURNING id
  `

  return {
    pausedRenewal: Array.isArray(paused) ? paused.length : 0,
    renewalDue: Array.isArray(due) ? due.length : 0,
  }
}

/** Email customers whose contract ends in exactly 30, 15, or 7 days. */
export async function runServiceRenewalReminders(options?: {
  dryRun?: boolean
}): Promise<{
  dryRun: boolean
  sent: number
  results: RenewalReminderResult[]
  statusSync: ServiceStatusSyncResult
}> {
  const dryRun = Boolean(options?.dryRun)

  await sql.query(`
    ALTER TABLE "Customer"
      ADD COLUMN IF NOT EXISTS "serviceStatus" TEXT DEFAULT 'ACTIVE',
      ADD COLUMN IF NOT EXISTS "contractEndDate" TIMESTAMP(3)
  `)
  await ensureRenewalCtaPointsToPublicPage()

  // Always sync statuses first so overdue clients pause even if email fails.
  const statusSync = dryRun
    ? { pausedRenewal: 0, renewalDue: 0 }
    : await syncServiceStatusesFromContractDates()

  const windows = [30, 15, 7]
  const results: RenewalReminderResult[] = []

  for (const days of windows) {
    const rows = await sql`
      SELECT id, email, "primaryPocEmail", "primaryPocEmailEnabled", "primaryPocStatus",
             "collectionPocs", "companyName", "contactPerson", "contractEndDate"
      FROM "Customer"
      WHERE "contractEndDate" IS NOT NULL
        AND status = 'Active'
        AND COALESCE("isGroup", false) = false
        AND DATE("contractEndDate") = (CURRENT_DATE + (${days}::int) * INTERVAL '1 day')::date
    `

    for (const row of rows as {
      id: string
      email: string
      primaryPocEmail?: string | null
      primaryPocEmailEnabled?: boolean | null
      primaryPocStatus?: string | null
      collectionPocs?: string | null
      companyName: string
      contactPerson?: string | null
      contractEndDate: string | Date
    }[]) {
      const { to, cc } = resolveRenewalRecipients(row)
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

      // Mark renewal due even if email later fails.
      if (days <= 30) {
        await sql`
          UPDATE "Customer"
          SET "serviceStatus" = 'RENEWAL_DUE', "updatedAt" = CURRENT_TIMESTAMP
          WHERE id = ${row.id}
            AND COALESCE("serviceStatus", 'ACTIVE') IN ('ACTIVE', 'RENEWAL_DUE')
            AND DATE("contractEndDate") >= CURRENT_DATE
        `
      }

      try {
        await sendNotificationEmail({
          templateId: "service_renewal",
          to,
          cc,
          vars: {
            name: row.contactPerson?.split(" ")[0] || row.companyName || "Partner",
            company: row.companyName,
            renewalDate: formatPortalDate(row.contractEndDate),
            daysLeft: String(days),
            customerId: row.id,
          },
        })
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
    statusSync,
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
