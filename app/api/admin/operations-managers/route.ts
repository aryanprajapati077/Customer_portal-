import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { randomBytes } from "crypto"

function generateId() {
  const timestamp = Date.now().toString(36)
  const random = randomBytes(8).toString("hex")
  return `om${timestamp}${random}`.slice(0, 25)
}

async function ensureTable() {
  await sql.query(`
    CREATE TABLE IF NOT EXISTS "OperationsManager" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      active BOOLEAN NOT NULL DEFAULT true,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await sql.query(`
    CREATE INDEX IF NOT EXISTS "OperationsManager_active_idx" ON "OperationsManager" (active)
  `)
}

/** Seed from distinct Customer.operationsIncharge values. */
async function syncFromCustomers() {
  const fromCustomers = (await sql`
    SELECT DISTINCT TRIM("operationsIncharge") AS name
    FROM "Customer"
    WHERE "operationsIncharge" IS NOT NULL AND TRIM("operationsIncharge") <> ''
    ORDER BY name ASC
  `) as { name: string }[]

  let inserted = 0
  let updated = 0
  const now = new Date().toISOString()

  for (let i = 0; i < fromCustomers.length; i++) {
    const name = fromCustomers[i].name.trim()
    if (!name) continue
    const existing = (await sql`
      SELECT id FROM "OperationsManager" WHERE LOWER(name) = ${name.toLowerCase()} LIMIT 1
    `) as { id: string }[]

    if (existing[0]) {
      await sql`
        UPDATE "OperationsManager"
        SET name = ${name},
            active = true,
            "sortOrder" = ${i},
            "updatedAt" = ${now}
        WHERE id = ${existing[0].id}
      `
      updated++
    } else {
      const id = generateId()
      await sql`
        INSERT INTO "OperationsManager" (id, name, active, "sortOrder", "createdAt", "updatedAt")
        VALUES (${id}, ${name}, true, ${i}, ${now}, ${now})
      `
      inserted++
    }
  }

  return { inserted, updated, total: fromCustomers.length }
}

export async function GET(request: NextRequest) {
  try {
    await ensureTable()
    const includeInactive = request.nextUrl.searchParams.get("all") === "1"

    const rows = includeInactive
      ? await sql`
          SELECT id, name, active, "sortOrder", "createdAt", "updatedAt"
          FROM "OperationsManager"
          ORDER BY "sortOrder" ASC, name ASC
        `
      : await sql`
          SELECT id, name, active, "sortOrder", "createdAt", "updatedAt"
          FROM "OperationsManager"
          WHERE active = true
          ORDER BY "sortOrder" ASC, name ASC
        `

    return NextResponse.json({ success: true, managers: rows })
  } catch (error) {
    console.error("operations-managers GET:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTable()
    const body = await request.json()

    if (body?.action === "syncFromCustomers") {
      const result = await syncFromCustomers()
      const managers = await sql`
        SELECT id, name, active, "sortOrder", "createdAt", "updatedAt"
        FROM "OperationsManager"
        ORDER BY "sortOrder" ASC, name ASC
      `
      return NextResponse.json({
        success: true,
        ...result,
        managers,
        message: `Synced ${result.total} operations managers (${result.inserted} new, ${result.updated} updated).`,
      })
    }

    const name = String(body?.name || "").trim()
    const active = body?.active === undefined ? true : Boolean(body.active)

    if (!name) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 })
    }

    const existing = await sql`
      SELECT id FROM "OperationsManager" WHERE LOWER(name) = ${name.toLowerCase()} LIMIT 1
    `
    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json(
        { success: false, error: "This operations manager already exists" },
        { status: 400 },
      )
    }

    const id = generateId()
    const now = new Date().toISOString()
    const rows = await sql`
      INSERT INTO "OperationsManager" (id, name, active, "sortOrder", "createdAt", "updatedAt")
      VALUES (${id}, ${name}, ${active}, ${0}, ${now}, ${now})
      RETURNING id, name, active, "sortOrder", "createdAt", "updatedAt"
    `

    return NextResponse.json({ success: true, manager: rows[0] })
  } catch (error) {
    console.error("operations-managers POST:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await ensureTable()
    const body = await request.json()
    const id = String(body?.id || "").trim()
    if (!id) {
      return NextResponse.json({ success: false, error: "id required" }, { status: 400 })
    }

    const current = await sql`
      SELECT id, name, active FROM "OperationsManager" WHERE id = ${id} LIMIT 1
    `
    if (!Array.isArray(current) || current.length === 0) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
    }

    const row = current[0] as { name: string; active: boolean }
    const name = body?.name !== undefined ? String(body.name).trim() : row.name
    const active = body?.active !== undefined ? Boolean(body.active) : row.active

    if (!name) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 })
    }

    if (name.toLowerCase() !== row.name.toLowerCase()) {
      const dup = await sql`
        SELECT id FROM "OperationsManager"
        WHERE LOWER(name) = ${name.toLowerCase()} AND id <> ${id}
        LIMIT 1
      `
      if (Array.isArray(dup) && dup.length > 0) {
        return NextResponse.json(
          { success: false, error: "This operations manager already exists" },
          { status: 400 },
        )
      }
    }

    const rows = await sql`
      UPDATE "OperationsManager"
      SET name = ${name},
          active = ${active},
          "updatedAt" = ${new Date().toISOString()}
      WHERE id = ${id}
      RETURNING id, name, active, "sortOrder", "createdAt", "updatedAt"
    `

    return NextResponse.json({ success: true, manager: rows[0] || null })
  } catch (error) {
    console.error("operations-managers PATCH:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureTable()
    const id = request.nextUrl.searchParams.get("id") || ""
    if (!id) {
      return NextResponse.json({ success: false, error: "id required" }, { status: 400 })
    }
    await sql`DELETE FROM "OperationsManager" WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("operations-managers DELETE:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
