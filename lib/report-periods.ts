/** Pure period helpers — safe for client components (no DB imports). */

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

/** Parse report period labels like "Aug 26" or "2026-08" into YYYY-MM. */
export function parsePeriodToMonthKey(
  period?: string | null,
  fallbackDate?: string | Date | null,
): string | null {
  if (period && /^\d{4}-\d{2}$/.test(period.trim())) return period.trim()
  if (period) {
    const m = period.trim().match(/^([A-Za-z]{3})\s+(\d{2}|\d{4})$/)
    if (m) {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      const mi = months.findIndex((x) => x.toLowerCase() === m[1]!.toLowerCase())
      if (mi >= 0) {
        const yRaw = m[2]!
        const year = yRaw.length === 2 ? 2000 + Number(yRaw) : Number(yRaw)
        return `${year}-${String(mi + 1).padStart(2, "0")}`
      }
    }
  }
  if (fallbackDate) {
    const d = new Date(fallbackDate)
    if (!Number.isNaN(d.getTime())) return monthKey(d)
  }
  return null
}
