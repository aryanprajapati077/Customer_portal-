import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/admin-auth-server"
import { hasAdminPermission } from "@/lib/admin-permissions"
import { sql } from "@/lib/db"
import { GST_STATE_CODES, normalizeGstin, validateGstin } from "@/lib/quotation"

type Found = {
  legalName: string
  tradeName: string
  address: string
  city: string
  state: string
  pincode: string
  status: string
}

async function fromPortalCustomers(gstin: string): Promise<Found | null> {
  const rows = await sql.query<{ companyName: string; tradeName: string | null; address: string | null; city: string | null; state: string | null }>(
    `SELECT "companyName","tradeName","address","city","state" FROM "Customer" WHERE UPPER("gstin") = $1 ORDER BY "createdAt" DESC LIMIT 1`,
    [gstin],
  )
  const r = rows[0]
  if (!r) return null
  return {
    legalName: r.companyName,
    tradeName: r.tradeName || "",
    address: r.address || "",
    city: r.city || "",
    state: r.state || "",
    pincode: "",
    status: "Existing Buffindia customer",
  }
}

type Addr = Record<string, string | undefined>
type Taxpayer = {
  lgnm?: string
  tradeNam?: string
  sts?: string
  pradr?: { adr?: string; addr?: Addr }
}

/** Accepts the GSTN "Search Taxpayer" shape directly, or wrapped (taxpayerInfo / data / result). */
function normalizeTaxpayer(j: unknown): Found | null {
  const o = (j && typeof j === "object" ? j : {}) as Record<string, unknown>
  const t = (o.taxpayerInfo || o.data || o.result || o) as Taxpayer
  if (!t || typeof t !== "object" || !t.lgnm) return null
  const a = t.pradr?.addr || {}
  const street = [a.flno, a.bno, a.bnm, a.st, a.loc].filter(Boolean).join(", ")
  const address = t.pradr?.adr || [street, a.dst, a.stcd, a.pncd].filter(Boolean).join(", ")
  return {
    legalName: t.lgnm || "",
    tradeName: t.tradeNam || "",
    address,
    city: a.dst || a.loc || "",
    state: a.stcd || "",
    pincode: a.pncd || "",
    status: t.sts || "",
  }
}

/**
 * GST provider lookup. Configure:
 *   GST_API_URL  e.g. https://host/path/{gstin}  (or a base URL; ?gstNo=<gstin> is appended)
 *   GST_API_KEY  API key
 *   GST_API_KEY_HEADER  optional header name (e.g. x-api-key); default sends Appyflow-style ?key_secret=
 */
async function fromGstProvider(gstin: string): Promise<Found | null> {
  const key = process.env.GST_API_KEY
  if (!key) return null
  const base = process.env.GST_API_URL || "https://appyflow.in/api/verifyGST"
  const headerName = process.env.GST_API_KEY_HEADER
  const url = new URL(base.includes("{gstin}") ? base.replace("{gstin}", encodeURIComponent(gstin)) : base)
  const commonApi = /commonapi/i.test(base) // GSTN Common API v1.3: GET /search?action=TP&gstin=…
  if (commonApi) {
    url.searchParams.set("action", "TP")
    url.searchParams.set("gstin", gstin)
  } else if (!base.includes("{gstin}")) {
    url.searchParams.set("gstNo", gstin)
  }
  const headers: Record<string, string> = { Accept: "application/json" }
  if (headerName) headers[headerName] = key
  else if (commonApi) headers.Authorization = key.startsWith("Bearer ") ? key : `Bearer ${key}`
  else url.searchParams.set("key_secret", key)
  // Extra provider headers, e.g. {"client-id":"…","client-secret":"…","state-cd":"24","username":"…","ip-usr":"…","txn":"…"}
  try {
    Object.assign(headers, JSON.parse(process.env.GST_API_HEADERS || "{}"))
  } catch {
    throw new Error("GST_API_HEADERS is not valid JSON")
  }

  const res = await fetch(url, { headers, cache: "no-store", signal: AbortSignal.timeout(12_000) })
  if (!res.ok) throw new Error(`GST provider HTTP ${res.status}`)
  const j = await res.json()
  const found = normalizeTaxpayer(j)
  if (!found) throw new Error((j && (j.message || j.error)) || "GSTIN not found")
  return found
}

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  if (!hasAdminPermission(session.role, session.permissions, "quotations")) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  const gstin = normalizeGstin(request.nextUrl.searchParams.get("gstin") || "")
  const v = validateGstin(gstin)
  if (!v.valid && !v.checksumOnly) return NextResponse.json({ success: false, error: v.error }, { status: 400 })

  const derived = { state: GST_STATE_CODES[gstin.slice(0, 2)], pan: gstin.slice(2, 12) }
  const warnings: string[] = v.checksumOnly ? ["GSTIN check digit looks wrong — please re-check the number."] : []
  let found: Found | null = null
  let source: "provider" | "portal" | "none" = "none"

  try {
    found = await fromGstProvider(gstin)
    if (found) source = "provider"
  } catch (e) {
    warnings.push(`GST lookup failed: ${e instanceof Error ? e.message : "unknown error"}`)
  }
  if (!found) {
    try {
      found = await fromPortalCustomers(gstin)
      if (found) source = "portal"
    } catch (e) {
      console.error("GSTIN portal lookup error:", e)
    }
  }
  if (!found && !process.env.GST_API_KEY) {
    warnings.push("Live GST lookup is not configured (set GST_API_KEY). Fill the name and address manually.")
  }

  return NextResponse.json({ success: true, gstin, derived, source, details: found, warnings })
}
