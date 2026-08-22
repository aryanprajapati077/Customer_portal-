/**
 * Import / refresh collections for BI451 and BI457.
 * BI451: historic Nov 2025 – Jan 2026 + MoM Feb–Jul 2026 from PDF
 * BI457: MoM Feb–Jul 2026 from PDF only
 *
 * Usage: node scripts/import-bi451-bi457-collections.cjs
 */
require("dotenv").config({ path: require("path").join(process.cwd(), ".env") })
const fs = require("fs")
const crypto = require("crypto")
const bcrypt = require("bcryptjs")
const { spawnSync } = require("child_process")
const { Pool } = require("pg")

const PDF =
  "/Users/aryanprajapati/Downloads/Collection Master and Month On Month Collection - Google Sheets.pdf"
const TARGET_IDS = ["BI451", "BI457"]
const HISTORIC_TAG = "Collection Master historic sync"
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
}

const HISTORIC_BY_CUSTOMER = {
  BI451: [
    ["2025-11", 0.4],
    ["2025-12", 0.4],
    ["2026-01", 0],
  ],
}

const CUSTOMER_CREATE = {
  BI451: {
    email: "bi451@import.buffindia.local",
    companyName: "WNS Global Services Pvt. Ltd , Thane",
    tradeName: null,
    city: "Navi Mumbai",
    state: "Maharashtra",
    lsuName: "Mumbai",
    operationsIncharge: "Yash",
    serviceStartDate: "2025-10-23T00:00:00.000Z",
    noOfKiosk: 2,
    noOfAdvanceKiosk: 0,
    collectionFrequency: "Monthly",
    contactPerson: "Yash",
  },
  BI457: {
    email: "bi457@import.buffindia.local",
    companyName: "Dlf Chandigarh",
    tradeName: "Jones Lang Lasalle Building Operations Private Limited",
    city: "Chandigarh",
    state: "Punjab",
    lsuName: "Chandigarh",
    operationsIncharge: "Yash",
    serviceStartDate: "2026-02-06T00:00:00.000Z",
    noOfKiosk: 2,
    noOfAdvanceKiosk: 2,
    collectionFrequency: "Monthly",
    contactPerson: "Yash",
  },
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

async function ensureCustomer(pool, id, data) {
  const exists = await pool.query(`SELECT id FROM "Customer" WHERE id = $1 LIMIT 1`, [id])
  if (exists.rows[0]) return false

  const hash = await bcrypt.hash(crypto.randomBytes(8).toString("hex"), 12)
  const serviceStart = new Date(data.serviceStartDate)
  await pool.query(
    `INSERT INTO "Customer" (
      id, email, password, "companyName", "tradeName", city, state, "lsuName",
      "operationsIncharge", "serviceStartDate", "joinDate", "noOfKiosk", "noOfAdvanceKiosk",
      "collectionFrequency", "contactPerson", status, "serviceStatus", "createdAt", "updatedAt"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10, $11, $12, $13, $14, 'Active', 'ACTIVE',
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )`,
    [
      id,
      data.email,
      hash,
      data.companyName,
      data.tradeName,
      data.city,
      data.state,
      data.lsuName,
      data.operationsIncharge,
      serviceStart,
      data.noOfKiosk,
      data.noOfAdvanceKiosk || 0,
      data.collectionFrequency,
      data.contactPerson,
    ],
  )
  return true
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing")
  if (!fs.existsSync(PDF)) throw new Error(`PDF not found: ${PDF}`)

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const created = []
  for (const id of TARGET_IDS) {
    if (await ensureCustomer(pool, id, CUSTOMER_CREATE[id])) created.push(id)
  }

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
           notes IN ($2, $3, 'Historic Data.xlsx', 'Collection Master historic (BI147/BI386)')
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

  console.log(JSON.stringify({ created, rowsInserted: rows.length, customers: totals.rows, collections: verify.rows }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
