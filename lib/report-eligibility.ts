import { sql } from "@/lib/db"
import {
  expectedCollectionsForMonth,
  isDueForMonth,
} from "@/lib/pending-collections"

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

export async function getReportSendBlockReason(
  customerId: string,
  periodYm: string,
  customer?: {
    collectionFrequency?: string | null
    serviceStartDate?: Date | string | null
    joinDate?: Date | string | null
  },
): Promise<string | null> {
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
