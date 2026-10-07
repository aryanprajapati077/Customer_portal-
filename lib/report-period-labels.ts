import type { ImpactReportData } from "@/lib/esg-metrics"
import {
  formatWindowDay,
  formatWindowRangeText,
  type ReportDateWindow,
} from "@/lib/report-date-range"

/** Monthly email / admin month download: YYYY-MM with no portal range — cumulative data. */
export function isCumulativeMonthlyReport(options?: {
  period?: string | null
  range?: string | null
}): boolean {
  return Boolean(options?.period && /^\d{4}-\d{2}$/.test(options.period) && !options?.range)
}

/** Cover dates for a YYYY-MM month: "01 Sept 2026 to 30 Sept 2026". */
function formatCalendarMonthRange(period: string): string {
  const match = period.match(/^(\d{4})-(\d{2})$/)
  if (!match) return ""
  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  const start = new Date(year, monthIndex, 1, 0, 0, 0, 0)
  const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999)
  return `${formatWindowDay(start)} to ${formatWindowDay(end)}`
}

export function applyReportPeriodLabels(
  reportData: ImpactReportData,
  window: ReportDateWindow,
  options: {
    period?: string
    range?: string
    useWindowStart: boolean
    cumulativeStart?: string | null
  },
) {
  reportData.reportingPeriod = window.label
  reportData.reportingPeriodLabel = window.label
  reportData.reportingPeriodCaption = "REPORTING PERIOD"
  reportData.showReportingPeriodRange = true

  // Email / admin monthly only: "Latest Month Report" + month/year (portal unchanged).
  if (isCumulativeMonthlyReport(options) && options.period) {
    const monthLabel =
      window.label ||
      (() => {
        const match = options.period!.match(/^(\d{4})-(\d{2})$/)
        if (!match) return options.period!
        return new Date(Number(match[1]), Number(match[2]) - 1, 1).toLocaleDateString("en-GB", {
          month: "long",
          year: "numeric",
        })
      })()
    reportData.reportingPeriod = monthLabel
    reportData.reportingPeriodLabel = monthLabel
    reportData.reportingPeriodCaption = "LATEST MONTH REPORT"
    reportData.reportingPeriodRange = monthLabel
    reportData.showReportingPeriodRange = false
    return
  }

  const installStart = options.cumulativeStart ? new Date(options.cumulativeStart) : undefined
  const rangeStart =
    options.useWindowStart && window.startDate
      ? window.startDate
      : window.startDate || installStart

  reportData.reportingPeriodRange =
    formatWindowRangeText(rangeStart, window.endDate) || window.label
}

/** @deprecated Use isCumulativeMonthlyReport */
export const isCumulativeEmailReport = isCumulativeMonthlyReport
