import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { randomBytes } from "crypto"

function generateId() {
  const timestamp = Date.now().toString(36)
  const random = randomBytes(8).toString("hex")
  return `la${timestamp}${random}`.slice(0, 25)
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
    CREATE TABLE IF NOT EXISTS "LsuAssignment" (
      id TEXT PRIMARY KEY,
      "lsuName" TEXT NOT NULL UNIQUE,
      "operationsManagerId" TEXT NOT NULL,
      "operationsManagerName" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

export async function GET() {
  try {
    await ensureTable()
    const [teams, managers, assignments] = await Promise.all([
      sql`
        SELECT id, "lsuName", "technicianName", active
        FROM "LsuTeam"
        WHERE active = true
        ORDER BY "sortOrder" ASC, "lsuName" ASC
      `,
      sql`
        SELECT id, name, active
        FROM "OperationsManager"
        WHERE active = true
        ORDER BY "sortOrder" ASC, name ASC
      `,
      sql`
        SELECT id, "lsuName", "operationsManagerId", "operationsManagerName"
        FROM "LsuAssignment"
        ORDER BY "lsuName" ASC
      `,
    ])
    return NextResponse.json({ success: true, teams, managers, assignments })
  } catch (error) {
    console.error("lsu-assignments GET:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTable()
    const body = await request.json()
    const rows = Array.isArray(body?.assignments) ? body.assignments : []
    const now = new Date().toISOString()
    let saved = 0

    for (const row of rows) {
      const lsuName = String(row?.lsuName || "").trim()
      const managerId = String(row?.operationsManagerId || "").trim()
      if (!lsuName) continue

      if (!managerId) {
        await sql`DELETE FROM "LsuAssignment" WHERE LOWER("lsuName") = ${lsuName.toLowerCase()}`
        saved++
        continue
      }

      const managers = (await sql`
        SELECT id, name FROM "OperationsManager" WHERE id = ${managerId} LIMIT 1
      `) as { id: string; name: string }[]
      const manager = managers[0]
      if (!manager) continue

      const existing = (await sql`
        SELECT id FROM "LsuAssignment" WHERE LOWER("lsuName") = ${lsuName.toLowerCase()} LIMIT 1
      `) as { id: string }[]

      if (existing[0]) {
        await sql`
          UPDATE "LsuAssignment"
          SET "lsuName" = ${lsuName},
              "operationsManagerId" = ${manager.id},
              "operationsManagerName" = ${manager.name},
              "updatedAt" = ${now}
          WHERE id = ${existing[0].id}
        `
      } else {
        await sql`
          INSERT INTO "LsuAssignment" (id, "lsuName", "operationsManagerId", "operationsManagerName", "createdAt", "updatedAt")
          VALUES (${generateId()}, ${lsuName}, ${manager.id}, ${manager.name}, ${now}, ${now})
        `
      }

      await sql`
        UPDATE "Customer"
        SET "operationsIncharge" = ${manager.name},
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE LOWER(TRIM("lsuName")) = ${lsuName.toLowerCase()}
      `
      saved++
    }

    const assignments = await sql`
      SELECT id, "lsuName", "operationsManagerId", "operationsManagerName"
      FROM "LsuAssignment"
      ORDER BY "lsuName" ASC
    `
    return NextResponse.json({ success: true, saved, assignments })
  } catch (error) {
    console.error("lsu-assignments POST:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
