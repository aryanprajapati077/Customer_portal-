/**
 * Import reviewed Client+POC merge into Postgres.
 * - Uses Customer ID from sheet (BI001, …)
 * - Does NOT send welcome / any email
 *
 * Usage: node scripts/import-merged-customers.cjs
 */
require("dotenv").config({ path: require("path").join(process.cwd(), ".env") })
const fs = require("fs")
const path = require("path")
const bcrypt = require("bcryptjs")
const { Pool } = require("pg")

const REVIEW_JSON = path.join(process.cwd(), "outputs/customer_import_review/merged_review.json")
const SALT_ROUNDS = 12

const FREQ_MAP = {
  monthly: "Monthly",
  "every 2 months": "Every 2 month",
  "every 2 month": "Every 2 month",
  "every 3 months": "Every 3 month",
  "every 3 month": "Every 3 month",
  "2 times a month": "2 times a month",
}

function normalizeFrequency(raw) {
  const key = String(raw || "")
    .trim()
    .toLowerCase()
  return FREQ_MAP[key] || String(raw || "").trim() || null
}

function makeUniqueLoginEmail(preferred, customerId, used) {
  const idTag = String(customerId).toUpperCase()
  let base = String(preferred || "")
    .trim()
    .toLowerCase()
  if (!base || !base.includes("@")) {
    base = `${idTag.toLowerCase()}@import.buffindia.local`
  }
  if (!used.has(base)) {
    used.add(base)
    return base
  }
  const at = base.lastIndexOf("@")
  const local = base.slice(0, at)
  const domain = base.slice(at + 1)
  // strip existing +tag then add customer id
  const localRoot = local.includes("+") ? local.slice(0, local.indexOf("+")) : local
  let candidate = `${localRoot}+${idTag}@${domain}`
  let n = 2
  while (used.has(candidate)) {
    candidate = `${localRoot}+${idTag}-${n}@${domain}`
    n++
  }
  used.add(candidate)
  return candidate
}

function parseDate(raw) {
  if (!raw) return null
  const d = new Date(String(raw))
  return Number.isNaN(d.getTime()) ? null : d
}

