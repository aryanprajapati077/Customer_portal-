/**
 * Import / refresh collections for BI147 and BI386.
 * - Historic: installation through Jan 2026 (from Collection Master historic tables / images)
 * - MoM: Feb 2026 – Jul 2026 from Collection Master PDF
 * - Creates BI386 customer if missing
 *
 * Usage: node scripts/import-bi147-bi386-collections.cjs
 */
require("dotenv").config({ path: require("path").join(process.cwd(), ".env") })
const fs = require("fs")
const path = require("path")
const crypto = require("crypto")
const bcrypt = require("bcryptjs")
const { spawnSync } = require("child_process")
const { Pool } = require("pg")

const PDF =
  "/Users/aryanprajapati/Downloads/Collection Master and Month On Month Collection - Google Sheets.pdf"
const TARGET_IDS = ["BI147", "BI386"]
const HISTORIC_TAG = "Collection Master historic (BI147/BI386)"
const MOM_TAG = "Collection Master MoM Feb-Jul 2026"
const HISTORIC_LOC = "Collection Master historic"
const MOM_LOC = "Collection Master MoM PDF"

const MONTH_MAP = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
}

/** @type {Record<string, [string, number][]>} period YYYY-MM, weight kg */
const HISTORIC_BY_CUSTOMER = {
  BI147: [
    ["2024-05", 0.7],
    ["2024-06", 0],
    ["2024-07", 0.195],
    ["2024-08", 0],
    ["2024-09", 0.26],
    ["2024-10", 1.36],
    ["2024-11", 0],
    ["2024-12", 0.21],
    ["2025-01", 0.281],
    ["2025-02", 0.15],
    ["2025-03", 0.15],
    ["2025-04", 0.11],
    ["2025-05", 0.34],
    ["2025-06", 0.11],
    ["2025-07", 0.41],
    ["2025-08", 0.075],
    ["2025-09", 0.14],
    ["2025-10", 0.187],
    ["2025-11", 0.12],
    ["2025-12", 0.157],
    ["2026-01", 0.08],
  ],
  BI386: [
    ["2025-09", 0.15],
    ["2025-10", 0.15],
    ["2025-11", 0.2],
    ["2025-12", 0.35],
    ["2026-01", 0],
  ],
}

function monthDate(period) {
  const [y, m] = period.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, 1, 12, 0, 0))
}

function metricsFromWaste(totalWasteKg) {
  return {
    cigaretteButts: Math.round(totalWasteKg * 3000),
    microplasticsKg: +(totalWasteKg * 0.8).toFixed(2),
    waterProtectedL: Math.round(totalWasteKg * 3000) * 100,
    treesEquivalent: Math.max(0, Math.round(totalWasteKg * 8.14)),
    co2AvoidedKg: Math.round(totalWasteKg * 178),
  }
}

function extractPdfMomRows() {
  const py = `
from pypdf import PdfReader
import re, json
path = ${JSON.stringify(PDF)}
reader = PdfReader(path)
text = "\\n".join((p.extract_text() or "") for p in reader.pages)
pat = re.compile(r"(BI\\d+)\\s+([A-Za-z]{3,9})\\s+(\\d{2})\\s+([0-9]+(?:\\.[0-9]+)?)")
rows = []
for m in pat.finditer(text):
    cid = m.group(1).upper()
    if cid not in (${JSON.stringify(TARGET_IDS)}):
        continue
    rows.append({
        "customerId": cid,
        "monthToken": m.group(2),
        "yearToken": m.group(3),
        "weight": float(m.group(4)),
    })
print(json.dumps(rows))
`
  const res = spawnSync("python3", ["-c", py], { encoding: "utf8" })
  if (res.status !== 0) throw new Error(res.stderr || res.stdout)
  return JSON.parse(String(res.stdout).trim())
}

function parseMomPeriod(monthToken, yearToken) {
  const mon = MONTH_MAP[String(monthToken || "").trim().toLowerCase()]
  const yy = Number(yearToken)
  if (!mon || !Number.isFinite(yy)) return null
  const year = yy < 100 ? 2000 + yy : yy
  if (year !== 2026 || mon < 2 || mon > 7) return null
  return `${year}-${String(mon).padStart(2, "0")}`
}

