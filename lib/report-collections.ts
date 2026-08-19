import { sql } from "@/lib/db"

export type CollectionWeightRow = {
  weight?: number | string | null
  date?: string | Date | null
  status?: string | null
  notes?: string | null
}

const COMPLETED_STATUS_SQL = `AND LOWER(COALESCE(status, 'completed')) = 'completed'`

/** Fetch collections for one or many customers, optionally bounded by date range. */
export async function fetchReportCollections(
  customerIds: string[],
  options?: { startIso?: string; endIso?: string; withMeta?: boolean; completedOnly?: boolean },
): Promise<CollectionWeightRow[]> {
  const startIso = options?.startIso
  const endIso = options?.endIso
  const completedOnly = options?.completedOnly !== false
  const withMeta = Boolean(options?.withMeta)
  const columns = withMeta ? "weight, date, status, notes" : "weight, date"
  const order = withMeta ? "ASC" : "DESC"

  const values: unknown[] = []
  let i = 1
  let text = `SELECT ${columns} FROM "Collection" WHERE `

  if (customerIds.length === 1) {
    text += `"customerId" = $${i++}`
    values.push(customerIds[0]!)
  } else {
    text += `"customerId" = ANY($${i++}::text[])`
    values.push(customerIds)
  }

  if (startIso && endIso) {
    text += ` AND date >= $${i++} AND date <= $${i++}`
    values.push(startIso, endIso)
  } else if (endIso) {
    text += ` AND date <= $${i++}`
    values.push(endIso)
  }

  if (completedOnly) {
    text += ` ${COMPLETED_STATUS_SQL}`
  }

  text += ` ORDER BY date ${order}`

  return sql.query<CollectionWeightRow>(text, values)
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
