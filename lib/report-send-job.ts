import { sql } from "@/lib/db"
import { formatReportingPeriod } from "@/lib/esg-metrics"
import { resolveReportRecipients } from "@/lib/report-recipients"
import {
  getAlreadySentReportCustomerIds,
  getCollectionStatsByCustomer,
  getReportSendBlockReasonSync,
} from "@/lib/report-eligibility"
import { loadReportCustomer, sendEsgReportEmail, type ReportCustomerRow } from "@/lib/send-esg-report-email"
import { logEmailDelivery } from "@/lib/email-delivery-log"

export type ReportSendJob = {
  id: string
  period: string
  status: string
  total: number
  sent: number
  failed: number
  skipped: number
  createdAt?: string
  updatedAt?: string
  error?: string | null
}

const BATCH_SIZE = 4
const MAX_ATTEMPTS = 3

export async function ensureReportSendTables() {
  await sql.query(`
    CREATE TABLE IF NOT EXISTS "ReportSendJob" (
      id TEXT PRIMARY KEY,
      period TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      total INTEGER NOT NULL DEFAULT 0,
      sent INTEGER NOT NULL DEFAULT 0,
      failed INTEGER NOT NULL DEFAULT 0,
      skipped INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      error TEXT
    )
  `)
  await sql.query(`
    CREATE TABLE IF NOT EXISTS "ReportSendItem" (
      id TEXT PRIMARY KEY,
      "jobId" TEXT NOT NULL,
      "customerId" TEXT NOT NULL,
      email TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0,
      error TEXT,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await sql.query(`
    CREATE INDEX IF NOT EXISTS "ReportSendItem_job_status_idx"
    ON "ReportSendItem" ("jobId", status)
  `)
}

export async function getActiveReportSendJob(period?: string): Promise<ReportSendJob | null> {
  await ensureReportSendTables()
  const rows = period
    ? await sql`
        SELECT * FROM "ReportSendJob"
        WHERE period = ${period} AND status IN ('queued', 'running')
        ORDER BY "createdAt" DESC
        LIMIT 1
      `
    : await sql`
        SELECT * FROM "ReportSendJob"
        WHERE status IN ('queued', 'running')
        ORDER BY "createdAt" DESC
        LIMIT 1
      `
  return (rows[0] as ReportSendJob | undefined) || null
}

export async function getLatestReportSendJob(period?: string): Promise<ReportSendJob | null> {
  await ensureReportSendTables()
  const rows = period
    ? await sql`SELECT * FROM "ReportSendJob" WHERE period = ${period} ORDER BY "createdAt" DESC LIMIT 1`
    : await sql`SELECT * FROM "ReportSendJob" ORDER BY "createdAt" DESC LIMIT 1`
  return (rows[0] as ReportSendJob | undefined) || null
}

export async function enqueueBulkReportSend(period: string, rows: ReportCustomerRow[]) {
  await ensureReportSendTables()
  const existing = await getActiveReportSendJob(period)
  if (existing) {
    return { job: existing, queued: existing.total - existing.sent - existing.failed, reused: true, skipped: existing.skipped }
  }

  const [collectionStats, alreadySent] = await Promise.all([
    getCollectionStatsByCustomer(period),
    getAlreadySentReportCustomerIds(period),
  ])

  const toSend: ReportCustomerRow[] = []
  let skipped = 0
  for (const row of rows) {
    const block = getReportSendBlockReasonSync(period, row, collectionStats.get(row.id))
    if (block) {
      skipped += 1
      continue
    }
    if (!resolveReportRecipients(row).to) {
      skipped += 1
      continue
    }
    if (alreadySent.has(row.id)) {
      skipped += 1
      continue
    }
    toSend.push(row)
  }

  const id = `rsj_${period}_${Date.now()}`
  await sql`
    INSERT INTO "ReportSendJob" (id, period, status, total, sent, failed, skipped)
    VALUES (
      ${id},
      ${period},
      ${toSend.length ? "queued" : "completed"},
      ${toSend.length},
      ${0},
      ${0},
      ${skipped}
    )
  `

  await Promise.all(
    toSend.map((row) => {
      const itemId = `rsi_${id}_${row.id}`
      const email = resolveReportRecipients(row).to || row.email
      return sql`
        INSERT INTO "ReportSendItem" (id, "jobId", "customerId", email, status)
        VALUES (${itemId}, ${id}, ${row.id}, ${email}, ${"pending"})
      `
    }),
  )

  const job = {
    id,
    period,
    status: toSend.length ? "queued" : "completed",
    total: toSend.length,
    sent: 0,
    failed: 0,
    skipped,
  } as ReportSendJob

  return { job, queued: toSend.length, reused: false, skipped }
}

async function refreshJobCounts(jobId: string) {
  const counts = await sql<{ pending: number; sent: number; failed: number; sending: number }>`
    SELECT
      COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
      COUNT(*) FILTER (WHERE status = 'sent')::int AS sent,
      COUNT(*) FILTER (WHERE status = 'failed')::int AS failed,
      COUNT(*) FILTER (WHERE status = 'sending')::int AS sending
    FROM "ReportSendItem"
    WHERE "jobId" = ${jobId}
  `
  const c = counts[0] || { pending: 0, sent: 0, failed: 0, sending: 0 }
  const done = (c.pending || 0) === 0 && (c.sending || 0) === 0
  const status = done ? "completed" : "running"
  await sql`
    UPDATE "ReportSendJob"
    SET sent = ${c.sent || 0},
        failed = ${c.failed || 0},
        status = ${status},
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE id = ${jobId}
  `
  return { ...c, status }
}

async function claimPendingItems(limit: number) {
  await sql.query(`
    UPDATE "ReportSendItem"
    SET status = 'pending', "updatedAt" = CURRENT_TIMESTAMP
    WHERE status = 'sending'
      AND "updatedAt" < NOW() - INTERVAL '8 minutes'
  `)

  const claimed: { id: string; jobId: string; customerId: string; email: string | null; attempts: number }[] = []
  for (let i = 0; i < limit; i++) {
    const rows = await sql.query<{
      id: string
      jobId: string
      customerId: string
      email: string | null
      attempts: number
    }>(
      `
      UPDATE "ReportSendItem"
      SET status = 'sending',
          attempts = attempts + 1,
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = (
        SELECT i.id
        FROM "ReportSendItem" i
        JOIN "ReportSendJob" j ON j.id = i."jobId"
        WHERE i.status = 'pending'
          AND i.attempts < $1
          AND j.status IN ('queued', 'running')
        ORDER BY i."updatedAt" ASC
        LIMIT 1
      )
      AND status = 'pending'
      RETURNING id, "jobId", "customerId", email, attempts
    `,
      [MAX_ATTEMPTS],
    )
    if (!rows[0]) break
    claimed.push(rows[0])
  }
  return claimed
}

export async function processReportSendBatch(limit = BATCH_SIZE) {
  await ensureReportSendTables()
  const items = await claimPendingItems(limit)
  if (items.length === 0) {
    const active = await getActiveReportSendJob()
    if (active) await refreshJobCounts(active.id)
    return { processed: 0, remaining: 0, job: active }
  }

  const periodByJob = new Map<string, string>()
  for (const item of items) {
    if (!periodByJob.has(item.jobId)) {
      const jobs = await sql<{ period: string }>`SELECT period FROM "ReportSendJob" WHERE id = ${item.jobId} LIMIT 1`
      periodByJob.set(item.jobId, jobs[0]?.period || "")
    }
  }

  await Promise.all(
    items.map(async (item) => {
      const period = periodByJob.get(item.jobId) || ""
      const periodLabel = formatReportingPeriod(parsePeriodEnd(period))
      try {
        const row = await loadReportCustomer(item.customerId)
        if (!row) throw new Error("Customer not found")
        const to = await sendEsgReportEmail({ row, period, periodLabel })
        await sql`
          UPDATE "ReportSendItem"
          SET status = 'sent', error = NULL, "updatedAt" = CURRENT_TIMESTAMP
          WHERE id = ${item.id}
        `
        void to
      } catch (err) {
        const message = err instanceof Error ? err.message : "Send failed"
        const failed = item.attempts >= MAX_ATTEMPTS
        await sql`
          UPDATE "ReportSendItem"
          SET status = ${failed ? "failed" : "pending"},
              error = ${message},
              "updatedAt" = CURRENT_TIMESTAMP
          WHERE id = ${item.id}
        `
        await logEmailDelivery({
          customerId: item.customerId,
          email: item.email || "",
          emailRole: "to",
          kind: "esg_report",
          status: failed ? "failed" : "queued",
          error: message,
          period,
        })
      }
    }),
  )

  const jobIds = [...new Set(items.map((i) => i.jobId))]
  let lastJob: ReportSendJob | null = null
  for (const jobId of jobIds) {
    await refreshJobCounts(jobId)
    const rows = await sql`SELECT * FROM "ReportSendJob" WHERE id = ${jobId} LIMIT 1`
    lastJob = (rows[0] as ReportSendJob) || lastJob
  }

  const pending = await sql<{ n: number }>`
    SELECT COUNT(*)::int AS n FROM "ReportSendItem" WHERE status IN ('pending', 'sending')
  `
  return { processed: items.length, remaining: pending[0]?.n || 0, job: lastJob }
}

export async function drainReportSendJobs(maxMs = 240_000) {
  const started = Date.now()
  let processed = 0
  while (Date.now() - started < maxMs) {
    const result = await processReportSendBatch(BATCH_SIZE)
    processed += result.processed
    if (!result.processed || !result.remaining) break
  }
  return processed
}

function parsePeriodEnd(period: string): Date | undefined {
  const match = period.match(/^(\d{4})-(\d{2})$/)
  if (!match) return undefined
  const year = Number(match[1])
  const month = Number(match[2]) - 1
  return new Date(year, month + 1, 0, 23, 59, 59, 999)
}
