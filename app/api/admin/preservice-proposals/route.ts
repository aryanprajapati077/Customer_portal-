import { type NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { requireAdminSession } from "@/lib/admin-auth-server"
import { hasAdminPermission } from "@/lib/admin-permissions"
import { sql } from "@/lib/db"
import { PRE_STATUSES, coercePreService, preTotal } from "@/lib/preservice"
import { ensurePreServiceTable, nextPreRef } from "@/lib/preservice-store"

async function auth(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session) return { res: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }) }
  if (!hasAdminPermission(session.role, session.permissions, "quotations")) {
    return { res: NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }) }
  }
  return { session }
}
const fail = (error: string, status = 400) => NextResponse.json({ success: false, error }, { status })
const totalOf = preTotal
const kioskLabel = (c: ReturnType<typeof coercePreService>) => (c.mode === "multi" ? `Multi (${c.sites.length} sites)` : c.kioskType)

export async function GET(request: NextRequest) {
  const a = await auth(request)
  if (a.res) return a.res
  try {
    await ensurePreServiceTable()
    const sp = request.nextUrl.searchParams
    if (sp.get("next") === "1") return NextResponse.json({ success: true, refNo: await nextPreRef() })
    const id = sp.get("id")
    if (id) {
      const rows = await sql.query<{ config: string; id: string; status: string }>(`SELECT * FROM "PreServiceProposal" WHERE "id"=$1`, [id])
      if (!rows[0]) return fail("Not found", 404)
      return NextResponse.json({ success: true, proposal: { id: rows[0].id, status: rows[0].status, config: JSON.parse(rows[0].config) } })
    }
    const rows = await sql.query(
      `SELECT "id","refNo","name","city","kioskType","totalValue","status","createdBy","createdAt","updatedAt"
       FROM "PreServiceProposal" ORDER BY "createdAt" DESC LIMIT 500`,
    )
    return NextResponse.json({ success: true, proposals: rows })
  } catch (e) {
    console.error("PreService GET error:", e)
    return fail("Server error", 500)
  }
}

export async function POST(request: NextRequest) {
  const a = await auth(request)
  if (a.res) return a.res
  try {
    const body = await request.json()
    const c = coercePreService(body.config)
    if (!c.name) return fail("Client / property name is required")
    if (!c.refNo) return fail("Proposal reference is required")
    const status = (PRE_STATUSES as readonly string[]).includes(body.status) ? body.status : "Draft"
    await ensurePreServiceTable()
    const id = typeof body.id === "string" && body.id ? body.id : null
    try {
      if (id) {
        const rows = await sql.query(
          `UPDATE "PreServiceProposal" SET "refNo"=$2,"name"=$3,"city"=$4,"kioskType"=$5,"totalValue"=$6,"status"=$7,"config"=$8,"updatedAt"=NOW()
           WHERE "id"=$1 RETURNING "id"`,
          [id, c.refNo, c.name, c.city, kioskLabel(c), totalOf(c), status, JSON.stringify(c)],
        )
        if (!rows[0]) return fail("Not found", 404)
        return NextResponse.json({ success: true, id })
      }
      const newId = randomUUID()
      await sql.query(
        `INSERT INTO "PreServiceProposal" ("id","refNo","name","city","kioskType","totalValue","status","config","createdBy")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [newId, c.refNo, c.name, c.city, kioskLabel(c), totalOf(c), status, JSON.stringify(c), a.session!.email],
      )
      return NextResponse.json({ success: true, id: newId })
    } catch (e) {
      if ((e as { code?: string }).code === "23505") return fail(`Reference ${c.refNo} already exists`, 409)
      throw e
    }
  } catch (e) {
    console.error("PreService POST error:", e)
    return fail("Server error", 500)
  }
}

export async function PATCH(request: NextRequest) {
  const a = await auth(request)
  if (a.res) return a.res
  const body = await request.json().catch(() => ({}))
  if (!body.id || !(PRE_STATUSES as readonly string[]).includes(body.status)) return fail("id and valid status required")
  await ensurePreServiceTable()
  await sql.query(`UPDATE "PreServiceProposal" SET "status"=$2,"updatedAt"=NOW() WHERE "id"=$1`, [body.id, body.status])
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const a = await auth(request)
  if (a.res) return a.res
  const id = request.nextUrl.searchParams.get("id")
  if (!id) return fail("id required")
  await ensurePreServiceTable()
  await sql.query(`DELETE FROM "PreServiceProposal" WHERE "id"=$1`, [id])
  return NextResponse.json({ success: true })
}
