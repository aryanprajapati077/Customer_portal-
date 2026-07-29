/**
 * Import Historic Data.xlsx into Collection rows.
 * - Matches by Customer ID
 * - Only customers already in the database
 * - Fixes Excel date quirk: day-of-month encodes year (22→2022 … 26→2026)
 * - Does NOT send emails
 *
 * Usage: node scripts/import-historic-collections.cjs
 */
require("dotenv").config({ path: require("path").join(process.cwd(), ".env") })
const fs = require("fs")
const path = require("path")
const crypto = require("crypto")
const ExcelJS = require("exceljs")
const { Pool } = require("pg")

const HISTORIC_FILE = "/Users/aryanprajapati/Downloads/Historic Data.xlsx"
const OUT_DIR = path.join(process.cwd(), "outputs/customer_import_review")
const BATCH = 200

/** Excel stored months as Date with year=2026 and day=actual year (22–26). */
function parseHistoricMonth(value) {
  if (!(value instanceof Date) && (value == null || value === "")) return null
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return null
  const day = d.getUTCDate()
  const monthIndex = d.getUTCMonth() // 0-11
  if (day < 22 || day > 30) {
    // fallback if somehow real dates appear
    return {
      year: d.getUTCFullYear(),
      month: monthIndex + 1,
      date: new Date(Date.UTC(d.getUTCFullYear(), monthIndex, 1, 12, 0, 0)),
      key: `${d.getUTCFullYear()}-${String(monthIndex + 1).padStart(2, "0")}`,
    }
  }
  const year = 2000 + day
  const month = monthIndex + 1
  return {
    year,
    month,
    date: new Date(Date.UTC(year, monthIndex, 1, 12, 0, 0)),
    key: `${year}-${String(month).padStart(2, "0")}`,
  }
}

