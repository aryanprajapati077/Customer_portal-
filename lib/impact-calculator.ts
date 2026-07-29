/** Buffindia Impact Calculator — FRD v1.0 */

export const INDUSTRIES = [
  "Corporate Office",
  "Hotel",
  "Restaurant / Café / Bar",
  "Residential Society",
  "Public Space",
  "Other",
] as const

export type Industry = (typeof INDUSTRIES)[number]
export type KioskType = "Basic" | "Advanced"

export type CalculatorInput = {
  industry: Industry
  employees?: number
  locations?: number
  smokingZones?: number
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
  /** Human-readable rate card used */
  rateCard: string[]
  inclusions: string[]
}

export type ImpactEstimate = {
  industry: Industry
  mode: "quantified" | "survey" | "package" | "contact"
  packageName: string
  kioskType: KioskType | null
  recommendedKiosks: number | null
  /** Alias of pricing.subtotalExclGst for display */
  annualInvestment: number | null
  annualInvestmentNote: string | null
  pricing: PricingBreakdown | null
  /** Snapshot of inputs used */
  inputs: {
    employees?: number
    locations?: number
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

const GST_NOTE = `excl. GST / year · +${GST_RATE_PCT}% GST`

const BASIC_RATE = { base: 18_000, additional: 6_000, minKiosks: 2 }
const ADVANCED_RATE = { base: 30_000, additional: 15_000, minKiosks: 2 }

function ceilDiv(n: number, d: number) {
  return Math.ceil(n / d)
}

function kioskRateCard(type: KioskType): string[] {
  if (type === "Basic") {
    return [
      "Basic Kiosk — minimum 2 kiosks",
      `₹${formatInr(BASIC_RATE.base)} + GST / year (covers 2 kiosks)`,
      `Additional kiosk: ₹${formatInr(BASIC_RATE.additional)} / year`,
    ]
  }
  return [
    "Advanced Kiosk — minimum 2 kiosks",
    `₹${formatInr(ADVANCED_RATE.base)} + GST / year (covers 2 kiosks)`,
    `Additional kiosk: ₹${formatInr(ADVANCED_RATE.additional)} / year`,
  ]
}

function priceKioskFleet(type: KioskType, count: number): PricingBreakdown {
  const rate = type === "Basic" ? BASIC_RATE : ADVANCED_RATE
  const n = Math.max(rate.minKiosks, Math.round(count))
  const additionalCount = Math.max(0, n - rate.minKiosks)
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

  return {
    currency: "INR",
    gstRatePct: GST_RATE_PCT,
    lineItems,
    subtotalExclGst,
    gstAmount,
    totalInclGst,
    rateCard: kioskRateCard(type),
    inclusions: [
      `${n} × ${type} kiosk${n === 1 ? "" : "s"}`,
      "Collection & recycling service",
      "Monthly ESG / impact reporting",
      `Complimentary KraftReborn products equal to annual subscription (₹${formatInr(subtotalExclGst)})`,
    ],
  }
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

function corporateImpact(
  employees: number,
  locations: number,
  kioskType: KioskType,
): ImpactEstimate {
  const employeesPerLocation = employees / locations
  const smokers = employees * 0.18
  const smokersPerLocation = employeesPerLocation * 0.18
  const butts = smokers * 2 * 20 * 10
  const wasteKg = butts / 3000
  const waterLitres = butts * 100
  const kiosksPerLocation = Math.max(2, ceilDiv(smokersPerLocation, 35))
  const recommendedKiosks = kiosksPerLocation * locations
  const pricing = priceKioskFleet(kioskType, recommendedKiosks)
  const annualInvestment = pricing.subtotalExclGst
  const co2Tonnes = butts * 0.0005

  return {
    industry: "Corporate Office",
    mode: "quantified",
    packageName: `${kioskType} Plan`,
    kioskType,
    recommendedKiosks,
    annualInvestment,
    annualInvestmentNote: GST_NOTE,
    pricing,
    inputs: { employees, locations, estimatedSmokers: Math.round(smokers) },
    buttsDiverted: butts,
    wasteKg,
    waterLitres,
    wasteRecycledPct: 99,
    tobaccoAshPct: 10,
    microplasticFilterPct: 90,
    kraftRebornValue: annualInvestment,
    co2Tonnes,
    impactNote: null,
    summaryLine: `${recommendedKiosks} ${kioskType.toLowerCase()} kiosks · ₹${formatInr(annualInvestment)} excl. GST · ₹${formatInr(pricing.totalInclGst)} incl. GST`,
  }
}

function hotelEstimate(smokingZones: number, kioskType: KioskType): ImpactEstimate {
  // FRD: one kiosk per smoking zone; pricing still applies minimum 2
  const recommendedKiosks = Math.max(2, Math.round(smokingZones))
  const pricing = priceKioskFleet(kioskType, recommendedKiosks)
  const annualInvestment = pricing.subtotalExclGst

  return {
    industry: "Hotel",
    mode: "survey",
    packageName: `${kioskType} Plan`,
    kioskType,
    recommendedKiosks,
    annualInvestment,
    annualInvestmentNote: GST_NOTE,
    pricing,
    inputs: { smokingZones },
    buttsDiverted: null,
    wasteKg: null,
    waterLitres: null,
    wasteRecycledPct: 99,
    tobaccoAshPct: 10,
    microplasticFilterPct: 90,
    kraftRebornValue: annualInvestment,
    co2Tonnes: null,
    impactNote: "Estimated environmental impact will be calculated after the site survey.",
    summaryLine: `${recommendedKiosks} ${kioskType.toLowerCase()} kiosks · ₹${formatInr(annualInvestment)} excl. GST · ₹${formatInr(pricing.totalInclGst)} incl. GST`,
  }
}

function restaurantPackage(): ImpactEstimate {
  const pricing = flatPackagePricing(25_000, "Restaurant / Café / Bar annual package", [
    "50 branded tabletop ashtrays",
    "Optional kiosks available at additional cost",
  ])
  return {
    industry: "Restaurant / Café / Bar",
    mode: "package",
    packageName: "Restaurant Package",
    kioskType: null,
    recommendedKiosks: null,
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
    impactNote:
      "Impact calculated after implementation. Optional kiosks at additional cost.",
    summaryLine: `Flat package · ₹${formatInr(25_000)} excl. GST · ₹${formatInr(pricing.totalInclGst)} incl. GST · 50 tabletop ashtrays`,
  }
}

function residentialPackage(): ImpactEstimate {
  const pricing = flatPackagePricing(12_000, "Residential Society annual package", [
    "4 tabletop ashtrays",
  ])
  return {
    industry: "Residential Society",
    mode: "package",
    packageName: "Residential Package",
    kioskType: null,
    recommendedKiosks: null,
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

function contactOnly(industry: Industry): ImpactEstimate {
  return {
    industry,
    mode: "contact",
    packageName: "Custom Proposal",
    kioskType: null,
    recommendedKiosks: null,
    annualInvestment: null,
    annualInvestmentNote: null,
    pricing: null,
    inputs: {},
    buttsDiverted: null,
    wasteKg: null,
    waterLitres: null,
    wasteRecycledPct: 99,
    tobaccoAshPct: 10,
    microplasticFilterPct: 90,
    kraftRebornValue: null,
    co2Tonnes: null,
    impactNote: "Please contact our team for a customised proposal.",
    summaryLine: "Custom proposal — our team will tailor scope and pricing.",
  }
}

export function calculateImpact(input: CalculatorInput): ImpactEstimate {
  const industry = input.industry

  if (industry === "Corporate Office") {
    const employees = Math.max(1, Number(input.employees) || 0)
    const locations = Math.max(1, Number(input.locations) || 1)
    const kioskType: KioskType = input.kioskType === "Basic" ? "Basic" : "Advanced"
    return corporateImpact(employees, locations, kioskType)
  }

  if (industry === "Hotel") {
    const zones = Math.max(1, Number(input.smokingZones) || 0)
    const kioskType: KioskType = input.kioskType === "Basic" ? "Basic" : "Advanced"
    return hotelEstimate(zones, kioskType)
  }

  if (industry === "Restaurant / Café / Bar") {
    return restaurantPackage()
  }

  if (industry === "Residential Society") {
    return residentialPackage()
  }

  return contactOnly(industry)
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
  return (INDUSTRIES as readonly string[]).includes(value)
}
