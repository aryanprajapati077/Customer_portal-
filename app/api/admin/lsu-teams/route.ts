import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { randomBytes } from "crypto"
import { LSU_TEAMS_FROM_SHEETS } from "@/lib/lsu-teams-from-sheets"

function generateId() {
  const timestamp = Date.now().toString(36)
  const random = randomBytes(8).toString("hex")
  return `c${timestamp}${random}`.slice(0, 25)
}

async function ensureTable() {
  await sql.query(`
    CREATE TABLE IF NOT EXISTS "LsuTeam" (
      id TEXT PRIMARY KEY,
      "lsuName" TEXT NOT NULL UNIQUE,
      "technicianName" TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT true,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await sql.query(`
    CREATE INDEX IF NOT EXISTS "LsuTeam_active_idx" ON "LsuTeam" (active)
  `)
}

/** Upsert Client Master LSU pairs (+ any extra pairs already on Customer rows). */
async function syncFromSheets() {
  const fromCustomers = (await sql`
    SELECT DISTINCT TRIM("lsuName") AS "lsuName",
           COALESCE(NULLIF(TRIM("lsuTechnicianName"), ''), 'Unassigned') AS "technicianName"
    FROM "Customer"
    WHERE "lsuName" IS NOT NULL AND TRIM("lsuName") <> ''
  `) as { lsuName: string; technicianName: string }[]

  const byKey = new Map<string, { lsuName: string; technicianName: string }>()
  for (const row of LSU_TEAMS_FROM_SHEETS) {
    byKey.set(row.lsuName.toLowerCase(), row)
  }
  for (const row of fromCustomers) {
    const key = row.lsuName.toLowerCase()
    if (key === "himachal pradesh") {
      byKey.set("himachal pradesh", {
        lsuName: "Himachal Pradesh",
        technicianName: row.technicianName || "Abhishek Kumar HP",
      })
      continue
    }
    if (!byKey.has(key)) {
      byKey.set(key, {
        lsuName: row.lsuName,
        technicianName: row.technicianName || "Unassigned",
      })
    }
  }

  const pairs = [...byKey.values()].sort((a, b) => a.lsuName.localeCompare(b.lsuName))
  let inserted = 0
  let updated = 0
  const now = new Date().toISOString()

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i]
    const tech = pair.technicianName.trim() || "Unassigned"
    const existing = (await sql`
      SELECT id, "technicianName" FROM "LsuTeam"
      WHERE LOWER("lsuName") = ${pair.lsuName.toLowerCase()}
      LIMIT 1
    `) as { id: string; technicianName: string }[]

    if (existing[0]) {
      await sql`
        UPDATE "LsuTeam"
        SET "lsuName" = ${pair.lsuName},
            "technicianName" = ${tech},
            active = true,
            "sortOrder" = ${i},
            "updatedAt" = ${now}
        WHERE id = ${existing[0].id}
      `
      updated++
    } else {
      const id = generateId()
      await sql`
        INSERT INTO "LsuTeam" (id, "lsuName", "technicianName", active, "sortOrder", "createdAt", "updatedAt")
        VALUES (${id}, ${pair.lsuName}, ${tech}, true, ${i}, ${now}, ${now})
      `
      inserted++
    }
  }

  // Drop casing duplicate "Himachal pradesh" if both exist
  await sql`
    DELETE FROM "LsuTeam"
    WHERE "lsuName" = 'Himachal pradesh'
      AND EXISTS (SELECT 1 FROM "LsuTeam" t2 WHERE t2."lsuName" = 'Himachal Pradesh')
  `

  return { inserted, updated, total: pairs.length }
}

export async function GET(request: NextRequest) {
  try {
    await ensureTable()
    const includeInactive = request.nextUrl.searchParams.get("all") === "1"

    const rows = includeInactive
      ? await sql`
          SELECT id, "lsuName", "technicianName", active, "sortOrder", "createdAt", "updatedAt"
          FROM "LsuTeam"
          ORDER BY "sortOrder" ASC, "lsuName" ASC
        `
      : await sql`
          SELECT id, "lsuName", "technicianName", active, "sortOrder", "createdAt", "updatedAt"
          FROM "LsuTeam"
          WHERE active = true
          ORDER BY "sortOrder" ASC, "lsuName" ASC
        `

    return NextResponse.json({ success: true, teams: rows })
  } catch (error) {
    console.error("lsu-teams GET:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTable()
    const body = await request.json()

    if (body?.action === "syncFromSheets") {
      const result = await syncFromSheets()
      const teams = await sql`
        SELECT id, "lsuName", "technicianName", active, "sortOrder", "createdAt", "updatedAt"
        FROM "LsuTeam"
        ORDER BY "sortOrder" ASC, "lsuName" ASC
      `
      return NextResponse.json({
        success: true,
        ...result,
        teams,
        message: `Synced ${result.total} LSU teams from Client Master (${result.inserted} new, ${result.updated} updated).`,
      })
    }

    const lsuName = String(body?.lsuName || "").trim()
    const technicianName = String(body?.technicianName || "").trim()
    const active = body?.active === undefined ? true : Boolean(body.active)

    if (!lsuName) {
      return NextResponse.json({ success: false, error: "LSU Name is required" }, { status: 400 })
    }
    if (!technicianName) {
      return NextResponse.json(
        { success: false, error: "LSU Technician Name is required" },
        { status: 400 },
      )
    }

    const existing = await sql`
      SELECT id FROM "LsuTeam" WHERE "lsuName" = ${lsuName} LIMIT 1
    `
    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json(
        { success: false, error: "This LSU Name already exists" },
        { status: 400 },
      )
    }

    const id = generateId()
    const now = new Date().toISOString()
    const rows = await sql`
      INSERT INTO "LsuTeam" (id, "lsuName", "technicianName", active, "sortOrder", "createdAt", "updatedAt")
      VALUES (${id}, ${lsuName}, ${technicianName}, ${active}, ${0}, ${now}, ${now})
      RETURNING id, "lsuName", "technicianName", active, "sortOrder", "createdAt", "updatedAt"
    `

    return NextResponse.json({ success: true, team: rows[0] })
  } catch (error) {
    console.error("lsu-teams POST:", error)
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
      SELECT id, "lsuName", "technicianName", active FROM "LsuTeam" WHERE id = ${id} LIMIT 1
    `
    if (!Array.isArray(current) || current.length === 0) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
    }

    const row = current[0] as {
      lsuName: string
      technicianName: string
      active: boolean
    }

    const lsuName =
      body?.lsuName !== undefined ? String(body.lsuName).trim() : row.lsuName
    const technicianName =
      body?.technicianName !== undefined
        ? String(body.technicianName).trim()
        : row.technicianName
    const active = body?.active !== undefined ? Boolean(body.active) : row.active

    if (!lsuName || !technicianName) {
      return NextResponse.json(
        { success: false, error: "LSU Name and Technician Name are required" },
        { status: 400 },
      )
    }

    if (lsuName !== row.lsuName) {
      const dup = await sql`
        SELECT id FROM "LsuTeam" WHERE "lsuName" = ${lsuName} AND id <> ${id} LIMIT 1
      `
      if (Array.isArray(dup) && dup.length > 0) {
        return NextResponse.json(
          { success: false, error: "This LSU Name already exists" },
          { status: 400 },
        )
      }
    }

    const rows = await sql`
      UPDATE "LsuTeam"
      SET "lsuName" = ${lsuName},
          "technicianName" = ${technicianName},
          active = ${active},
          "updatedAt" = ${new Date().toISOString()}
      WHERE id = ${id}
      RETURNING id, "lsuName", "technicianName", active, "sortOrder", "createdAt", "updatedAt"
    `

    return NextResponse.json({ success: true, team: rows[0] || null })
  } catch (error) {
    console.error("lsu-teams PATCH:", error)
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
    await sql`DELETE FROM "LsuTeam" WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("lsu-teams DELETE:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
