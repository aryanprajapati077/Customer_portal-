/**
 * Import lat/long from:
 * 1) Buffindia Technician System PDF (primary)
 * 2) Buffindia Customer Location Master coordinates PDF (fill blanks only)
 *
 * Usage: npx tsx scripts/import-latlong-from-pdfs.ts
 */
import "dotenv/config"
import { readFileSync } from "fs"
import path from "path"
import { sql } from "../lib/db"

type Coord = { latitude: number; longitude: number; source: string }

async function main() {
  await sql.query(`
    ALTER TABLE "Customer"
      ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION
  `)

  const file = path.join(process.cwd(), "scripts/latlong-import.json")
  const data = JSON.parse(readFileSync(file, "utf8")) as {
    merged: Record<string, Coord>
  }

  const ids = Object.keys(data.merged).sort()
  let updated = 0
  let unchanged = 0
  let notFound: string[] = []
  let invalid: string[] = []
  const samples: Array<{ id: string; latitude: number; longitude: number; source: string }> = []

  for (const id of ids) {
    const row = data.merged[id]
    const lat = Number(row.latitude)
    const lon = Number(row.longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      invalid.push(id)
      continue
    }
    if (lat < 6 || lat > 37.5 || lon < 68 || lon > 98.5) {
      invalid.push(`${id}:${lat},${lon}`)
      continue
    }

    const result = await sql`
      UPDATE "Customer"
      SET latitude = ${lat},
          longitude = ${lon},
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, latitude, longitude
    `
    if (!result[0]) {
      notFound.push(id)
      continue
    }
    updated++
    if (samples.length < 12) {
      samples.push({ id, latitude: lat, longitude: lon, source: row.source })
    }
  }

  const withCoords = await sql`
    SELECT COUNT(*)::int AS n FROM "Customer"
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
  `

  console.log(
    JSON.stringify(
      {
        totalInImport: ids.length,
        updated,
        unchanged,
        notFoundCount: notFound.length,
        notFound,
        invalid,
        customersWithCoordsNow: withCoords[0]?.n,
        samples,
      },
      null,
      2,
    ),
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
