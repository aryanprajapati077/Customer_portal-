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

export async function getReportSendBlockReason(
  customerId: string,
  periodYm: string,
  customer?: {
    status?: string | null
    serviceStatus?: string | null
    collectionFrequency?: string | null
    serviceStartDate?: Date | string | null
    joinDate?: Date | string | null
  },
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
