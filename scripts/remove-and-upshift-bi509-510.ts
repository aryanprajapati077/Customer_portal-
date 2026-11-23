/**
 * Delete BI509 + BI510, then renumber BI511+ down by 2 (BI511 → BI509, …).
 * Usage: npx tsx scripts/remove-and-upshift-bi509-510.ts
 */
import "dotenv/config"
import { sql } from "../lib/db"

const REMOVE = ["BI509", "BI510"] as const
const SHIFT = 2
const MIN_TO_SHIFT = 511

const LOOSE_TABLES = [
  "CustomerPortalUser",
  "EmailDeliveryLog",
  "PortalPageView",
  "PortalSession",
  "RenewalResponse",
  "ReportSendItem",
  "SupportTicket",
] as const

function biNum(id: string) {
  const m = /^BI(\d+)$/i.exec(id)
  return m ? Number(m[1]) : null
}

function formatBi(n: number) {
  return `BI${String(n).padStart(3, "0")}`
}

async function deleteLoose(id: string) {
  for (const table of LOOSE_TABLES) {
    const deleted = await sql.query<{ customerId: string }>(
      `DELETE FROM "${table}" WHERE "customerId" = $1 RETURNING "customerId"`,
      [id],
    )
    if (deleted.length > 0) console.log(`  deleted ${deleted.length} from ${table}`)
  }
}

async function updateLoose(oldId: string, newId: string) {
  for (const table of LOOSE_TABLES) {
    const updated = await sql.query<{ customerId: string }>(
      `UPDATE "${table}" SET "customerId" = $1 WHERE "customerId" = $2 RETURNING "customerId"`,
      [newId, oldId],
    )
    if (updated.length > 0) console.log(`  ${table}: ${oldId} → ${newId} (${updated.length})`)
  }
}

async function main() {
  for (const id of REMOVE) {
    const rows = await sql`
      SELECT id, "companyName", email FROM "Customer" WHERE id = ${id} LIMIT 1
    `
    if (!rows[0]) {
      console.log(`Skip remove ${id} — not found`)
      continue
    }
    console.log(`Removing ${rows[0].id} — ${rows[0].companyName} <${rows[0].email}>`)
    await deleteLoose(id)
    await sql`UPDATE "Customer" SET "parentCustomerId" = NULL WHERE "parentCustomerId" = ${id}`
    await sql`DELETE FROM "Customer" WHERE id = ${id}`
    console.log(`  ✓ deleted ${id}`)
  }

  const toShift = await sql<{ id: string; companyName: string }>`
    SELECT id, "companyName"
    FROM "Customer"
    WHERE id ~ '^BI[0-9]+$'
      AND CAST(SUBSTRING(id FROM 3) AS int) >= ${MIN_TO_SHIFT}
    ORDER BY CAST(SUBSTRING(id FROM 3) AS int) ASC
  `

  console.log(`\nUpshifting ${toShift.length} customers by -${SHIFT}...\n`)

  for (const row of toShift) {
    const n = biNum(row.id)
    if (n == null) continue
    const newId = formatBi(n - SHIFT)
    const collision = await sql`SELECT id FROM "Customer" WHERE id = ${newId} LIMIT 1`
    if (collision[0]) {
      throw new Error(`Collision: cannot rename ${row.id} → ${newId} (already exists)`)
    }

    await updateLoose(row.id, newId)
    await sql`UPDATE "Customer" SET id = ${newId}, "updatedAt" = CURRENT_TIMESTAMP WHERE id = ${row.id}`
    console.log(`${row.id} → ${newId}  (${row.companyName})`)
  }

  const after = await sql<{ id: string; companyName: string }>`
    SELECT id, "companyName"
    FROM "Customer"
    WHERE id ~ '^BI[0-9]+$'
      AND CAST(SUBSTRING(id FROM 3) AS int) >= 505
    ORDER BY CAST(SUBSTRING(id FROM 3) AS int)
  `
  console.log("\nAfter (≥ BI505):")
  for (const r of after) console.log(`  ${r.id}  ${r.companyName}`)
  console.log("Done.")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
