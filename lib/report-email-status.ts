import { sql } from "@/lib/db"
import { ensureEmailDeliveryLogTable } from "@/lib/email-delivery-log"
import { ensureReportSendTables } from "@/lib/report-send-job"
import { getCollectionStatsByCustomer, getReportSendBlockReasonSync } from "@/lib/report-eligibility"
import { resolveReportRecipients } from "@/lib/report-recipients"

export type ReportEmailStatusKind = "sent" | "pending" | "queued" | "failed" | "not_eligible"

export type ReportEmailStatusRow = {
  customerId: string
  companyName: string
  emailTo: string | null
  status: ReportEmailStatusKind
  emailStatus: string | null
  reason: string | null
  sentAt: string | null
}

export type ReportEmailStatusSummary = {
  total: number
  sent: number
  pending: number
  queued: number
  failed: number
  not_eligible: number
}

const SENT_STATUSES = new Set(["sent", "delivered", "opened", "clicked"])
const FAILED_STATUSES = new Set(["failed", "bounced", "complained"])
const QUEUED_STATUSES = new Set(["queued", "delayed", "received"])

const STATUS_RANK: Record<string, number> = {
  clicked: 70,
  opened: 60,
  delivered: 50,
  sent: 40,
  delayed: 20,
  received: 15,
  queued: 10,
  failed: -30,
  bounced: -40,
  complained: -50,
}

type DeliveryLogRow = {
  customerId: string
  status: string
  email: string
  error: string | null
  updatedAt: string
  deliveredAt: string | null
}

type SendItemRow = {
  customerId: string
  status: string
  error: string | null
}

type CustomerRow = {
  id: string
  email: string
  companyName: string
  status: string
  serviceStatus?: string | null
  joinDate?: string | Date | null
  serviceStartDate?: string | Date | null
  collectionFrequency?: string | null
  primaryPocEmail?: string | null
  collectionPocs?: string | null
}

function pickBestDelivery(rows: DeliveryLogRow[]): DeliveryLogRow | null {
  if (!rows.length) return null
  return rows.reduce((best, row) => {
    const rank = STATUS_RANK[row.status] ?? 0
    const bestRank = STATUS_RANK[best.status] ?? 0
    if (rank > bestRank) return row
    if (rank === bestRank && new Date(row.updatedAt).getTime() > new Date(best.updatedAt).getTime()) {
      return row
    }
    return best
  })
}

function deriveStatus(
  delivery: DeliveryLogRow | null,
  sendItem: SendItemRow | null,
  blockReason: string | null,
  hasEmail: boolean,
): { status: ReportEmailStatusKind; reason: string | null } {
  const deliveryStatus = delivery?.status || null

  if (deliveryStatus && SENT_STATUSES.has(deliveryStatus)) {
    return { status: "sent", reason: null }
  }
  if (deliveryStatus && FAILED_STATUSES.has(deliveryStatus)) {
    return { status: "failed", reason: delivery?.error || null }
  }
  if (
    sendItem?.status === "pending" ||
    sendItem?.status === "sending" ||
    (deliveryStatus && QUEUED_STATUSES.has(deliveryStatus))
  ) {
    return { status: "queued", reason: sendItem?.error || delivery?.error || "In send queue" }
  }
  if (sendItem?.status === "failed") {
    return { status: "failed", reason: sendItem.error || "Send failed" }
  }
  if (blockReason) {
    return { status: "not_eligible", reason: blockReason }
  }
  if (!hasEmail) {
    return { status: "not_eligible", reason: "No email" }
  }
  return { status: "pending", reason: null }
}

export async function getReportEmailStatus(
  period: string,
  options?: { status?: string; q?: string },
): Promise<{ period: string; summary: ReportEmailStatusSummary; rows: ReportEmailStatusRow[] }> {
  await ensureEmailDeliveryLogTable()
  await ensureReportSendTables()

  const customers = (await sql`
    SELECT id, email, "companyName", status, "serviceStatus", "joinDate",
           "serviceStartDate", "collectionFrequency",
           "primaryPocEmail", "collectionPocs"
    FROM "Customer"
    WHERE status = 'Active'
    ORDER BY "companyName" ASC
  `) as CustomerRow[]

  const [collectionStats, deliveryRows, sendItemRows] = await Promise.all([
    getCollectionStatsByCustomer(period),
    sql`
      SELECT "customerId", status, email, error, "updatedAt", "deliveredAt"
      FROM "EmailDeliveryLog"
      WHERE kind = 'esg_report'
        AND period = ${period}
        AND "customerId" IS NOT NULL
      ORDER BY "updatedAt" DESC
    ` as Promise<DeliveryLogRow[]>,
    sql`
      SELECT DISTINCT ON (i."customerId")
        i."customerId", i.status, i.error
      FROM "ReportSendItem" i
      JOIN "ReportSendJob" j ON j.id = i."jobId"
      WHERE j.period = ${period}
      ORDER BY i."customerId", i."updatedAt" DESC
    ` as Promise<SendItemRow[]>,
  ])

  const deliveriesByCustomer = new Map<string, DeliveryLogRow[]>()
  for (const row of deliveryRows) {
    const list = deliveriesByCustomer.get(row.customerId) || []
    list.push(row)
    deliveriesByCustomer.set(row.customerId, list)
  }

  const sendItemsByCustomer = new Map(sendItemRows.map((row) => [row.customerId, row]))

  const rows: ReportEmailStatusRow[] = customers.map((customer) => {
    const delivery = pickBestDelivery(deliveriesByCustomer.get(customer.id) || [])
    const sendItem = sendItemsByCustomer.get(customer.id) || null
    const recipients = resolveReportRecipients(customer)
    const blockReason = getReportSendBlockReasonSync(
      period,
      customer,
      collectionStats.get(customer.id),
    )
    const { status, reason } = deriveStatus(
      delivery,
      sendItem,
      blockReason,
      Boolean(recipients.to),
    )

    return {
      customerId: customer.id,
      companyName: customer.companyName,
      emailTo: recipients.to || null,
      status,
      emailStatus: delivery?.status || null,
      reason,
      sentAt: delivery?.deliveredAt || delivery?.updatedAt || null,
    }
  })

  const summary: ReportEmailStatusSummary = {
    total: rows.length,
    sent: 0,
    pending: 0,
    queued: 0,
    failed: 0,
    not_eligible: 0,
  }
  for (const row of rows) {
    summary[row.status] += 1
  }

  const statusFilter = options?.status || "all"
  const q = (options?.q || "").trim().toLowerCase()

  let filtered = rows
  if (statusFilter !== "all") {
    filtered = filtered.filter((row) => row.status === statusFilter)
  }
  if (q) {
    filtered = filtered.filter((row) => {
      const hay = [row.customerId, row.companyName, row.emailTo, row.reason, row.emailStatus]
        .map((v) => String(v || "").toLowerCase())
        .join(" ")
      return hay.includes(q)
    })
  }

  return { period, summary, rows: filtered }
}
