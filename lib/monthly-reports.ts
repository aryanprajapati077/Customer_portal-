import { sql } from "@/lib/db"
import { formatReportingPeriod } from "@/lib/esg-metrics"
import { parsePeriodToMonthKey } from "@/lib/report-periods"

export { parsePeriodToMonthKey } from "@/lib/report-periods"

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function monthEndDate(key: string): Date {
  const [y, m] = key.split("-").map(Number)
  return new Date(y, m, 0, 12, 0, 0, 0)
}

function monthLabel(key: string): string {
  const d = monthEndDate(key)
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
}

function reportId(customerId: string, key: string): string {
  return `mr_${customerId}_${key}`
}

export function getRecentMonthKeys(count = 12, fromDate = new Date()): string[] {
  const keys: string[] = []
  const cursor = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1)
  for (let i = 0; i < count; i++) {
    keys.push(monthKey(cursor))
    cursor.setMonth(cursor.getMonth() - 1)
  }
  return keys
}

/** All YYYY-MM keys from start month through as-of month (inclusive). Newest first. */
export function getMonthKeysFrom(startDate: Date, asOf = new Date()): string[] {
  if (Number.isNaN(startDate.getTime())) return getRecentMonthKeys(12, asOf)
  const keys: string[] = []
  const cursor = new Date(asOf.getFullYear(), asOf.getMonth(), 1)
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
  let guard = 0
  while (cursor >= start && guard++ < 240) {
    keys.push(monthKey(cursor))
    cursor.setMonth(cursor.getMonth() - 1)
  }
  return keys
}

export async function syncMonthlyReportsForCustomer(
  customerId: string,
  options?: {
    months?: number
    /** Prefer service start; falls back to joinDate */
    startDate?: Date | string | null
    joinDate?: Date | string | null
  },
) {
  const startRaw = options?.startDate ?? options?.joinDate
  const start = startRaw != null ? new Date(startRaw) : null
  const startOk = start && !Number.isNaN(start.getTime()) ? start : null

  const monthKeys = startOk
    ? getMonthKeysFrom(startOk)
    : getRecentMonthKeys(options?.months ?? 12)

  if (monthKeys.length === 0) return { created: 0, monthKeys }

  // Fast path: only create missing months (batch check)
  const existing = (await sql.query<{ id: string }>(
    `SELECT id FROM "Report" WHERE id = ANY($1::text[])`,
    [monthKeys.map((k) => reportId(customerId, k))],
  )) as { id: string }[]
  const have = new Set(existing.map((r) => r.id))

  let created = 0
  for (const key of monthKeys) {
    const id = reportId(customerId, key)
    if (have.has(id)) continue

    const period = formatReportingPeriod(monthEndDate(key))
    const end = monthEndDate(key)

    await sql`
      INSERT INTO "Report" (
        id, "customerId", name, date, type, period, description, "generatedBy", size
      ) VALUES (
        ${id},
        ${customerId},
        ${`Monthly ESG Impact Report – ${monthLabel(key)}`},
        ${end.toISOString()},
        ${"monthly"},
        ${period},
        ${"Auto-generated monthly sustainability and ESG impact summary."},
        ${"Buffindia System"},
        ${"~10 KB"}
      )
      ON CONFLICT (id) DO NOTHING
    `
    created++
  }

  return { created, monthKeys }
}

export async function syncMonthlyReportsForAllActiveCustomers(months = 12) {
  const customers = await sql`
    SELECT id, "joinDate", "serviceStartDate"
    FROM "Customer"
    WHERE status = 'Active'
    ORDER BY "companyName" ASC
  `

  let totalCreated = 0
  for (const customer of customers as {
    id: string
    joinDate?: string | Date | null
    serviceStartDate?: string | Date | null
  }[]) {
    const result = await syncMonthlyReportsForCustomer(customer.id, {
      months,
      startDate: customer.serviceStartDate || customer.joinDate,
      joinDate: customer.joinDate,
    })
    totalCreated += result.created
  }

  return { customers: customers.length, reportsCreated: totalCreated }
}

export function getCurrentMonthKey(): string {
  return monthKey(new Date())
}

/** Ensure a monthly report row exists for one customer + YYYY-MM period */
export async function ensureMonthlyReportForPeriod(
  customerId: string,
  periodKey: string,
) {
  if (!/^\d{4}-\d{2}$/.test(periodKey)) {
    throw new Error("Invalid period. Use YYYY-MM.")
  }

  const id = reportId(customerId, periodKey)
  const existing = await sql`
    SELECT id FROM "Report" WHERE id = ${id} LIMIT 1
  `
  if (existing.length > 0) {
    return { id, created: false }
  }

  const period = formatReportingPeriod(monthEndDate(periodKey))
  const end = monthEndDate(periodKey)

  await sql`
    INSERT INTO "Report" (
      id, "customerId", name, date, type, period, description, "generatedBy", size
    ) VALUES (
      ${id},
      ${customerId},
      ${`Monthly ESG Impact Report – ${monthLabel(periodKey)}`},
      ${end.toISOString()},
      ${"monthly"},
      ${period},
      ${"Auto-generated monthly sustainability and ESG impact summary."},
      ${"Buffindia System"},
      ${"~10 KB"}
    )
    ON CONFLICT (id) DO NOTHING
  `

  return { id, created: true }
}
