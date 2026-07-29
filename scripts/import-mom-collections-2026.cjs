/**
 * Import Feb 2026 – Jul 2026 collections from the Collection Master PDF.
 * Only customers already in the database. No emails.
 *
 * Usage: node scripts/import-mom-collections-2026.cjs
 */
require("dotenv").config({ path: require("path").join(process.cwd(), ".env") })
const fs = require("fs")
const path = require("path")
const crypto = require("crypto")
const { spawnSync } = require("child_process")
const { Pool } = require("pg")

const PDF =
  "/Users/aryanprajapati/Documents/Collection Master and Month On Month Collection - Google Sheets.pdf"
const OUT_DIR = path.join(process.cwd(), "outputs/customer_import_review")
const EXTRACT_JSON = path.join(OUT_DIR, "mom_2026_feb_jul_extract.json")
const BATCH = 200
const SOURCE_TAG = "Collection Master MoM PDF"
const NOTES_TAG = "Collection Master MoM Feb-Jul 2026"

const MONTH_MAP = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
}

function metricsFromWaste(totalWasteKg) {
  const cigaretteButts = Math.round(totalWasteKg * 3000)
  const microplasticsKg = +(totalWasteKg * 0.8).toFixed(2)
  const waterProtectedL = Math.round(cigaretteButts * 100)
  const treesEquivalent = Math.max(0, Math.round(totalWasteKg * 8.14))
  const co2AvoidedKg = Math.round(totalWasteKg * 178)
  return { cigaretteButts, microplasticsKg, waterProtectedL, treesEquivalent, co2AvoidedKg }
}

function extractWithPython() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const py = `
from pypdf import PdfReader
import re, json
path = ${JSON.stringify(PDF)}
out = ${JSON.stringify(EXTRACT_JSON)}
reader = PdfReader(path)
text = "\\n".join((p.extract_text() or "") for p in reader.pages)
pat = re.compile(r"(BI\\d+)\\s+([A-Za-z]{3,9})\\s+(\\d{2})\\s+([0-9]+(?:\\.[0-9]+)?)")
rows = []
for m in pat.finditer(text):
    rows.append({
        "customerId": m.group(1).upper(),
        "monthToken": m.group(2),
        "yearToken": m.group(3),
        "weight": float(m.group(4)),
    })
with open(out, "w") as f:
    json.dump({"source": path, "rows": rows, "count": len(rows)}, f)
print(len(rows))
`
  const res = spawnSync("python3", ["-c", py], { encoding: "utf8" })
  if (res.status !== 0) {
    throw new Error(`PDF extract failed: ${res.stderr || res.stdout}`)
  }
  console.log(`Extracted ${String(res.stdout).trim()} rows from PDF`)
}

