/** Quotation / proforma: shared types, GSTIN helpers and money maths (client + server safe). */

export type KioskType = "Basic" | "Advance" | "Combo"
export type LineType = KioskType | "Custom"

export type PartyDetails = {
  name: string
  /** Free-text address line (building, street, area) */
  address: string
  city: string
  state: string
  pincode: string
  gstin: string
}

/**
 * One row of the quotation.
 *  Basic / Advance: `units` kiosks, `net` = total net value (before GST) for the line.
 *  Combo: `units` Basic + `advanceUnits` Advance kiosks as one set, `net` = package net value.
 *  Custom: free item, `units` = qty, `net` = rate per unit.
 */
export type QuotationItem = {
  type: LineType
  name: string
  units: number
  advanceUnits: number
  net: number
  sac: string
  /** net follows the standard rate until the user edits it */
  auto: boolean
}

export type QuotationConfig = {
  date: string // yyyy-mm-dd
  piNo: string
  clientName: string // cover letter "To"
  brandName: string
  tradeName: string
  city: string // "Hyderabad, Telangana"
  items: QuotationItem[]
  duration: string // "12 Months"
  surcharge: number
  /** Complimentary product value; null = equal to taxable total */
  complimentary: number | null
  specialConditions: string
  bill: PartyDetails
  ship: PartyDetails
  /** Supply to a Special Economic Zone: zero-rated, GST 0% */
  sez: boolean
  /** Product slugs from QUOTATION_PRODUCTS to show; empty = hide the page */
  complimentaryProducts: string[]
}

export const GST_RATE = 0.18
export const DEFAULT_SAC = "999490"
export const STANDARD_RATE = { Basic: 11000, Advance: 15000, Combo: 22500 } as const
export const VALID_DAYS = 15

export const QUOTATION_PRODUCTS: { slug: string; name: string }[] = [
  { slug: "classic-card-keeper", name: "Classic Card Keeper" },
  { slug: "eco-frame", name: "Eco Frame - Sustainable Desk Photo Frame" },
  { slug: "ecotime-clock", name: "EcoTime - Sustainable Desk Clock" },
  { slug: "elegance-hexa-tray", name: "Elegance Hexa Tray" },
  { slug: "harmony-oval-planter", name: "Harmony Oval Planter Set" },
  { slug: "lunar-glow-candle-stand", name: "Lunar Glow Candle Stand with Tray" },
  { slug: "mobile-stand", name: "Mobile Stand" },
  { slug: "petal-radiance-candle-stand", name: "Petal Radiance Candle Stand with Tray" },
  { slug: "prestige-pen-holder", name: "Prestige Pen Holder" },
  { slug: "serenity-round-planter", name: "Serenity Round Planter Set" },
  { slug: "test-tube-greenery", name: "Test-tube Greenery Set" },
  { slug: "classic-pen-card-holder", name: "Classic Pen & Card Holder" },
]

// ── GSTIN ────────────────────────────────────────────────────────────────

export const GST_STATE_CODES: Record<string, string> = {
  "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh",
  "05": "Uttarakhand", "06": "Haryana", "07": "Delhi", "08": "Rajasthan",
  "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh",
  "13": "Nagaland", "14": "Manipur", "15": "Mizoram", "16": "Tripura",
  "17": "Meghalaya", "18": "Assam", "19": "West Bengal", "20": "Jharkhand",
  "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
  "26": "Dadra & Nagar Haveli and Daman & Diu", "27": "Maharashtra", "29": "Karnataka",
  "30": "Goa", "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu",
  "34": "Puducherry", "35": "Andaman & Nicobar Islands", "36": "Telangana",
  "37": "Andhra Pradesh", "38": "Ladakh", "97": "Other Territory",
}

const GST_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/

/** Uppercase, drop spaces/dashes/any non-alphanumerics, cap at 15 characters. */
export function normalizeGstin(raw: string): string {
  return raw.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 15)
}

export function gstinChecksum(first14: string): string {
  let sum = 0
  for (let i = 0; i < 14; i++) {
    const v = GST_CHARS.indexOf(first14[i])
    const p = v * (i % 2 === 0 ? 1 : 2)
    sum += Math.floor(p / 36) + (p % 36)
  }
  return GST_CHARS[(36 - (sum % 36)) % 36]
}

export function validateGstin(raw: string): { valid: boolean; error?: string; checksumOnly?: boolean } {
  const g = normalizeGstin(raw)
  if (g.length !== 15) return { valid: false, error: "GSTIN must be 15 characters" }
  if (!GSTIN_RE.test(g)) return { valid: false, error: "GSTIN format is invalid" }
  if (!GST_STATE_CODES[g.slice(0, 2)]) return { valid: false, error: "Unknown GST state code" }
  if (gstinChecksum(g.slice(0, 14)) !== g[14]) return { valid: false, error: "GSTIN checksum does not match", checksumOnly: true }
  return { valid: true }
}

