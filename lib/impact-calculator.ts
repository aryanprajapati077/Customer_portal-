/** Buffindia Impact Calculator — FRD v3.0 */

export const INDUSTRIES = [
  "Corporate Office",
  "Hotel & Hospitality",
  "Restaurant / Café / Bar",
  "Residential Society",
] as const

export type Industry = (typeof INDUSTRIES)[number]
export type KioskType = "Basic" | "Advanced"
export type OrganisationPriority = "cost" | "premium" | "both"

export type CalculatorInput = {
  industry: Industry
  /** Total workplace occupancy (corporate) */
  occupancy?: number
  smokingZones?: number
  priority?: OrganisationPriority
  /** @deprecated use priority — kept for proposal API compatibility */
  kioskType?: KioskType
}

/** Line-item commercial pricing per FRD §3–6 */
export type PricingBreakdown = {
  currency: "INR"
  gstRatePct: number
  lineItems: { label: string; amount: number }[]
  subtotalExclGst: number
  gstAmount: number
  totalInclGst: number
  rateCard: string[]
  inclusions: string[]
}

export type SolutionTier = {
  kioskType: KioskType
  label: string
  isRecommended: boolean
  recommendedKiosks: number
  pricing: PricingBreakdown
  annualInvestment: number
}

export type ImpactEstimate = {
  industry: Industry
  mode: "quantified" | "survey" | "package" | "contact"
  packageName: string
  kioskType: KioskType | null
  recommendedKiosks: number | null
  priority: OrganisationPriority | null
  solutions: SolutionTier[] | null
  /** Alias of pricing.subtotalExclGst for display */
  annualInvestment: number | null
  annualInvestmentNote: string | null
  pricing: PricingBreakdown | null
  inputs: {
    occupancy?: number
    smokingZones?: number
    estimatedSmokers?: number
  }
  buttsDiverted: number | null
  wasteKg: number | null
  waterLitres: number | null
  wasteRecycledPct: number
  tobaccoAshPct: number
  microplasticFilterPct: number
  kraftRebornValue: number | null
  co2Tonnes: number | null
  impactNote: string | null
  summaryLine: string
}

export const GST_RATE_PCT = 18
export const ORGANISATION_PRIORITIES: { value: OrganisationPriority; label: string; hint: string }[] = [
  { value: "cost", label: "Cost Optimisation", hint: "Basic infrastructure recommended first" },
  { value: "premium", label: "Premium Experience & Design", hint: "Premium infrastructure recommended" },
  { value: "both", label: "Show Me Both", hint: "Compare Basic vs Premium side by side" },
]

const GST_NOTE = `excl. GST / year · +${GST_RATE_PCT}% GST`

const BASIC_RATE = { base: 18_000, additional: 6_000, minKiosks: 2 }
const ADVANCED_RATE = { base: 30_000, additional: 15_000, minKiosks: 2 }

function ceilDiv(n: number, d: number) {
  return Math.ceil(n / d)
}

function kioskRateCard(type: KioskType): string[] {
  if (type === "Basic") {
    return [
      "Basic Infrastructure — minimum 2 kiosks",
      `₹${formatInr(BASIC_RATE.base)} + GST / year (covers 2 kiosks)`,
      `Additional kiosk: ₹${formatInr(BASIC_RATE.additional)} / year`,
    ]
  }
  return [
    "Premium Infrastructure — minimum 2 kiosks",
    `₹${formatInr(ADVANCED_RATE.base)} + GST / year (covers 2 kiosks)`,
    `Additional kiosk: ₹${formatInr(ADVANCED_RATE.additional)} / year`,
  ]
}

function priceKioskFleet(type: KioskType, recommendedCount: number): PricingBreakdown {
  const rate = type === "Basic" ? BASIC_RATE : ADVANCED_RATE
  const billedKiosks = Math.max(rate.minKiosks, Math.round(recommendedCount))
  const additionalCount = Math.max(0, billedKiosks - rate.minKiosks)
  const baseAmount = rate.base
  const additionalAmount = additionalCount * rate.additional
  const subtotalExclGst = baseAmount + additionalAmount
  const gstAmount = Math.round(subtotalExclGst * (GST_RATE_PCT / 100))
  const totalInclGst = subtotalExclGst + gstAmount

  const lineItems: PricingBreakdown["lineItems"] = [
    {
      label: `${type} plan — base (min ${rate.minKiosks} kiosks)`,
      amount: baseAmount,
    },
  ]
  if (additionalCount > 0) {
    lineItems.push({
      label: `Additional ${type.toLowerCase()} kiosks × ${additionalCount} @ ₹${formatInr(rate.additional)}`,
      amount: additionalAmount,
    })
  }

  const extraInclusions =
    type === "Advanced" ? ["Priority support"] : []

  return {
    currency: "INR",
    gstRatePct: GST_RATE_PCT,
    lineItems,
    subtotalExclGst,
    gstAmount,
    totalInclGst,
    rateCard: kioskRateCard(type),
    inclusions: [
      `${billedKiosks} × ${type} kiosk${billedKiosks === 1 ? "" : "s"}`,
      "Collection & recycling service",
      "Monthly ESG / impact reporting",
      ...extraInclusions,
      `Complimentary KraftReborn products equal to annual subscription (₹${formatInr(subtotalExclGst)})`,
    ],
  }
}

