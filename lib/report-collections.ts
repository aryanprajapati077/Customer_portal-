import { sql } from "@/lib/db"

export type CollectionWeightRow = {
  weight?: number | string | null
  date?: string | Date | null
  status?: string | null
  notes?: string | null
}

/** Fetch collections for one or many customers, optionally bounded by date range. */
export async function fetchReportCollections(
  customerIds: string[],
  options?: { startIso?: string; endIso?: string; withMeta?: boolean; completedOnly?: boolean },
): Promise<CollectionWeightRow[]> {
  const startIso = options?.startIso
  const endIso = options?.endIso
  const completedOnly = options?.completedOnly !== false
  const statusFilter = completedOnly
    ? sql`AND LOWER(COALESCE(status, 'completed')) = 'completed'`
    : sql``

  if (customerIds.length === 1) {
    const customerId = customerIds[0]!
    if (options?.withMeta) {
      if (startIso && endIso) {
        return sql`
          SELECT weight, date, status, notes
          FROM "Collection"
          WHERE "customerId" = ${customerId}
            AND date >= ${startIso}
            AND date <= ${endIso}
            ${statusFilter}
          ORDER BY date ASC
        `
      }
      if (endIso) {
        return sql`
          SELECT weight, date, status, notes
          FROM "Collection"
          WHERE "customerId" = ${customerId}
            AND date <= ${endIso}
            ${statusFilter}
          ORDER BY date ASC
        `
      }
      return sql`
        SELECT weight, date, status, notes
        FROM "Collection"
        WHERE "customerId" = ${customerId}
          ${statusFilter}
        ORDER BY date ASC
      `
    }

    if (startIso && endIso) {
      return sql`
        SELECT weight, date
        FROM "Collection"
        WHERE "customerId" = ${customerId}
          AND date >= ${startIso}
          AND date <= ${endIso}
          ${statusFilter}
        ORDER BY date DESC
      `
    }
    if (endIso) {
      return sql`
        SELECT weight, date
        FROM "Collection"
        WHERE "customerId" = ${customerId}
          AND date <= ${endIso}
          ${statusFilter}
        ORDER BY date DESC
      `
    }
    return sql`
      SELECT weight, date
      FROM "Collection"
      WHERE "customerId" = ${customerId}
        ${statusFilter}
      ORDER BY date DESC
    `
  }

  if (options?.withMeta) {
    if (startIso && endIso) {
      return sql`
        SELECT weight, date, status, notes
        FROM "Collection"
        WHERE "customerId" = ANY(${customerIds}::text[])
          AND date >= ${startIso}
          AND date <= ${endIso}
          ${statusFilter}
        ORDER BY date ASC
      `
    }
    if (endIso) {
      return sql`
        SELECT weight, date, status, notes
        FROM "Collection"
        WHERE "customerId" = ANY(${customerIds}::text[])
          AND date <= ${endIso}
          ${statusFilter}
        ORDER BY date ASC
      `
    }
    return sql`
      SELECT weight, date, status, notes
      FROM "Collection"
      WHERE "customerId" = ANY(${customerIds}::text[])
        ${statusFilter}
      ORDER BY date ASC
    `
  }

  if (startIso && endIso) {
    return sql`
      SELECT weight, date
      FROM "Collection"
      WHERE "customerId" = ANY(${customerIds}::text[])
        AND date >= ${startIso}
        AND date <= ${endIso}
        ${statusFilter}
      ORDER BY date DESC
    `
  }
  if (endIso) {
    return sql`
      SELECT weight, date
      FROM "Collection"
      WHERE "customerId" = ANY(${customerIds}::text[])
        AND date <= ${endIso}
        ${statusFilter}
      ORDER BY date DESC
    `
  }
  return sql`
    SELECT weight, date
    FROM "Collection"
    WHERE "customerId" = ANY(${customerIds}::text[])
      ${statusFilter}
    ORDER BY date DESC
  `
}

export function serviceStartIso(
  serviceStartDate?: string | Date | null,
  joinDate?: string | Date | null,
): string | undefined {
  const raw = serviceStartDate || joinDate
  if (!raw) return undefined
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return undefined
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).toISOString()
}
