import { sql } from "@/lib/db"
import { formatReportingPeriod } from "@/lib/esg-metrics"

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

export async function syncMonthlyReportsForCustomer(
  customerId: string,
  options?: { months?: number; joinDate?: Date | string | null },
) {
  const join =
    options?.joinDate != null ? new Date(options.joinDate) : null
  const joinKey = join && !Number.isNaN(join.getTime()) ? monthKey(join) : null

  const monthKeys = getRecentMonthKeys(options?.months ?? 12).filter((key) => {
    if (!joinKey) return true
    return key >= joinKey
  })

  const created: string[] = []

  for (const key of monthKeys) {
    const id = reportId(customerId, key)
    const existing = await sql`
      SELECT id FROM "Report" WHERE id = ${id} LIMIT 1
    `
    if (existing.length > 0) continue

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
    `
    created.push(id)
  }

  return { created: created.length, monthKeys }
}

export async function syncMonthlyReportsForAllActiveCustomers(months = 12) {
  const customers = await sql`
    SELECT id, "joinDate"
    FROM "Customer"
    WHERE status = 'Active'
    ORDER BY "companyName" ASC
  `

  let totalCreated = 0
  for (const customer of customers as { id: string; joinDate?: string | Date | null }[]) {
    const result = await syncMonthlyReportsForCustomer(customer.id, {
      months,
      joinDate: customer.joinDate,
    })
    totalCreated += result.created
  }

  return { customers: customers.length, reportsCreated: totalCreated }
}

export function getCurrentMonthKey(): string {
  return monthKey(new Date())
}