function buildSolutionTiers(
  recommendedKiosks: number,
  priority: OrganisationPriority,
): SolutionTier[] {
  const basic: SolutionTier = {
    kioskType: "Basic",
    label: "Basic Infrastructure",
    isRecommended: priority === "cost" || priority === "both",
    recommendedKiosks,
    pricing: priceKioskFleet("Basic", recommendedKiosks),
    annualInvestment: priceKioskFleet("Basic", recommendedKiosks).subtotalExclGst,
  }
  const premium: SolutionTier = {
    kioskType: "Advanced",
    label: "Premium Infrastructure",
    isRecommended: priority === "premium",
    recommendedKiosks,
    pricing: priceKioskFleet("Advanced", recommendedKiosks),
    annualInvestment: priceKioskFleet("Advanced", recommendedKiosks).subtotalExclGst,
  }

  if (priority === "premium") {
    premium.isRecommended = true
    basic.isRecommended = false
  } else if (priority === "cost") {
    basic.isRecommended = true
    premium.isRecommended = false
  } else {
    basic.isRecommended = true
    premium.isRecommended = false
  }

  return priority === "premium" ? [premium, basic] : [basic, premium]
}

function pickPrimarySolution(tiers: SolutionTier[]): SolutionTier {
  return tiers.find((t) => t.isRecommended) ?? tiers[0]
}

function flatPackagePricing(
  amount: number,
  packageLabel: string,
  inclusions: string[],
): PricingBreakdown {
  const subtotalExclGst = amount
  const gstAmount = Math.round(subtotalExclGst * (GST_RATE_PCT / 100))
  return {
    currency: "INR",
    gstRatePct: GST_RATE_PCT,
    lineItems: [{ label: packageLabel, amount }],
    subtotalExclGst,
    gstAmount,
    totalInclGst: subtotalExclGst + gstAmount,
    rateCard: [`${packageLabel}: ₹${formatInr(amount)} + GST / year`],
    inclusions: [
      ...inclusions,
      "Collection & recycling service",
      "ESG reporting",
      `Complimentary KraftReborn products equal to annual subscription (₹${formatInr(amount)})`,
    ],
  }
}

function corporateImpact(occupancy: number, priority: OrganisationPriority): ImpactEstimate {
  const smokers = occupancy * 0.18
  const butts = smokers * 2 * 20 * 10
  const wasteKg = butts / 3000
  const waterLitres = butts * 100
  const recommendedKiosks = ceilDiv(smokers, 35)
  const solutions = buildSolutionTiers(recommendedKiosks, priority)
  const primary = pickPrimarySolution(solutions)
  const co2Tonnes = butts * 0.0005

  return {
    industry: "Corporate Office",
    mode: "quantified",
    packageName: primary.label,
    kioskType: primary.kioskType,
    recommendedKiosks,
    priority,
    solutions,
    annualInvestment: primary.annualInvestment,
    annualInvestmentNote: GST_NOTE,
    pricing: primary.pricing,
    inputs: { occupancy, estimatedSmokers: Math.round(smokers) },
    buttsDiverted: butts,
    wasteKg,
    waterLitres,
    wasteRecycledPct: 99,
    tobaccoAshPct: 10,
    microplasticFilterPct: 90,
    kraftRebornValue: primary.annualInvestment,
    co2Tonnes,
    impactNote: null,
    summaryLine: `${recommendedKiosks} kiosks · ${primary.label} · ₹${formatInr(primary.annualInvestment)} excl. GST · ₹${formatInr(primary.pricing.totalInclGst)} incl. GST`,
  }
}

function hotelEstimate(smokingZones: number, priority: OrganisationPriority): ImpactEstimate {
  const recommendedKiosks = Math.max(1, Math.round(smokingZones))
  const solutions = buildSolutionTiers(recommendedKiosks, priority)
  const primary = pickPrimarySolution(solutions)

  return {
    industry: "Hotel & Hospitality",
    mode: "survey",
    packageName: primary.label,
    kioskType: primary.kioskType,
    recommendedKiosks,
    priority,
    solutions,
    annualInvestment: primary.annualInvestment,
    annualInvestmentNote: GST_NOTE,
    pricing: primary.pricing,
    inputs: { smokingZones },
    buttsDiverted: null,
    wasteKg: null,
    waterLitres: null,
    wasteRecycledPct: 99,
    tobaccoAshPct: 10,
    microplasticFilterPct: 90,
    kraftRebornValue: primary.annualInvestment,
    co2Tonnes: null,
    impactNote: "Environmental impact will be provided after the site survey.",
    summaryLine: `${recommendedKiosks} kiosks · ${primary.label} · ₹${formatInr(primary.annualInvestment)} excl. GST · ₹${formatInr(primary.pricing.totalInclGst)} incl. GST`,
  }
}

