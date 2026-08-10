/**
 * Remove specific customer accounts and all related data (reports, collections, etc.)
 * Usage: npx tsx scripts/delete-customers-by-id.ts BI503 BI504 BI505 BI506
 */
import "dotenv/config"
import { sql } from "../lib/db"

const DEFAULT_IDS = ["BI503", "BI504", "BI505", "BI506"]

async function main() {
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_IDS

  for (const id of ids) {
    const customers = await sql<{ id: string; companyName: string; email: string }>`
      SELECT id, "companyName", email FROM "Customer" WHERE id = ${id} LIMIT 1
    `
    if (!customers[0]) {
      console.log(`Skip ${id} — not found`)
      continue
    }

    const c = customers[0]
    const reportCount = await sql<{ count: string }>`
      SELECT COUNT(*)::text AS count FROM "Report" WHERE "customerId" = ${id}
    `
    const collectionCount = await sql<{ count: string }>`
      SELECT COUNT(*)::text AS count FROM "Collection" WHERE "customerId" = ${id}
    `

    console.log(
      `Deleting ${c.id} (${c.companyName}, ${c.email}) — ${reportCount[0]?.count || 0} reports, ${collectionCount[0]?.count || 0} collections`,
    )

    await sql`UPDATE "Customer" SET "parentCustomerId" = NULL WHERE "parentCustomerId" = ${id}`

    await sql`DELETE FROM "Customer" WHERE id = ${id}`

    console.log(`  ✓ Deleted ${id}`)
  }

  console.log("Done.")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
