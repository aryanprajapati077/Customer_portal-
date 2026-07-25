import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { randomBytes } from "crypto"

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