async function ensureBi386(pool) {
  const exists = await pool.query(`SELECT id FROM "Customer" WHERE id = 'BI386' LIMIT 1`)
  if (exists.rows[0]) return false

  const hash = await bcrypt.hash(crypto.randomBytes(8).toString("hex"), 12)
  await pool.query(
    `INSERT INTO "Customer" (
      id, email, password, "companyName", "tradeName", city, state, "lsuName",
      "operationsIncharge", "serviceStartDate", "joinDate", "noOfKiosk",
      "collectionFrequency", "contactPerson", status, "serviceStatus",
      "createdAt", "updatedAt"
    ) VALUES (
      'BI386', $1, $2, $3, $4, $5, $6, $7, $8, $9, $9, $10, $11, $12, 'Active', 'ACTIVE',
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )`,
    [
      "bi386@import.buffindia.local",
      hash,
      "INS SHIKRA MAIN GATE , Mumbai",
      "Indian Naval Ship Shikra",
      "Mumbai",
      "Maharashtra",
      "Mumbai",
      "Yash",
      new Date("2025-09-05T00:00:00.000Z"),
      3,
      "Monthly",
      "Yash",
    ],
  )
  return true
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing")
  if (!fs.existsSync(PDF)) throw new Error(`PDF not found: ${PDF}`)

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const createdBi386 = await ensureBi386(pool)

  /** @type {{ customerId: string, period: string, weight: number, notes: string, location: string }[]} */
  const rows = []

  for (const customerId of TARGET_IDS) {
    for (const [period, weight] of HISTORIC_BY_CUSTOMER[customerId] || []) {
      rows.push({
        customerId,
        period,
        weight: +Number(weight).toFixed(6),
        notes: HISTORIC_TAG,
        location: HISTORIC_LOC,
      })
    }
  }

  const pdfRows = extractPdfMomRows()
  const momByKey = new Map()
  for (const row of pdfRows) {
    const period = parseMomPeriod(row.monthToken, row.yearToken)
    if (!period) continue
    const key = `${row.customerId}|${period}`
    const w = Number.isFinite(row.weight) ? row.weight : 0
    if (momByKey.has(key)) momByKey.set(key, +(momByKey.get(key) + w).toFixed(6))
    else momByKey.set(key, +w.toFixed(6))
  }
  for (const [key, weight] of momByKey) {
    const [customerId, period] = key.split("|")
    rows.push({ customerId, period, weight, notes: MOM_TAG, location: MOM_LOC })
  }

  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    await client.query(
      `DELETE FROM "Collection"
       WHERE "customerId" = ANY($1::text[])
         AND (
           notes IN ($2, $3, 'Historic Data.xlsx')
           OR location IN ($4, $5, 'Historic import', $6)
         )`,
      [TARGET_IDS, HISTORIC_TAG, MOM_TAG, HISTORIC_LOC, MOM_LOC, "Collection Master MoM Feb-Jul 2026"],
    )

    for (const r of rows) {
      const id = `col_sync_${r.customerId}_${r.period.replace("-", "")}_${crypto.randomBytes(3).toString("hex")}`
      await client.query(
        `INSERT INTO "Collection" (id, "customerId", date, weight, location, status, notes)
         VALUES ($1, $2, $3, $4, $5, 'Completed', $6)`,
        [id, r.customerId, monthDate(r.period).toISOString(), r.weight, r.location, r.notes],
      )
    }

    for (const customerId of TARGET_IDS) {
      const agg = await client.query(
        `SELECT COALESCE(SUM(weight), 0)::float AS total FROM "Collection" WHERE "customerId" = $1`,
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

  const verify = await pool.query(
    `SELECT "customerId", to_char(date, 'YYYY-MM') AS ym, weight, notes
     FROM "Collection"
     WHERE "customerId" = ANY($1::text[])
     ORDER BY "customerId", date`,
    [TARGET_IDS],
  )

  const totals = await pool.query(
    `SELECT id, "companyName", "totalWasteCollected" FROM "Customer" WHERE id = ANY($1::text[]) ORDER BY id`,
    [TARGET_IDS],
  )

  await pool.end()

  console.log(
    JSON.stringify(
      {
        createdBi386,
        rowsInserted: rows.length,
        momPdfRowsUsed: momByKey.size,
        customers: totals.rows,
        collections: verify.rows,
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
