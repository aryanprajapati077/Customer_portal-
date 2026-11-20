import { todayIso } from "@/lib/quotation"

export type PreKiosk = "Both" | "Basic" | "Advance"
export const PRE_STATUSES = ["Draft", "Sent", "Accepted", "Rejected"] as const
export type PreStatus = (typeof PRE_STATUSES)[number]

export type PreSite = {
  name: string
  city: string
  occupancy: number | null
  zones: number | null
  basicUnits: number | null
  advanceUnits: number | null
}
export const emptySite = (): PreSite => ({ name: "", city: "", occupancy: null, zones: null, basicUnits: null, advanceUnits: null })

/** Annual service rate per kiosk (₹, ex-GST) — derived from the samples (4 Basic = ₹48,000, 2 Advanced = ₹60,000). */
export const DEFAULT_BASIC_RATE = 12000
export const DEFAULT_ADVANCE_RATE = 30000
/** Cigarette butts per smoker per year — from the samples (1,932 smokers → 17,38,800 butts). */
export const BUTTS_PER_SMOKER = 900

export type PreServiceConfig = {
  mode: "single" | "multi"
  surveyDateTo: string
  sites: PreSite[]
  basicRate: number
  advanceRate: number
  refNo: string
  name: string // property / client name
  address: string // e.g. "Ahmedabad, Gujarat"
  city: string
  surveyDate: string
  proposalDate: string
  locations: number
  occupancy: number | null
  smokers: number | null // null => 12% of occupancy
  zones: number | null
  kioskType: PreKiosk
  basicUnits: number | null
  basicPrice: number | null // annual service price (ex-GST)
  advanceUnits: number | null
  advancePrice: number | null
  buttsPerYear: number | null // null => auto estimate
  customerLogo: string // data URL, optional
}

export function defaultPreService(): PreServiceConfig {
  return {
    mode: "single", surveyDateTo: todayIso(), sites: [emptySite()], basicRate: DEFAULT_BASIC_RATE, advanceRate: DEFAULT_ADVANCE_RATE,
    refNo: "", name: "", address: "", city: "", surveyDate: todayIso(), proposalDate: todayIso(), locations: 1,
    occupancy: null, smokers: null, zones: null, kioskType: "Both",
    basicUnits: null, basicPrice: null, advanceUnits: null, advancePrice: null,
    buttsPerYear: null, customerLogo: "",
  }
}

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : null
}
const str = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "")

export function coercePreService(raw: unknown): PreServiceConfig {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>
  const d = defaultPreService()
  const logo = typeof r.customerLogo === "string" && r.customerLogo.startsWith("data:image/") && r.customerLogo.length < 4_000_000 ? r.customerLogo : ""
  const sites: PreSite[] = (Array.isArray(r.sites) ? r.sites : []).slice(0, 60).map((x) => {
    const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>
    return { name: str(o.name, 80), city: str(o.city, 40), occupancy: num(o.occupancy), zones: num(o.zones), basicUnits: num(o.basicUnits), advanceUnits: num(o.advanceUnits) }
  })
  return {
    mode: r.mode === "multi" ? "multi" : "single",
    surveyDateTo: str(r.surveyDateTo, 10) || d.surveyDateTo,
    sites: sites.length ? sites : [emptySite()],
    basicRate: num(r.basicRate) ?? DEFAULT_BASIC_RATE,
    advanceRate: num(r.advanceRate) ?? DEFAULT_ADVANCE_RATE,
    refNo: str(r.refNo, 40),
    name: str(r.name, 120),
    address: str(r.address, 160),
    city: str(r.city, 60),
    surveyDate: str(r.surveyDate, 10) || d.surveyDate,
    proposalDate: str(r.proposalDate, 10) || d.proposalDate,
    locations: Math.max(1, Math.round(num(r.locations) ?? 1)),
    occupancy: num(r.occupancy),
    smokers: num(r.smokers),
    zones: num(r.zones),
    kioskType: r.kioskType === "Basic" || r.kioskType === "Advance" ? r.kioskType : "Both",
    basicUnits: num(r.basicUnits),
    basicPrice: num(r.basicPrice),
    advanceUnits: num(r.advanceUnits),
    advancePrice: num(r.advancePrice),
    buttsPerYear: num(r.buttsPerYear),
    customerLogo: logo,
  }
}

export function formatPreRef(n: number) { return `BIF/PROP/${String(n).padStart(4, "0")}` }
export function parsePreRef(ref: string): number | null {
  const m = /^BIF\/PROP\/(\d+)$/.exec(ref.trim())
  return m ? Number(m[1]) : null
}

export const inr = (n: number) => Math.round(n).toLocaleString("en-IN")

/** "12 Nov 2026" */
export function preDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  if (!y || !m || !d) return iso
  return `${String(d).padStart(2, "0")} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m - 1]} ${y}`
}

export function computePreService(c: PreServiceConfig) {
  const smokers = c.smokers ?? (c.occupancy != null ? Math.round(c.occupancy * 0.12) : null)
  // Sample ratios: 9,60,000 butts → 320 kg waste → 256 kg microplastics → 96 M L water
  const butts = c.buttsPerYear ?? (smokers != null ? smokers * BUTTS_PER_SMOKER : null)
  const water = butts != null ? butts * 100 : null
  return {
    smokers,
    butts,
    wasteKg: butts != null ? butts / 3000 : null,
    microKg: butts != null ? (butts / 3000) * 0.8 : null,
    waterL: water,
    showBasic: c.kioskType !== "Advance",
    showAdvance: c.kioskType !== "Basic",
  }
}

export const fmtKg = (n: number | null) => (n == null ? "—" : `${Math.round(n).toLocaleString("en-IN")} kg`)
export const fmtWater = (n: number | null) => {
  if (n == null) return "—"
  if (n >= 1_000_000) return `${Math.round((n / 1_000_000) * 10) / 10} Million L`
  return `${inr(n)} L`
}

const impactOf = (smokers: number) => {
  const butts = smokers * BUTTS_PER_SMOKER
  return { butts, wasteKg: butts / 3000, microKg: (butts / 3000) * 0.8, waterL: butts * 100 }
}

export function computeMulti(c: PreServiceConfig) {
  const rows = c.sites.map((x) => {
    const smokers = x.occupancy != null ? Math.round(x.occupancy * 0.12) : 0
    const basic = x.basicUnits ?? 0
    const adv = x.advanceUnits ?? 0
    return {
      ...x,
      smokers,
      ...impactOf(smokers),
      basic,
      adv,
      kiosks: basic + adv,
      price: basic * c.basicRate + adv * c.advanceRate,
    }
  })
  const sum = (f: (r: (typeof rows)[number]) => number) => rows.reduce((a, r) => a + f(r), 0)
  const smokers = sum((r) => r.smokers)
  return {
    rows,
    sites: rows.length,
    occupancy: sum((r) => r.occupancy ?? 0),
    smokers,
    zones: sum((r) => r.zones ?? 0),
    basic: sum((r) => r.basic),
    adv: sum((r) => r.adv),
    kiosks: sum((r) => r.kiosks),
    price: sum((r) => r.price),
    ...impactOf(smokers),
  }
}

/** Annual value used in the saved-list: both options are alternatives in single mode. */
export function preTotal(c: PreServiceConfig): number {
  if (c.mode === "multi") return computeMulti(c).price
  return (c.kioskType !== "Advance" ? c.basicPrice ?? 0 : 0) + (c.kioskType !== "Basic" ? c.advancePrice ?? 0 : 0)
}
