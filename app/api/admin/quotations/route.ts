import { type NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { requireAdminSession } from "@/lib/admin-auth-server"
import { hasAdminPermission } from "@/lib/admin-permissions"
import { sql } from "@/lib/db"
import { QUOTATION_STATUSES, coerceQuotation, computeQuotation, validateGstin } from "@/lib/quotation"
import { ensureQuotationTable, nextPiNo, upsertClientFromConfig } from "@/lib/quotation-store"

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
    await ensureQuotationTable()
    const sp = request.nextUrl.searchParams
    if (sp.get("next") === "1") return NextResponse.json({ success: true, piNo: await nextPiNo() })
    const id = sp.get("id")
    if (id) {
      const rows = await sql.query<{ config: string; id: string; status: string }>(`SELECT * FROM "Quotation" WHERE "id" = $1`, [id])
      if (!rows[0]) return fail("Not found", 404)
      return NextResponse.json({ success: true, quotation: { id: rows[0].id, status: rows[0].status, config: JSON.parse(rows[0].config) } })
    }
    const rows = await sql.query(
      `SELECT "id","piNo","clientName","gstin","kioskType","sez","grandTotal","status","createdBy","createdAt","updatedAt"
       FROM "Quotation" ORDER BY "createdAt" DESC LIMIT 500`,
    )
    return NextResponse.json({ success: true, quotations: rows })
  } catch (e) {
    console.error("Quotations GET error:", e)
    return fail("Server error", 500)
  }
}

/** Create (no id) or update (id) a quotation. */
export async function POST(request: NextRequest) {
  const a = await auth(request)
  if (a.res) return a.res
  try {
    const body = await request.json()
    const config = coerceQuotation(body.config)
    if (!config.clientName) return fail("Client name is required")
    if (!config.piNo) return fail("PI number is required")
    for (const [label, g] of [["Billing", config.bill.gstin], ["Shipping", config.ship.gstin]] as const) {
      if (g) {
        const r = validateGstin(g)
        if (!r.valid && !r.checksumOnly) return fail(`${label} GSTIN is invalid`)
      }
    }
    const status = QUOTATION_STATUSES.includes(body.status) ? body.status : "Draft"
    const total = computeQuotation(config).grandTotal
    await ensureQuotationTable()
    const id = typeof body.id === "string" && body.id ? body.id : null
    try {
      if (id) {
        const rows = await sql.query(
          `UPDATE "Quotation" SET "piNo"=$2,"clientName"=$3,"gstin"=$4,"kioskType"=$5,"sez"=$6,"grandTotal"=$7,"status"=$8,"config"=$9,"updatedAt"=NOW()
           WHERE "id"=$1 RETURNING "id"`,
          [id, config.piNo, config.clientName, config.bill.gstin, computeQuotation(config).kioskLabel, config.sez, total, status, JSON.stringify(config)],
        )
        if (!rows[0]) return fail("Not found", 404)
        const clientSaved = await upsertClientFromConfig(config, a.session!.email).catch(() => null)
        return NextResponse.json({ success: true, id, clientSaved: !!clientSaved })
      }
      const newId = randomUUID()
      await sql.query(
        `INSERT INTO "Quotation" ("id","piNo","clientName","gstin","kioskType","sez","grandTotal","status","config","createdBy")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [newId, config.piNo, config.clientName, config.bill.gstin, computeQuotation(config).kioskLabel, config.sez, total, status, JSON.stringify(config), a.session!.email],
      )
      const clientSaved = await upsertClientFromConfig(config, a.session!.email).catch(() => null)
      return NextResponse.json({ success: true, id: newId, clientSaved: !!clientSaved })
    } catch (e) {
      if ((e as { code?: string }).code === "23505") return fail(`PI number ${config.piNo} already exists`, 409)
      throw e
    }
  } catch (e) {
    console.error("Quotations POST error:", e)
    return fail("Server error", 500)
  }
}

export async function PATCH(request: NextRequest) {
  const a = await auth(request)
  if (a.res) return a.res
  const body = await request.json().catch(() => ({}))
  if (!body.id || !QUOTATION_STATUSES.includes(body.status)) return fail("id and valid status required")
  await ensureQuotationTable()
  await sql.query(`UPDATE "Quotation" SET "status"=$2,"updatedAt"=NOW() WHERE "id"=$1`, [body.id, body.status])
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const a = await auth(request)
  if (a.res) return a.res
  const id = request.nextUrl.searchParams.get("id")
  if (!id) return fail("id required")
  await ensureQuotationTable()
  await sql.query(`DELETE FROM "Quotation" WHERE "id"=$1`, [id])
  return NextResponse.json({ success: true })
}
