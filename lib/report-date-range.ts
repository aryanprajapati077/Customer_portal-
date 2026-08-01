/** Resolve report date windows for ESG downloads / filters */

export type ReportRangeKey =
  | "this-year"
  | "quarterly"
  | "installation"
  | "month"
  | "custom"

export interface ReportDateWindow {
  startDate?: Date
  endDate?: Date
  /** YYYY-MM used by legacy period-as-of filtering when only end bound matters */
  period?: string
  label: string
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}

function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

function endOfMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0, 23, 59, 59, 999)
}

export function resolveReportDateWindow(options: {
  range?: string | null
  period?: string | null
  startDate?: string | null
  endDate?: string | null
}): ReportDateWindow {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const range = (options.range || "installation") as ReportRangeKey

  if (range === "custom") {
    const start = options.startDate ? startOfDay(new Date(options.startDate)) : undefined
    const end = options.endDate ? endOfDay(new Date(options.endDate)) : endOfDay(now)
    if (start && Number.isNaN(start.getTime())) {
      return { label: "Custom range", endDate: end }
    }
    if (end && Number.isNaN(end.getTime())) {
      return { startDate: start, label: "Custom range" }
    }
    const label =
      start && end
        ? `${start.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} – ${end.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`
        : "Custom range"
    return { startDate: start, endDate: end, label }
  }

  if (range === "this-year") {
    return {
      startDate: new Date(y, 0, 1, 0, 0, 0, 0),
      endDate: endOfDay(now),
      period: `${y}-12`,
      label: `Jan–${now.toLocaleDateString("en-GB", { month: "short" })} ${y}`,
    }
  }

  if (range === "quarterly") {
    const qStartMonth = Math.floor(m / 3) * 3
    const qEndMonth = qStartMonth + 2
    return {
      startDate: new Date(y, qStartMonth, 1, 0, 0, 0, 0),
      endDate: endOfDay(now),
      period: `${y}-${String(qEndMonth + 1).padStart(2, "0")}`,
      label: `Q${Math.floor(m / 3) + 1} ${y} to date`,
    }
  }

  if (range === "month") {
    const period =
      options.period && /^\d{4}-\d{2}$/.test(options.period)
        ? options.period
        : `${y}-${String(m + 1).padStart(2, "0")}`
    const [py, pm] = period.split("-").map(Number)
    return {
      startDate: new Date(py, pm - 1, 1, 0, 0, 0, 0),
      endDate: endOfMonth(py, pm - 1),
      period,
      label: new Date(py, pm - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
    }
  }

  // YYYY-MM period without explicit range = that calendar month only (admin monthly reports)
  if (options.period && /^\d{4}-\d{2}$/.test(options.period)) {
    const [py, pm] = options.period.split("-").map(Number)
    return {
      startDate: new Date(py, pm - 1, 1, 0, 0, 0, 0),
      endDate: endOfMonth(py, pm - 1),
      period: options.period,
      label: new Date(py, pm - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
    }
  }

  return {
    endDate: endOfDay(now),
    label: "Installation till date",
  }
}