// ── Dates ────────────────────────────────────────────────────────────────

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** yyyy-mm-dd → dd-Mon-yyyy (timezone safe) */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  if (!y || !m || !d) return iso
  return `${String(d).padStart(2, "0")}-${MONTHS[m - 1]}-${y}`
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return dt.toISOString().slice(0, 10)
}

export function todayIso(): string {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`
}

// ── Money ────────────────────────────────────────────────────────────────

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

export function formatInrNumber(n: number): string {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Whole rupees, no decimals, no grouping: "22500" (matches strip style) */
export function plainRupees(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
  "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

function below100(n: number): string {
  return n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ""}`
}
function below1000(n: number): string {
  const h = Math.floor(n / 100)
  const rest = n % 100
  return `${h ? `${ONES[h]} Hundred${rest ? " " : ""}` : ""}${rest ? below100(rest) : ""}`
}

export function indianWords(n: number): string {
  if (n === 0) return "Zero"
  const parts: string[] = []
  const crore = Math.floor(n / 1e7)
  const lakh = Math.floor((n % 1e7) / 1e5)
  const thousand = Math.floor((n % 1e5) / 1e3)
  const rest = n % 1e3
  if (crore) parts.push(`${indianWords(crore)} Crore`)
  if (lakh) parts.push(`${below100(lakh)} Lakh`)
  if (thousand) parts.push(`${below100(thousand)} Thousand`)
  if (rest) parts.push(below1000(rest))
  return parts.join(" ")
}

export function amountInWords(amount: number): string {
  const total = r2(amount)
  const rupees = Math.floor(total)
  const paise = Math.round((total - rupees) * 100)
  let s = `Rupees ${indianWords(rupees)}`
  if (paise) s += ` and ${indianWords(paise)} Paise`
  return `${s} only`
}

// ── Quotation maths ──────────────────────────────────────────────────────

export type ComputedLine = {
  no: number
  name: string
  description: string[]
  sac: string
  qty: number
  rate: number
  igst: number // total tax on the line (IGST, or CGST+SGST)
  cgst: number
  sgst: number
  amount: number // incl. tax
  image: "basic" | "advance" | null
}

export type TaxType = "IGST" | "CGST_SGST" | "SEZ"
export const SELLER_STATE_CODE = "24" // Buffindia, Gujarat

export type Computed = {
  validTill: string
  gstRate: number
  taxType: TaxType
  cgst: number
  sgst: number
  lines: ComputedLine[]
  totalCost: number // taxable value of all lines
  surcharge: number
  taxable: number // totalCost + surcharge
  igst: number
  grandTotal: number
  complimentary: number
  words: string
  basicUnits: number
  advanceUnits: number
  totalUnits: number
  kioskLabel: string // "Basic" | "Advance" | "Combo" | "Basic + Advance"
  singleType: KioskType | null
}

const two = (n: number) => String(n).padStart(2, "0")

export function periodText(duration: string): string {
  const months = parseInt(duration, 10)
  return months && months % 12 === 0 ? `${months / 12} year${months > 12 ? "s" : ""}` : duration
}

function itemDescription(it: QuotationItem, duration: string): string[] {
  const period = `Service period:${periodText(duration)}`
  if (it.type === "Combo") {
    return [`01 set include Combo disposal units (${two(it.units)} Basic & ${two(it.advanceUnits)} Advance kiosks) on annual rent`, period]
  }
  if (it.type === "Custom") return []
  return [`01 set include ${two(it.units)} disposal units (${it.type} kiosks) on annual rent`, period]
}

export function partyAddress(p: PartyDetails): string {
  const parts = [p.address]
  if (p.city && !p.address.toLowerCase().includes(p.city.toLowerCase())) parts.push(p.city)
  if (p.state && !p.address.toLowerCase().includes(p.state.toLowerCase())) parts.push(p.state)
  let s = parts.filter(Boolean).join(", ")
  if (p.pincode && !s.includes(p.pincode)) s += `${s ? " - " : ""}${p.pincode}`
  return s
}

export function taxTypeFor(c: Pick<QuotationConfig, "sez" | "bill">): TaxType {
  if (c.sez) return "SEZ"
  return normalizeGstin(c.bill.gstin).slice(0, 2) === SELLER_STATE_CODE ? "CGST_SGST" : "IGST"
}