function restaurantPackage(): ImpactEstimate {
  const pricing = flatPackagePricing(30_000, "Standard Hospitality Package (Recommended)", [
    "50 branded tabletop ashtrays",
    "Collection & recycling",
    "Quarterly ESG reporting",
    "Optional Basic kiosk @ ₹6,000/year each",
    "Optional Premium kiosk @ ₹15,000/year each",
  ])
  return {
    industry: "Restaurant / Café / Bar",
    mode: "package",
    packageName: "Standard Hospitality Package",
    kioskType: null,
    recommendedKiosks: null,
    priority: null,
    solutions: null,
    annualInvestment: pricing.subtotalExclGst,
    annualInvestmentNote: GST_NOTE,
    pricing,
    inputs: {},
    buttsDiverted: null,
    wasteKg: null,
    waterLitres: null,
    wasteRecycledPct: 99,
    tobaccoAshPct: 10,
    microplasticFilterPct: 90,
    kraftRebornValue: pricing.subtotalExclGst,
    co2Tonnes: null,
    impactNote: "Impact calculated after implementation. Optional kiosk infrastructure available at additional cost.",
    summaryLine: `Flat package · ₹${formatInr(30_000)} excl. GST · ₹${formatInr(pricing.totalInclGst)} incl. GST · 50 tabletop ashtrays`,
  }
}

function residentialPackage(): ImpactEstimate {
  const pricing = flatPackagePricing(12_000, "Residential Society annual package", [
    "4 tabletop ashtrays",
    "Collection & recycling",
    "ESG reporting",
  ])
  return {
    industry: "Residential Society",
    mode: "package",
    packageName: "Residential Package",
    kioskType: null,
    recommendedKiosks: null,
    priority: null,
    solutions: null,
    annualInvestment: pricing.subtotalExclGst,
    annualInvestmentNote: GST_NOTE,
    pricing,
    inputs: {},
    buttsDiverted: null,
    wasteKg: null,
    waterLitres: null,
    wasteRecycledPct: 99,
    tobaccoAshPct: 10,
    microplasticFilterPct: 90,
    kraftRebornValue: pricing.subtotalExclGst,
    co2Tonnes: null,
    impactNote: "Impact calculated after implementation.",
    summaryLine: `Flat package · ₹${formatInr(12_000)} excl. GST · ₹${formatInr(pricing.totalInclGst)} incl. GST · 4 tabletop ashtrays`,
  }
}

function normalizePriority(input: CalculatorInput): OrganisationPriority {
  if (input.priority === "cost" || input.priority === "premium" || input.priority === "both") {
    return input.priority
  }
  if (input.kioskType === "Basic") return "cost"
  if (input.kioskType === "Advanced") return "premium"
  return "both"
}

export function calculateImpact(input: CalculatorInput): ImpactEstimate {
  const industry = input.industry
  const priority = normalizePriority(input)

  if (industry === "Corporate Office") {
    const occupancy = Math.max(1, Number(input.occupancy) || 0)
    return corporateImpact(occupancy, priority)
  }

  if (industry === "Hotel & Hospitality") {
    const zones = Math.max(1, Number(input.smokingZones) || 0)
    return hotelEstimate(zones, priority)
  }

  if (industry === "Restaurant / Café / Bar") {
    return restaurantPackage()
  }

  if (industry === "Residential Society") {
    return residentialPackage()
  }

  return residentialPackage()
}

export function formatInr(n: number) {
  return new Intl.NumberFormat("en-IN").format(Math.round(n))
}

export function formatCompactLitres(litres: number) {
  if (litres >= 1_000_000) {
    const m = litres / 1_000_000
    return `${m >= 10 ? Math.round(m) : Number(m.toFixed(1))}M`
  }
  if (litres >= 1_000) {
    return `${formatInr(litres / 1_000)}K`
  }
  return formatInr(litres)
}

export function isIndustry(value: string): value is Industry {
  if ((INDUSTRIES as readonly string[]).includes(value)) return true
  // Legacy alias
  if (value === "Hotel") return true
  return false
}

export function normalizeIndustry(value: string): Industry {
  if (value === "Hotel") return "Hotel & Hospitality"
  return value as Industry
}
