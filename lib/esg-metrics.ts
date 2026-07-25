export interface ImpactReportData {
  customerId: string
  companyName: string
  location: string
  disposalUnitsInstalled: number
  installationDate: string
  reportingPeriod: string
  reportingPeriodLabel: string
  reportingPeriodRange: string
  totalWasteKg: number
  cigaretteButts: number
  totalWasteRecycledKg: number
  microplasticUpcycledKg: number
  waterResourcesProtectedL: number
  kraftrebornCredits: number
  habitChange: number
  employment: number
  womenEmployment: number
  /** Optional customer logo (local file path, http(s) URL, or data URL) for cover */
  logoUrl?: string | null
}

interface CollectionForTotals {
  weight?: number | string | null
}

interface CustomerForMetrics {
  id: string
  companyName: string
  address?: string | null
  joinDate?: string | Date | null
  disposalUnitInstalled?: number | null
  totalWasteCollected?: number | null
  kraftrebornCredits?: number | null
}

const PAN_INDIA_SOCIAL = {
  habitChange: 507_500,
  employment: 48,
  womenEmployment: 22,
}

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

export function formatReportingPeriod(date = new Date()): string {
  return `${MONTHS_SHORT[date.getMonth()]} ${String(date.getFullYear()).slice(2)}`
}

export function formatReportingPeriodLabel(date = new Date()): string {
  return `${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`
}

export function formatReportingPeriodRange(date = new Date()): string {
  const year = date.getFullYear()
  const month = date.getMonth()
  const lastDay = new Date(year, month + 1, 0).getDate()
  const mon = MONTHS_SHORT[month]
  return `01 ${mon} ${year} to ${String(lastDay).padStart(2, "0")} ${mon} ${year}`
}

export function formatCustomerCode(customerId: string): string {
  return customerId.trim().toUpperCase()
}

export function parseLocation(address?: string | null): string {
  if (!address?.trim()) return "Not provided"
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean)
  if (parts.length >= 2) return `${parts[0]}, ${parts.slice(1).join(", ")}`
  return address
}

export function formatInstallDate(joinDate?: string | Date | null): string {
  if (!joinDate) return "N/A"
  const d = new Date(joinDate)
  if (Number.isNaN(d.getTime())) return String(joinDate)
  const day = String(d.getDate()).padStart(2, "0")
  const mon = MONTHS_SHORT[d.getMonth()]
  return `${day} ${mon} ${d.getFullYear()}`
}

export function computeImpactReportData(
  customer: CustomerForMetrics,
  collections?: CollectionForTotals[],
  asOfDate?: Date,
): ImpactReportData {
  const collectionsTotalWasteKg =
    collections?.reduce((sum, c) => sum + (Number(c.weight) || 0), 0) ?? 0

  const totalWasteKg =
    collections && collections.length > 0
      ? collectionsTotalWasteKg
      : Number(customer.totalWasteCollected) || 0

  const cigaretteButts = Math.round(totalWasteKg * 3000)
  const microplasticUpcycledKg = +(totalWasteKg * 0.8).toFixed(2)
  const waterResourcesProtectedL = Math.round(cigaretteButts * 100)
  const reportDate = asOfDate ?? new Date()

  return {
    customerId: formatCustomerCode(customer.id),
    companyName: customer.companyName,
    location: parseLocation(customer.address),
    disposalUnitsInstalled: Number(customer.disposalUnitInstalled) || 0,
    installationDate: formatInstallDate(customer.joinDate),
    reportingPeriod: formatReportingPeriod(reportDate),
    reportingPeriodLabel: formatReportingPeriodLabel(reportDate),
    reportingPeriodRange: formatReportingPeriodRange(reportDate),
    totalWasteKg: +totalWasteKg.toFixed(2),
    cigaretteButts,
    totalWasteRecycledKg: +totalWasteKg.toFixed(2),
    microplasticUpcycledKg,
    waterResourcesProtectedL,
    kraftrebornCredits: Number(customer.kraftrebornCredits) || 0,
    logoUrl: null,
    ...PAN_INDIA_SOCIAL,
  }
}

export function formatMetricNumber(value: number): string {
  return value.toLocaleString("en-IN")
}
