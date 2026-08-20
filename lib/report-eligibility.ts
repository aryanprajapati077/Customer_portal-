import { sql } from "@/lib/db"
import {
  expectedCollectionsForMonth,
  isDueForMonth,
} from "@/lib/pending-collections"
import { normalizeServiceStatus } from "@/lib/service-status"

export function isCompletedCollectionStatus(status?: string | null): boolean {
  return String(status || "Completed").trim().toLowerCase() === "completed"
}

/** True when the client still has an open (non-completed) collection in the report month. */
export async function customerHasOpenCollectionForMonth(
  customerId: string,
  periodYm: string,
): Promise<boolean> {
  const rows = await sql<{ n: number }>`
    SELECT COUNT(*)::int AS n
    FROM "Collection"
    WHERE "customerId" = ${customerId}
      AND to_char(date, 'YYYY-MM') = ${periodYm}
      AND LOWER(COALESCE(status, 'completed')) <> 'completed'
  `
  return (rows[0]?.n || 0) > 0
}

/** True when a due client has fewer completed collections than expected for the month. */
export async function customerMissingCompletedCollectionForMonth(
  customerId: string,
  periodYm: string,
  frequency: string | null | undefined,
  serviceStart: Date | string | null | undefined,
): Promise<boolean> {
  if (!serviceStart) return false
  const start = new Date(serviceStart)
  if (Number.isNaN(start.getTime())) return false
  if (!isDueForMonth(frequency, start, periodYm)) return false

  const expected = expectedCollectionsForMonth(frequency)
  const rows = await sql<{ n: number }>`
    SELECT COUNT(*)::int AS n
    FROM "Collection"
    WHERE "customerId" = ${customerId}
      AND to_char(date, 'YYYY-MM') = ${periodYm}
      AND LOWER(COALESCE(status, 'completed')) = 'completed'
  `
  return (rows[0]?.n || 0) < expected
}

export function getServiceStatusBlockReason(serviceStatus?: string | null): string | null {
  const code = normalizeServiceStatus(serviceStatus)
  if (code === "ACTIVE") return null
  if (code === "INACTIVE") return "Inactive service"
  if (code === "PAUSED_RENEWAL") return "Service paused – renewal pending"
  if (code === "PAUSED_PAYMENT") return "Service paused – payment pending"
  if (code === "RENEWAL_DUE") return "Renewal due – service not active"
  return "Service not active"
}

type ReportEligibilityCustomer = {
  status?: string | null
  serviceStatus?: string | null
  collectionFrequency?: string | null
  serviceStartDate?: Date | string | null
  joinDate?: Date | string | null
}

export async function getAlreadySentReportCustomerIds(periodYm: string): Promise<Set<string>> {
  const rows = await sql<{ customerId: string }>`
    SELECT DISTINCT "customerId"
    FROM "EmailDeliveryLog"
    WHERE kind = 'esg_report'
      AND period = ${periodYm}
      AND status IN ('sent', 'delivered')
      AND "customerId" IS NOT NULL
  `
  return new Set(rows.map((r) => r.customerId).filter(Boolean))
}

export async function getCollectionStatsByCustomer(
  periodYm: string,
): Promise<Map<string, { open: number; completed: number }>> {
  const rows = await sql<{ customerId: string; open_n: number; done_n: number }>`
    SELECT
      "customerId",
      COUNT(*) FILTER (WHERE LOWER(COALESCE(status, 'completed')) <> 'completed')::int AS open_n,
      COUNT(*) FILTER (WHERE LOWER(COALESCE(status, 'completed')) = 'completed')::int AS done_n
    FROM "Collection"
    WHERE to_char(date, 'YYYY-MM') = ${periodYm}
    GROUP BY "customerId"
  `
  const map = new Map<string, { open: number; completed: number }>()
  for (const row of rows) {
    map.set(row.customerId, { open: row.open_n || 0, completed: row.done_n || 0 })
  }
  return map
}

export function getReportSendBlockReasonSync(
  periodYm: string,
  customer: ReportEligibilityCustomer,
  stats?: { open: number; completed: number },
): string | null {
  if (String(customer?.status || "Active").trim().toLowerCase() !== "active") {
    return "Inactive client"
  }

  const serviceBlock = getServiceStatusBlockReason(customer?.serviceStatus)
  if (serviceBlock) return serviceBlock

  if ((stats?.open || 0) > 0) {
    return "Pending collection for this month"
  }

  const serviceStart = customer?.serviceStartDate || customer?.joinDate
  if (!serviceStart) return null
  const start = new Date(serviceStart)
  if (Number.isNaN(start.getTime())) return null
  if (!isDueForMonth(customer?.collectionFrequency, start, periodYm)) return null
  const expected = expectedCollectionsForMonth(customer?.collectionFrequency)
  if ((stats?.completed || 0) < expected) {
    return "Collection not completed for this month"
  }

  return null
}

export async function getReportSendBlockReason(
  customerId: string,
  periodYm: string,
  customer?: ReportEligibilityCustomer,
): Promise<string | null> {
  if (String(customer?.status || "Active").trim().toLowerCase() !== "active") {
    return "Inactive client"
  }

  const serviceBlock = getServiceStatusBlockReason(customer?.serviceStatus)
  if (serviceBlock) return serviceBlock

  if (await customerHasOpenCollectionForMonth(customerId, periodYm)) {
    return "Pending collection for this month"
  }

  const serviceStart = customer?.serviceStartDate || customer?.joinDate
  if (
    await customerMissingCompletedCollectionForMonth(
      customerId,
      periodYm,
      customer?.collectionFrequency,
      serviceStart,
    )
  ) {
    return "Collection not completed for this month"
  }

  return null
}
