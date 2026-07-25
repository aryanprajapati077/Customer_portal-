export interface CollectionLike {
  weight?: number | string | null
  date?: string | Date | null
}

export interface PortalMetrics {
  totalWasteKg: number
  cigaretteButts: number
  microplasticsKg: number
  waterProtectedL: number
  kraftrebornCredits: number
  treesEquivalent: number
  co2AvoidedKg: number
  energySavedKwh: number
  collectionCount: number
}

export function computePortalMetrics(
  collections: CollectionLike[] | undefined,
  fallbackWasteKg = 0,
  kraftrebornCredits = 0,
): PortalMetrics {
  const collectionsTotal =
    collections?.reduce((sum, c) => sum + (Number(c.weight) || 0), 0) ?? 0
  const totalWasteKg =
    collections && collections.length > 0 ? collectionsTotal : Number(fallbackWasteKg) || 0

  const cigaretteButts = Math.round(totalWasteKg * 3000)
  const microplasticsKg = +(totalWasteKg * 0.8).toFixed(2)
  const waterProtectedL = Math.round(cigaretteButts * 100)
  const treesEquivalent = Math.max(0, Math.round(totalWasteKg * 8.14))
  const co2AvoidedKg = Math.round(totalWasteKg * 178)
  const energySavedKwh = Math.round(totalWasteKg * 404)

  return {
    totalWasteKg,
    cigaretteButts,
    microplasticsKg,
    waterProtectedL,
    kraftrebornCredits: Number(kraftrebornCredits) || 0,
    treesEquivalent,
    co2AvoidedKg,
    energySavedKwh,
    collectionCount: collections?.length ?? 0,
  }
}

export function formatIndianNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value)
}

export function formatKg(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)} kg`
}

export function formatWaterL(value: number): string {
  return `${formatIndianNumber(value)} L`
}

export function firstName(contactPerson?: string | null): string {
  if (!contactPerson?.trim()) return "Partner"
  return contactPerson.trim().split(/\s+/)[0]
}

export function formatPortalDate(date?: string | Date | null): string {
  if (!date) return "—"
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return String(date)
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}
