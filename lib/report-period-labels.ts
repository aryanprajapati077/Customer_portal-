import type { ImpactReportData } from "@/lib/esg-metrics"
import { formatWindowRangeText, type ReportDateWindow } from "@/lib/report-date-range"

/** Monthly reports (email, admin month download): YYYY-MM with no portal range — cumulative totals. */
export function isCumulativeMonthlyReport(options?: {
  period?: string | null
  range?: string | null
}): boolean {
  return Boolean(options?.period && /^\d{4}-\d{2}$/.test(options.period) && !options?.range)
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

  const installStart = options.cumulativeStart ? new Date(options.cumulativeStart) : undefined

  if (isCumulativeMonthlyReport(options)) {
    reportData.reportingPeriodRange =
      formatWindowRangeText(installStart, window.endDate) ||
      (installStart && window.endDate
        ? `${installStart.toLocaleDateString("en-GB")} to ${window.endDate.toLocaleDateString("en-GB")}`
        : window.label)
    return
  }

  const rangeStart =
    options.useWindowStart && window.startDate
      ? window.startDate
      : window.startDate || installStart

  reportData.reportingPeriodRange =
    formatWindowRangeText(rangeStart, window.endDate) || window.label
}

/** @deprecated Use isCumulativeMonthlyReport */
export const isCumulativeEmailReport = isCumulativeMonthlyReport
