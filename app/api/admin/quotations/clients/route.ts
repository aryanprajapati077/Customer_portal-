import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/admin-auth-server"
import { hasAdminPermission } from "@/lib/admin-permissions"
import { sql } from "@/lib/db"
import { coerceQuotation, validateGstin } from "@/lib/quotation"
import { ensureQuotationClientTable, upsertClientFromConfig } from "@/lib/quotation-store"

async function auth(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session) return { res: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }) }
  if (!hasAdminPermission(session.role, session.permissions, "quotations")) {
    return { res: NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }) }
  }
  return { session }
}
const fail = (error: string, status = 400) => NextResponse.json({ success: false, error }, { status })

export async function GET(request: NextRequest) {
  const a = await auth(request)
  if (a.res) return a.res
  try {
    await ensureQuotationClientTable()
    const rows = await sql.query<{ id: string; brandName: string; tradeName: string | null; gstin: string | null; data: string }>(
      `SELECT "id","brandName","tradeName","gstin","data" FROM "QuotationClient" ORDER BY LOWER("brandName") LIMIT 2000`,
    )
    const clients = rows.map((r) => {
      let data = {}
      try { data = JSON.parse(r.data) } catch { /* ignore */ }
      return { id: r.id, brandName: r.brandName, tradeName: r.tradeName ?? "", gstin: r.gstin ?? "", data }
    })
    return NextResponse.json({ success: true, clients })
  } catch (e) {
    console.error("Quotation clients GET error:", e)
    return fail("Server error", 500)
  }
}

/** Save a client explicitly. GSTIN is the unique key. */
export async function POST(request: NextRequest) {
  const a = await auth(request)
  if (a.res) return a.res
  try {
    const body = await request.json()
    const c = coerceQuotation(body.data)
    const v = validateGstin(c.bill.gstin)
    if (!c.bill.gstin || (!v.valid && !v.checksumOnly)) return fail("A valid billing GSTIN is required to save a client")
    if (!(c.brandName || c.clientName)) return fail("Brand name is required")
    const id = await upsertClientFromConfig(c, a.session!.email)
    return NextResponse.json({ success: true, id })
  } catch (e) {
    console.error("Quotation clients POST error:", e)
    return fail("Server error", 500)
  }
}

export async function DELETE(request: NextRequest) {
  const a = await auth(request)
  if (a.res) return a.res
  const id = request.nextUrl.searchParams.get("id")
  if (!id) return fail("id required")
  await ensureQuotationClientTable()
  await sql.query(`DELETE FROM "QuotationClient" WHERE "id"=$1`, [id])
  return NextResponse.json({ success: true })
}