export function computeQuotation(c: QuotationConfig): Computed {
  const taxType = taxTypeFor(c)
  const gstRate = taxType === "SEZ" ? 0 : GST_RATE
  const half = (n: number) => r2((n * gstRate) / 2)
  let basicUnits = 0
  let advanceUnits = 0
  const kinds: string[] = []

  const lines: ComputedLine[] = c.items.map((it, i) => {
    const custom = it.type === "Custom"
    const qty = custom ? it.units : 1
    const rate = r2(it.net)
    const base = r2(qty * rate)
    if (it.type === "Basic" || it.type === "Combo") basicUnits += it.units
    if (it.type === "Advance") advanceUnits += it.units
    if (it.type === "Combo") advanceUnits += it.advanceUnits
    if (!custom && !kinds.includes(it.type)) kinds.push(it.type)
    return {
      no: i + 1,
      name: custom
        ? it.name || "Additional item"
        : "Buffindia Environmental Services Annual Charges with AMC and Eco-Friendly Products",
      description: itemDescription(it, c.duration),
      sac: it.sac || DEFAULT_SAC,
      qty,
      rate,
      igst: r2(base * gstRate),
      cgst: taxType === "CGST_SGST" ? half(base) : 0,
      sgst: taxType === "CGST_SGST" ? half(base) : 0,
      amount: r2(base * (1 + gstRate)),
      image: it.type === "Basic" ? "basic" : custom ? null : "advance",
    }
  })

  const totalCost = r2(lines.reduce((s, l) => s + l.qty * l.rate, 0))
  const surcharge = r2(c.surcharge || 0)
  const taxable = r2(totalCost + surcharge)
  const cgst = taxType === "CGST_SGST" ? half(taxable) : 0
  const sgst = cgst
  const igst = taxType === "CGST_SGST" ? r2(cgst + sgst) : r2(taxable * gstRate)
  const grandTotal = r2(taxable + igst)
  return {
    validTill: addDays(c.date, VALID_DAYS),
    gstRate,
    taxType,
    cgst,
    sgst,
    lines,
    totalCost,
    surcharge,
    taxable,
    igst,
    grandTotal,
    complimentary: r2(c.complimentary ?? taxable),
    words: amountInWords(grandTotal),
    basicUnits,
    advanceUnits,
    totalUnits: basicUnits + advanceUnits,
    kioskLabel: kinds.length ? kinds.join(" + ") : "—",
    singleType: kinds.length === 1 ? (kinds[0] as KioskType) : null,
  }
}

export function newItem(type: LineType = "Basic"): QuotationItem {
  return {
    type,
    name: "",
    units: type === "Custom" ? 1 : 1,
    advanceUnits: type === "Combo" ? 1 : 0,
    net: type === "Custom" ? 0 : STANDARD_RATE[type],
    sac: DEFAULT_SAC,
    auto: type !== "Custom",
  }
}

/** Standard net value for an item (used while `auto` is on). */
export function standardNet(it: QuotationItem): number {
  if (it.type === "Basic") return it.units * STANDARD_RATE.Basic
  if (it.type === "Advance") return it.units * STANDARD_RATE.Advance
  if (it.type === "Combo") return it.units * STANDARD_RATE.Basic + it.advanceUnits * STANDARD_RATE.Advance
  return it.net
}

export const emptyParty = (): PartyDetails => ({ name: "", address: "", city: "", state: "", pincode: "", gstin: "" })

export function defaultQuotation(): QuotationConfig {
  return {
    date: todayIso(),
    piNo: "",
    clientName: "",
    brandName: "",
    tradeName: "",
    city: "",
    items: [newItem("Basic")],
    duration: "12 Months",
    surcharge: 0,
    complimentary: null,
    specialConditions: "",
    bill: emptyParty(),
    ship: emptyParty(),
    sez: false,
    complimentaryProducts: QUOTATION_PRODUCTS.map((p) => p.slug),
  }
}

