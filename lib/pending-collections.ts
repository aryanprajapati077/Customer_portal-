/** Helpers for admin pending-collection list (due month, no completed/recorded collection yet). */

export function normalizeFrequency(raw?: string | null): string {
  const s = String(raw || "")
    .trim()
    .toLowerCase()
  if (!s) return "monthly"
  if (s.includes("2 times") || s.includes("twice")) return "2_times"
  if (s.includes("every 2") || s.includes("2 month")) return "every_2"
  if (s.includes("every 3") || s.includes("3 month")) return "every_3"
  return "monthly"
}

export function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
}

export function parseMonthKey(ym: string): { year: number; month: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(String(ym || "").trim())
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  if (!year || month < 1 || month > 12) return null
  return { year, month }
}

/** Whole months from start (inclusive) to target (inclusive), 0-based index of target relative to start. */
export function monthIndexFromStart(start: Date, targetYear: number, targetMonth: number): number {
  const sy = start.getUTCFullYear()
  const sm = start.getUTCMonth() + 1
  return (targetYear - sy) * 12 + (targetMonth - sm)
}

export function isDueForMonth(
  frequency: string | null | undefined,
  serviceStart: Date | null | undefined,
  targetYm: string,
): boolean {
  const parsed = parseMonthKey(targetYm)
  if (!parsed || !serviceStart) return false
  const idx = monthIndexFromStart(serviceStart, parsed.year, parsed.month)
  if (idx < 0) return false
  const freq = normalizeFrequency(frequency)
  if (freq === "every_2") return idx % 2 === 0
  if (freq === "every_3") return idx % 3 === 0
  return true // monthly + 2 times a month → due every month
}

export function expectedCollectionsForMonth(frequency: string | null | undefined): number {
  return normalizeFrequency(frequency) === "2_times" ? 2 : 1
}

export function lastDayOfMonthIso(ym: string): string {
  const parsed = parseMonthKey(ym)
  if (!parsed) return new Date().toISOString().slice(0, 10)
  const last = new Date(Date.UTC(parsed.year, parsed.month, 0))
  return last.toISOString().slice(0, 10)
}