function metricsFromWaste(totalWasteKg) {
  const cigaretteButts = Math.round(totalWasteKg * 3000)
  const microplasticsKg = +(totalWasteKg * 0.8).toFixed(2)
  const waterProtectedL = Math.round(cigaretteButts * 100)
  const treesEquivalent = Math.max(0, Math.round(totalWasteKg * 8.14))
  const co2AvoidedKg = Math.round(totalWasteKg * 178)
  return { cigaretteButts, microplasticsKg, waterProtectedL, treesEquivalent, co2AvoidedKg }
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing")
  if (!fs.existsSync(HISTORIC_FILE)) throw new Error(`File not found: ${HISTORIC_FILE}`)

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const dbIds = new Set(
    (await pool.query(`SELECT id FROM "Customer"`)).rows.map((r) => String(r.id).toUpperCase()),
  )

  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(HISTORIC_FILE)
  const ws = wb.getWorksheet("Historic Data") || wb.worksheets[0]

  /** @type {Map<string, { customerId: string, period: string, date: Date, weight: number }>} */
  const byKey = new Map()
  const summary = {
    excelRows: 0,
    skippedNotInDb: 0,
    skippedBadDate: 0,
    skippedBadId: 0,
    duplicateMonthsMerged: 0,
    customersTouched: 0,
    collectionsInserted: 0,
    historicCustomersSkipped: [],
  }
  const skippedIds = new Set()

  ws.eachRow({ includeEmpty: false }, (row, n) => {
    if (n === 1) return
    summary.excelRows++
    const customerId = String(row.getCell(1).value || "")
      .trim()
      .toUpperCase()
    if (!customerId || !/^BI\d+$/i.test(customerId)) {
      summary.skippedBadId++
      return
    }
    if (!dbIds.has(customerId)) {
      summary.skippedNotInDb++
      skippedIds.add(customerId)
      return
    }
    const parsed = parseHistoricMonth(row.getCell(2).value)
    if (!parsed) {
      summary.skippedBadDate++
      return
    }
    const weightRaw = row.getCell(3).value
    const weight = Number(weightRaw)
    const w = Number.isFinite(weight) ? weight : 0

    const mapKey = `${customerId}|${parsed.key}`
    if (byKey.has(mapKey)) {
      summary.duplicateMonthsMerged++
      const prev = byKey.get(mapKey)
      prev.weight = +(prev.weight + w).toFixed(6)
    } else {
      byKey.set(mapKey, {
        customerId,
        period: parsed.key,
        date: parsed.date,
        weight: +w.toFixed(6),
      })
    }
  })

  summary.historicCustomersSkipped = [...skippedIds].sort()

  const rows = [...byKey.values()].sort((a, b) =>
    a.customerId === b.customerId
      ? a.period.localeCompare(b.period)
      : a.customerId.localeCompare(b.customerId),
  )

  const customerIds = [...new Set(rows.map((r) => r.customerId))]
  summary.customersTouched = customerIds.length

  console.log(
    `Preparing ${rows.length} month-rows for ${customerIds.length} DB customers (skip ${summary.skippedNotInDb} rows not in DB)…`,
  )

  // Remove prior historic imports for these customers (idempotent re-run)
  if (customerIds.length) {
    await pool.query(
      `DELETE FROM "Collection"
       WHERE "customerId" = ANY($1::text[])
         AND (notes = $2 OR location = $3)`,
      [customerIds, "Historic Data.xlsx", "Historic import"],
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
        const id = `col_hist_${r.customerId}_${r.period.replace("-", "")}_${crypto.randomBytes(3).toString("hex")}`
        values.push(`($${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++})`)
        params.push(
          id,
          r.customerId,
          r.date.toISOString(),
          r.weight,
          "Historic import",
          "Completed",
          "Historic Data.xlsx",
        )
      }
      await client.query(
        `INSERT INTO "Collection" (id, "customerId", date, weight, location, status, notes)
         VALUES ${values.join(",")}`,
        params,
      )
      summary.collectionsInserted += chunk.length
      process.stdout.write(`\r  inserted ${summary.collectionsInserted}/${rows.length}`)
    }

    // Refresh customer impact aggregates from all collections
    for (const customerId of customerIds) {
      const agg = await client.query(
        `SELECT COALESCE(SUM(weight), 0)::float AS total, COUNT(*)::int AS n
         FROM "Collection" WHERE "customerId" = $1`,
        [customerId],
      )
      const totalWasteKg = Number(agg.rows[0].total) || 0
      const m = metricsFromWaste(totalWasteKg)
      await client.query(
        `UPDATE "Customer" SET
           "totalWasteCollected" = $2,
           "cigaretteButtsCollected" = $3,
           "microplasticsUpcycled" = $4,
           "waterResourcesProtected" = $5,
           "treesEquivalent" = $6,
           "co2Saved" = $7,
           "updatedAt" = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [
          customerId,
          totalWasteKg,
          m.cigaretteButts,
          m.microplasticsKg,
          m.waterProtectedL,
          m.treesEquivalent,
          m.co2AvoidedKg,
        ],
      )
    }

    await client.query("COMMIT")
  } catch (e) {
    await client.query("ROLLBACK")
    throw e
  } finally {
    client.release()
  }

  // Verify BI001
  const bi001 = await pool.query(
    `SELECT to_char(date, 'YYYY-MM') AS ym, weight
     FROM "Collection"
     WHERE "customerId" = 'BI001'
     ORDER BY date ASC`,
  )
  const bi001Cust = await pool.query(
    `SELECT id, "totalWasteCollected", "cigaretteButtsCollected", "serviceStartDate"
     FROM "Customer" WHERE id = 'BI001'`,
  )
  const totalCols = await pool.query(`SELECT count(*)::int AS n FROM "Collection"`)

  await pool.end()

  fs.mkdirSync(OUT_DIR, { recursive: true })
  const report = {
    at: new Date().toISOString(),
    summary,
    dbCollectionCount: totalCols.rows[0].n,
    sampleBI001: {
      customer: bi001Cust.rows[0] || null,
      months: bi001.rows.length,
      first: bi001.rows.slice(0, 3),
      last: bi001.rows.slice(-3),
      sumWeight: bi001.rows.reduce((s, r) => s + Number(r.weight), 0),
    },
  }
  const reportPath = path.join(OUT_DIR, "historic_import_result.json")
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

  console.log("\nDone.")
  console.log(
    JSON.stringify(
      {
        collectionsInserted: summary.collectionsInserted,
        customersTouched: summary.customersTouched,
        skippedNotInDbRows: summary.skippedNotInDb,
        skippedCustomerIds: summary.historicCustomersSkipped,
        duplicateMonthsMerged: summary.duplicateMonthsMerged,
        dbCollectionCount: totalCols.rows[0].n,
        bi001: report.sampleBI001,
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