/** Server-side sanitising of a request body into a safe config (also migrates older saved configs). */
export function coerceQuotation(raw: unknown): QuotationConfig {
  const d = defaultQuotation()
  const b = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>
  const str = (v: unknown, fb = "") => (typeof v === "string" ? v.trim().slice(0, 600) : fb)
  const num = (v: unknown, fb = 0) => {
    const n = Number(v)
    return Number.isFinite(n) && n >= 0 ? n : fb
  }
  const party = (v: unknown): PartyDetails => {
    const p = (v && typeof v === "object" ? v : {}) as Record<string, unknown>
    return {
      name: str(p.name),
      address: str(p.address),
      city: str(p.city),
      state: str(p.state),
      pincode: str(p.pincode).replace(/\D/g, "").slice(0, 6),
      gstin: normalizeGstin(str(p.gstin)),
    }
  }
  const types: LineType[] = ["Basic", "Advance", "Combo", "Custom"]
  let items: QuotationItem[]
  if (Array.isArray(b.items)) {
    items = b.items.slice(0, 40).map((x) => {
      const it = (x && typeof x === "object" ? x : {}) as Record<string, unknown>
      const type = types.includes(it.type as LineType) ? (it.type as LineType) : "Basic"
      return {
        type,
        name: str(it.name),
        units: Math.floor(num(it.units, 1)) || (type === "Custom" ? 1 : 0),
        advanceUnits: type === "Combo" ? Math.floor(num(it.advanceUnits)) : 0,
        net: num(it.net),
        sac: str(it.sac, DEFAULT_SAC) || DEFAULT_SAC,
        auto: it.auto === true,
      }
    })
  } else {
    // legacy shape: kioskType/basicKiosk/advanceKiosk/rates/extraItems
    const kt = b.kioskType === "Advance" || b.kioskType === "Combo" ? b.kioskType : "Basic"
    const bk = Math.floor(num(b.basicKiosk))
    const ak = Math.floor(num(b.advanceKiosk))
    const br = num(b.basicRate, 11000)
    const ar = num(b.advanceRate, 15000)
    const pkg = b.packageRate === null || b.packageRate === "" || b.packageRate === undefined ? null : num(b.packageRate)
    items = [{
      type: kt, name: "", units: kt === "Advance" ? ak : bk, advanceUnits: kt === "Combo" ? ak : 0,
      net: pkg ?? bk * br + ak * ar, sac: DEFAULT_SAC, auto: false,
    }]
    for (const x of Array.isArray(b.extraItems) ? b.extraItems : []) {
      const it = (x && typeof x === "object" ? x : {}) as Record<string, unknown>
      items.push({ type: "Custom", name: str(it.name), units: num(it.qty, 1) || 1, advanceUnits: 0, net: num(it.rate), sac: str(it.sac, DEFAULT_SAC) || DEFAULT_SAC, auto: false })
    }
  }
  const slugs = new Set(QUOTATION_PRODUCTS.map((p) => p.slug))
  const date = /^\d{4}-\d{2}-\d{2}$/.test(str(b.date)) ? str(b.date) : d.date
  return {
    date,
    piNo: str(b.piNo),
    clientName: str(b.clientName),
    brandName: str(b.brandName),
    tradeName: str(b.tradeName),
    city: str(b.city),
    items: items.length ? items : d.items,
    duration: str(b.duration, d.duration) || d.duration,
    surcharge: num(b.surcharge),
    complimentary: b.complimentary === null || b.complimentary === "" || b.complimentary === undefined ? null : num(b.complimentary),
    specialConditions: str(b.specialConditions),
    bill: party(b.bill),
    ship: party(b.ship),
    sez: b.sez === true,
    complimentaryProducts: (Array.isArray(b.complimentaryProducts) ? b.complimentaryProducts : [])
      .filter((s): s is string => typeof s === "string" && slugs.has(s)),
  }
}

export type QuotationStatus = "Draft" | "Sent" | "Accepted" | "Rejected"
export const QUOTATION_STATUSES: QuotationStatus[] = ["Draft", "Sent", "Accepted", "Rejected"]

export function formatPiNo(n: number): string {
  return `BIP${String(n).padStart(8, "0")}`
}
export function parsePiNo(s: string): number | null {
  const m = /^BIP(\d{8})$/.exec(s.trim().toUpperCase())
  return m ? parseInt(m[1], 10) : null
}

/** Parse text copied from the GST portal "Search Taxpayer" result page. */
export function parseGstPortalText(raw: string): { legalName: string; tradeName: string; address: string; pincode: string } | null {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const LABELS = [
    "Legal Name of Business", "Trade Name", "Effective Date of registration", "Constitution of Business",
    "GSTIN / UIN Status", "Taxpayer Type", "Administrative Office", "Other Office", "Principal Place of Business",
    "Whether Aadhaar Authenticated?", "Whether e-KYC Verified?", "Additional Trade Name", "Date of Cancellation",
    "Nature Of Core Business Activity", "Additional Place of Business", "Core Business Activity",
  ]
  const isLabel = (l: string) => LABELS.some((x) => l.toLowerCase().startsWith(x.toLowerCase()))
  const grab = (label: string) => {
    const i = lines.findIndex((l) => l.toLowerCase() === label.toLowerCase() || l.toLowerCase().startsWith(label.toLowerCase() + " "))
    if (i < 0) return ""
    const out: string[] = []
    for (let j = i + 1; j < lines.length && !isLabel(lines[j]); j++) out.push(lines[j])
    return out.join(", ")
  }
  const legalName = grab("Legal Name of Business")
  const tradeName = grab("Trade Name")
  const address = grab("Principal Place of Business")
  const pincode = /\b\d{6}\b/.exec(address)?.[0] ?? ""
  return legalName || address ? { legalName, tradeName, address, pincode } : null
}