function parsePeriod(monthToken, yearToken) {
  const mon = MONTH_MAP[String(monthToken || "").trim().toLowerCase()]
  const yy = Number(yearToken)
  if (!mon || !Number.isFinite(yy)) return null
  const year = yy < 100 ? 2000 + yy : yy
  // Only Feb–Jul 2026 for this import
  if (year !== 2026 || mon < 2 || mon > 7) return null
  return {
    year,
    month: mon,
    key: `${year}-${String(mon).padStart(2, "0")}`,
    date: new Date(Date.UTC(year, mon - 1, 1, 12, 0, 0)),
  }
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing")
  if (!fs.existsSync(PDF)) throw new Error(`PDF not found: ${PDF}`)

  extractWithPython()
  const extracted = JSON.parse(fs.readFileSync(EXTRACT_JSON, "utf8"))
  const rawRows = extracted.rows || []

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const dbRows = await pool.query(
    `SELECT id, "serviceStartDate", "joinDate" FROM "Customer"`,
  )
  const dbIds = new Set(dbRows.rows.map((r) => String(r.id).toUpperCase()))
  /** @type {Map<string, Date>} */
  const startById = new Map()
  for (const r of dbRows.rows) {
    const start = r.serviceStartDate || r.joinDate
    if (start) startById.set(String(r.id).toUpperCase(), new Date(start))
  }

  /** @type {Map<string, { customerId: string, period: string, date: Date, weight: number }>} */
  const byKey = new Map()
  const summary = {
    pdfRows: rawRows.length,
    skippedOutOfRange: 0,
    skippedNotInDb: 0,
    skippedBadParse: 0,
    duplicateMonthsMerged: 0,
    customersTouched: 0,
    collectionsInserted: 0,
    skippedCustomerIds: [],
  }
  const skippedIds = new Set()

  for (const row of rawRows) {
    const customerId = String(row.customerId || "")
      .trim()
      .toUpperCase()
    const period = parsePeriod(row.monthToken, row.yearToken)
    if (!period) {
      summary.skippedOutOfRange++
      continue
    }
    if (!customerId || !/^BI\d+$/.test(customerId)) {
      summary.skippedBadParse++
      continue
    }
    if (!dbIds.has(customerId)) {
      summary.skippedNotInDb++
      skippedIds.add(customerId)
      continue
    }
    const install = startById.get(customerId)
    if (install) {
      const startMonth = Date.UTC(install.getUTCFullYear(), install.getUTCMonth(), 1)
      const rowMonth = Date.UTC(period.year, period.month - 1, 1)
      if (rowMonth < startMonth) {
        summary.skippedOutOfRange++
        continue
      }
    }
    const weight = Number(row.weight)
    const w = Number.isFinite(weight) ? weight : 0
    const mapKey = `${customerId}|${period.key}`
    if (byKey.has(mapKey)) {
      summary.duplicateMonthsMerged++
      byKey.get(mapKey).weight = +(byKey.get(mapKey).weight + w).toFixed(6)
    } else {
      byKey.set(mapKey, {
        customerId,
        period: period.key,
        date: period.date,
        weight: +w.toFixed(6),
      })
    }
  }

  summary.skippedCustomerIds = [...skippedIds].sort()
  const rows = [...byKey.values()].sort((a, b) =>
    a.customerId === b.customerId
      ? a.period.localeCompare(b.period)
      : a.customerId.localeCompare(b.customerId),
  )
  const customerIds = [...new Set(rows.map((r) => r.customerId))]
  summary.customersTouched = customerIds.length

  console.log(
    `Importing ${rows.length} month-rows for ${customerIds.length} DB customers (skip ${summary.skippedNotInDb} not in DB)…`,
  )

  // Idempotent: remove prior MoM import for these customers / periods
  if (customerIds.length) {
    await pool.query(
      `DELETE FROM "Collection"
       WHERE "customerId" = ANY($1::text[])
         AND (notes = $2 OR location = $3)
         AND date >= $4::timestamptz
         AND date < $5::timestamptz`,
      [
        customerIds,
        NOTES_TAG,
        SOURCE_TAG,
        "2026-02-01T00:00:00.000Z",
        "2026-08-01T00:00:00.000Z",
      ],
    )
  }

  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    for (let i = 0; i < rows.length; i += BATCH) {
      const chunk = rows.slice(i, i + BATCH)
      const values = []
      const params = []
      let p = 1
      for (const r of chunk) {
        const id = `col_mom_${r.customerId}_${r.period.replace("-", "")}_${crypto.randomBytes(3).toString("hex")}`
        values.push(`($${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++})`)
        params.push(id, r.customerId, r.date.toISOString(), r.weight, SOURCE_TAG, "Completed", NOTES_TAG)
      }
      await client.query(
        `INSERT INTO "Collection" (id, "customerId", date, weight, location, status, notes)
         VALUES ${values.join(",")}`,
        params,
      )
      summary.collectionsInserted += chunk.length
      process.stdout.write(`\r  inserted ${summary.collectionsInserted}/${rows.length}`)
    }

    // Bulk refresh impact metrics for touched customers (one query)
    await client.query(
      `
      WITH totals AS (
        SELECT c."customerId" AS id, COALESCE(SUM(c.weight), 0)::float AS total
        FROM "Collection" c
        WHERE c."customerId" = ANY($1::text[])
        GROUP BY c."customerId"
      )
      UPDATE "Customer" cu SET
        "totalWasteCollected" = t.total,
        "cigaretteButtsCollected" = ROUND(t.total * 3000),
        "microplasticsUpcycled" = ROUND((t.total * 0.8)::numeric, 2),
        "waterResourcesProtected" = ROUND(t.total * 3000) * 100,
        "treesEquivalent" = GREATEST(0, ROUND(t.total * 8.14)),
        "co2Saved" = ROUND(t.total * 178),
        "updatedAt" = CURRENT_TIMESTAMP
      FROM totals t
      WHERE cu.id = t.id
      `,
      [customerIds],
    )
    await client.query("COMMIT")
  } catch (e) {
    await client.query("ROLLBACK")
    throw e
  } finally {
    client.release()
  }

  const bi001 = await pool.query(
    `SELECT to_char(date, 'YYYY-MM') AS ym, weight, location
     FROM "Collection"
     WHERE "customerId" = 'BI001' AND date >= '2026-02-01' AND date < '2026-08-01'
     ORDER BY date`,
  )
  const bi001Total = await pool.query(
    `SELECT "totalWasteCollected" FROM "Customer" WHERE id = 'BI001'`,
  )
  const totalCols = await pool.query(`SELECT count(*)::int AS n FROM "Collection"`)
  await pool.end()

  const report = {
    at: new Date().toISOString(),
    summary,
    dbCollectionCount: totalCols.rows[0].n,
    sampleBI001Mom: bi001.rows,
    sampleBI001TotalWaste: bi001Total.rows[0]?.totalWasteCollected ?? null,
  }
  const reportPath = path.join(OUT_DIR, "mom_2026_import_result.json")
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

  console.log("\nDone.")
  console.log(
    JSON.stringify(
      {
        collectionsInserted: summary.collectionsInserted,
        customersTouched: summary.customersTouched,
        skippedNotInDbRows: summary.skippedNotInDb,
        skippedCustomerCount: summary.skippedCustomerIds.length,
        skippedCustomerIdsSample: summary.skippedCustomerIds.slice(0, 15),
        bi001Mom: bi001.rows,
        bi001TotalWaste: bi001Total.rows[0]?.totalWasteCollected ?? null,
        dbCollectionCount: totalCols.rows[0].n,
        reportPath,
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