function generatePassword(length = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
  let out = ""
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

async function ensureColumns(pool) {
  await pool.query(`
    ALTER TABLE "Customer"
      ADD COLUMN IF NOT EXISTS "tradeName" TEXT,
      ADD COLUMN IF NOT EXISTS "city" TEXT,
      ADD COLUMN IF NOT EXISTS "state" TEXT,
      ADD COLUMN IF NOT EXISTS "lsuName" TEXT,
      ADD COLUMN IF NOT EXISTS "lsuTechnicianName" TEXT,
      ADD COLUMN IF NOT EXISTS "operationsIncharge" TEXT,
      ADD COLUMN IF NOT EXISTS "primaryPocName" TEXT,
      ADD COLUMN IF NOT EXISTS "primaryPocEmail" TEXT,
      ADD COLUMN IF NOT EXISTS "primaryPocNumber" TEXT,
      ADD COLUMN IF NOT EXISTS "primaryPocDesignation" TEXT,
      ADD COLUMN IF NOT EXISTS "collectionPocs" TEXT,
      ADD COLUMN IF NOT EXISTS "serviceStartDate" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "noOfKiosk" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "noOfBasicKiosk" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "noOfAdvanceKiosk" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "noOfPanVendorKiosk" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "noOfWallMountKiosk" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "collectionFrequency" TEXT,
      ADD COLUMN IF NOT EXISTS "gstin" TEXT,
      ADD COLUMN IF NOT EXISTS "logoUrl" TEXT,
      ADD COLUMN IF NOT EXISTS "serviceStatus" TEXT DEFAULT 'ACTIVE',
      ADD COLUMN IF NOT EXISTS "contractEndDate" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "welcomeEmailSentAt" TIMESTAMP(3)
  `)
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing")
  if (!fs.existsSync(REVIEW_JSON)) {
    throw new Error(`Review JSON not found: ${REVIEW_JSON}. Run merge script first.`)
  }

  const payload = JSON.parse(fs.readFileSync(REVIEW_JSON, "utf8"))
  const ready = Array.isArray(payload.ready) ? payload.ready : []
  if (!ready.length) throw new Error("No ready rows to import")

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  await ensureColumns(pool)

  const existing = await pool.query(`SELECT id, email FROM "Customer"`)
  const usedEmails = new Set(
    existing.rows.map((r) => String(r.email || "").toLowerCase()).filter(Boolean),
  )
  const existingIds = new Set(existing.rows.map((r) => r.id))

  const summary = {
    total: ready.length,
    inserted: 0,
    updated: 0,
    failed: 0,
    skippedNoId: 0,
    uniqueEmailRemapped: 0,
    noPrimaryEmail: 0,
    errors: [],
  }

  // Pre-hash passwords in batches
  console.log(`Importing ${ready.length} customers (no emails will be sent)…`)

  for (const row of ready) {
    const id = String(row.customerId || "")
      .trim()
      .toUpperCase()
    if (!id || !/^BI\d+$/i.test(id)) {
      summary.skippedNoId++
      continue
    }

    try {
      const primaryEmailRaw = String(row.primaryPocEmail || "")
        .trim()
        .toLowerCase()
      const firstCollEmail = (row.collectionPocs || [])
        .map((p) => String(p.email || "").trim().toLowerCase())
        .find((e) => e.includes("@"))

      const preferredLogin = primaryEmailRaw || firstCollEmail || ""
      if (!primaryEmailRaw) summary.noPrimaryEmail++

      const loginEmail = makeUniqueLoginEmail(preferredLogin, id, usedEmails)
      if (loginEmail !== preferredLogin) summary.uniqueEmailRemapped++

      const collectionPocs = (row.collectionPocs || []).map((p) => ({
        name: String(p.name || "").trim(),
        email: String(p.email || "").trim().toLowerCase(),
        number: String(p.number || "").trim(),
        designation: String(p.designation || "").trim() || undefined,
        note: p.note || undefined,
      }))
      const collectionPocsJson = JSON.stringify(collectionPocs)

      const brandName = String(row.brandName || row.tradeName || id).trim() || id
      const tradeName = String(row.tradeName || "").trim() || null
      const city = String(row.city || "").trim() || null
      const state = String(row.state || "").trim() || null
      const lsuName = String(row.lsuName || "").trim() || null
      const lsuTechnicianName = String(row.lsuTechnicianName || "").trim() || null
      const operationsIncharge = String(row.operationsIncharge || "").trim() || null
      const primaryPocName = String(row.primaryPocName || "").trim() || null
      const primaryPocEmail = primaryEmailRaw || null
      const primaryPocNumber = String(row.primaryPocNumber || "").trim() || null
      const primaryPocDesignation = String(row.primaryPocDesignation || "").trim() || null
      const collectionFrequency = normalizeFrequency(row.collectionFrequency)
      const serviceStartDate = parseDate(row.serviceStartDate)
      const noOfKiosk = Math.max(0, Math.floor(Number(row.noOfKiosk) || 0))
      const address = [city, state].filter(Boolean).join(", ") || null
      const now = new Date()
      const joinDate = serviceStartDate || now
      const tempPassword = generatePassword(10)
      const passwordHash = await bcrypt.hash(tempPassword, SALT_ROUNDS)

      if (existingIds.has(id)) {
        // Keep existing password; update profile fields only. Do not touch welcomeEmailSentAt.
        await pool.query(
          `
          UPDATE "Customer" SET
            email = $2,
            "companyName" = $3,
            "tradeName" = $4,
            city = $5,
            state = $6,
            "lsuName" = $7,
            "lsuTechnicianName" = $8,
            "operationsIncharge" = $9,
            "primaryPocName" = $10,
            "primaryPocEmail" = $11,
            "primaryPocNumber" = $12,
            "primaryPocDesignation" = $13,
            "collectionPocs" = $14,
            "serviceStartDate" = $15,
            "noOfKiosk" = $16,
            "disposalUnitInstalled" = $16,
            "collectionFrequency" = $17,
            "contactPerson" = COALESCE($10, "contactPerson"),
            phone = COALESCE($12, phone),
            address = COALESCE($18, address),
            "updatedAt" = $19
          WHERE id = $1
          `,
          [
            id,
            loginEmail,
            brandName,
            tradeName,
            city,
            state,
            lsuName,
            lsuTechnicianName,
            operationsIncharge,
            primaryPocName,
            primaryPocEmail,
            primaryPocNumber,
            primaryPocDesignation,
            collectionPocsJson,
            serviceStartDate,
            noOfKiosk,
            collectionFrequency,
            address,
            now,
          ],
        )
        summary.updated++
      } else {
        await pool.query(
          `
          INSERT INTO "Customer" (
            id, email, password, "companyName", "tradeName", city, state,
            "lsuName", "lsuTechnicianName", "operationsIncharge",
            "primaryPocName", "primaryPocEmail", "primaryPocNumber", "primaryPocDesignation",
            "collectionPocs", "serviceStartDate",
            "noOfKiosk", "noOfBasicKiosk", "noOfAdvanceKiosk", "noOfPanVendorKiosk", "noOfWallMountKiosk",
            "collectionFrequency", "kraftrebornCredits",
            "contactPerson", phone, address, status, "serviceStatus", "disposalUnitInstalled",
            "joinDate", "isGroup", "parentCustomerId",
            "welcomeEmailSentAt",
            "createdAt", "updatedAt"
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10,
            $11, $12, $13, $14,
            $15, $16,
            $17, 0, 0, 0, 0,
            $18, 0,
            $11, $13, $19, 'Active', 'ACTIVE', $17,
            $20, false, NULL,
            NULL,
            $21, $21
          )
          `,
          [
            id,
            loginEmail,
            passwordHash,
            brandName,
            tradeName,
            city,
            state,
            lsuName,
            lsuTechnicianName,
            operationsIncharge,
            primaryPocName,
            primaryPocEmail,
            primaryPocNumber,
            primaryPocDesignation,
            collectionPocsJson,
            serviceStartDate,
            noOfKiosk,
            collectionFrequency,
            address,
            joinDate,
            now,
          ],
        )
        existingIds.add(id)
        summary.inserted++
      }
    } catch (err) {
      summary.failed++
      summary.errors.push({ id, error: err.message })
      console.error(`FAIL ${id}:`, err.message)
    }

    if ((summary.inserted + summary.updated) % 50 === 0) {
      process.stdout.write(
        `\r  inserted=${summary.inserted} updated=${summary.updated} failed=${summary.failed}`,
      )
    }
  }

  const count = await pool.query(`SELECT count(*)::int AS n FROM "Customer"`)
  await pool.end()

  const reportPath = path.join(
    process.cwd(),
    "outputs/customer_import_review/import_result.json",
  )
  fs.writeFileSync(
    reportPath,
    JSON.stringify({ ...summary, dbCustomerCount: count.rows[0].n, at: new Date().toISOString() }, null, 2),
  )

  console.log("\nDone.")
  console.log(JSON.stringify({ ...summary, errors: summary.errors.slice(0, 10), dbCustomerCount: count.rows[0].n, reportPath }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
