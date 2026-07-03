export interface ImpactReportData {
  customerId: string
  companyName: string
  location: string
  disposalUnitsInstalled: number
  installationDate: string
  reportingPeriod: string
  totalWasteKg: number
  cigaretteButts: number
  totalWasteRecycledKg: number
  microplasticUpcycledKg: number
  waterResourcesProtectedL: number
  kraftrebornCredits: number
  habitChange: number
  employment: number
  womenEmployment: number
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

export function formatReportingPeriod(date = new Date()): string {
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" }).replace(" ", " ")
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
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
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

  return {
    customerId: formatCustomerCode(customer.id),
    companyName: customer.companyName,
    location: parseLocation(customer.address),
    disposalUnitsInstalled: Number(customer.disposalUnitInstalled) || 0,
    installationDate: formatInstallDate(customer.joinDate),
    reportingPeriod: formatReportingPeriod(asOfDate),
    totalWasteKg: +totalWasteKg.toFixed(2),
    cigaretteButts,
    totalWasteRecycledKg: +totalWasteKg.toFixed(2),
    microplasticUpcycledKg,
    waterResourcesProtectedL,
    kraftrebornCredits: Number(customer.kraftrebornCredits) || 0,
    ...PAN_INDIA_SOCIAL,
  }
}

export function formatMetricNumber(value: number): string {
  return value.toLocaleString("en-IN")
}
