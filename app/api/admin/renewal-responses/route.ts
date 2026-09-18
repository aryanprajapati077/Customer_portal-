import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/admin-auth-server"
import { hasAdminPermission } from "@/lib/admin-permissions"
import { ensureRenewalResponseTable, type RenewalResponseRow } from "@/lib/renewal-response"
import { sql } from "@/lib/db"

async function requireRenewalsAdmin(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    }
  }
  if (!hasAdminPermission(session.role, session.permissions, "renewals")) {
    return {
      ok: false as const,
      response: NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }),
    }
  }
  return { ok: true as const, session }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRenewalsAdmin(request)
    if (!auth.ok) return auth.response
    await ensureRenewalResponseTable()

    const status = request.nextUrl.searchParams.get("status") || "all"
    const q = (request.nextUrl.searchParams.get("q") || "").trim().toLowerCase()
    const take = Math.min(300, Math.max(1, Number(request.nextUrl.searchParams.get("take")) || 100))

    const rows = (await sql`
      SELECT id, "customerId", "companyName", email, "renewalDate", status, source, notes, "createdAt", "updatedAt"
      FROM "RenewalResponse"
      ORDER BY "createdAt" DESC
      LIMIT ${take}
    `) as RenewalResponseRow[]

    let filtered = rows
    if (status !== "all") {
      filtered = filtered.filter((r) => r.status === status)
    }
    if (q) {
      filtered = filtered.filter((r) => {
        const hay = `${r.customerId} ${r.companyName || ""} ${r.email || ""} ${r.notes || ""}`.toLowerCase()
        return hay.includes(q)
      })
    }

    const counts = {
      all: rows.length,
      new: rows.filter((r) => r.status === "new").length,
      contacted: rows.filter((r) => r.status === "contacted").length,
      closed: rows.filter((r) => r.status === "closed").length,
    }

    return NextResponse.json({ success: true, rows: filtered, counts })
  } catch (error) {
    console.error("renewal-responses GET:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireRenewalsAdmin(request)
    if (!auth.ok) return auth.response
    await ensureRenewalResponseTable()

    const body = await request.json().catch(() => ({}))
    const id = String(body?.id || "").trim()
    const status = String(body?.status || "").trim()
    const notes = body?.notes != null ? String(body.notes) : undefined

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 })
    }
    if (status && !["new", "contacted", "closed"].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 })
    }

    const now = new Date().toISOString()
    if (status && notes !== undefined) {
      await sql`
        UPDATE "RenewalResponse"
        SET status = ${status}, notes = ${notes}, "updatedAt" = ${now}
        WHERE id = ${id}
      `
    } else if (status) {
      await sql`
        UPDATE "RenewalResponse"
        SET status = ${status}, "updatedAt" = ${now}
        WHERE id = ${id}
      `
    } else if (notes !== undefined) {
      await sql`
        UPDATE "RenewalResponse"
        SET notes = ${notes}, "updatedAt" = ${now}
        WHERE id = ${id}
      `
    }

    const [row] = (await sql`
      SELECT id, "customerId", "companyName", email, "renewalDate", status, source, notes, "createdAt", "updatedAt"
      FROM "RenewalResponse" WHERE id = ${id} LIMIT 1
    `) as RenewalResponseRow[]

    return NextResponse.json({ success: true, row: row || null })
  } catch (error) {
    console.error("renewal-responses PATCH:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
