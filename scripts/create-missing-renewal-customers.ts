/**
 * Create BI154, BI155, BI200, BI421 from Renewal System + Collection Master.
 * Usage: npx tsx scripts/create-missing-renewal-customers.ts
 */
import "dotenv/config"
import crypto from "crypto"
import path from "path"
import ExcelJS from "exceljs"
import { sql } from "../lib/db"
import { hashPassword } from "../lib/password"

const RENEWAL_FILE = path.join(process.env.HOME || "", "Downloads/Buffindia Renewal System.xlsx")
const MASTER_FILE = path.join(
  process.env.HOME || "",
  "Downloads/Collection Master and Month On Month Collection.xlsx",
)
const HISTORIC_FILE = path.join(process.env.HOME || "", "Downloads/Historic Data.xlsx")
const IDS = ["BI154", "BI155", "BI200", "BI421"] as const

function generatePortalPassword(length = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
  let out = ""
  for (let i = 0; i < length; i++) out += chars[crypto.randomInt(0, chars.length)]
  return out
}

function raw(v: unknown): unknown {
  if (v == null) return null
  if (v instanceof Date) return v
  if (typeof v === "object" && v !== null) {
    const o = v as { result?: unknown; text?: string }
    if (o.result !== undefined) return o.result
    if (o.text != null) return o.text
    return null
  }
  return v
}

function asStr(v: unknown): string {
  if (v == null) return ""
  return String(v).trim()
}

function asDateYmd(v: unknown): string | null {
  if (v == null || v === "") return null
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString().slice(0, 10)
  const s = String(v)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  const d = new Date(s)
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return null
}

function metricsFromWaste(totalWasteKg: number) {
  const cigaretteButts = Math.round(totalWasteKg * 3000)
  const microplasticsKg = +(totalWasteKg * 0.8).toFixed(2)
  const waterProtectedL = Math.round(cigaretteButts * 100)
  const treesEquivalent = Math.max(0, Math.round(totalWasteKg * 8.14))
  const co2AvoidedKg = Math.round(totalWasteKg * 178)
  return { cigaretteButts, microplasticsKg, waterProtectedL, treesEquivalent, co2AvoidedKg }
}

function parseHistoricMonth(value: unknown) {
  if (!(value instanceof Date) && (value == null || value === "")) return null
  const d = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(d.getTime())) return null
  const day = d.getUTCDate()
  const monthIndex = d.getUTCMonth()
  if (day < 22 || day > 30) {
    return {
      date: new Date(Date.UTC(d.getUTCFullYear(), monthIndex, 1, 12, 0, 0)),
      key: `${d.getUTCFullYear()}-${String(monthIndex + 1).padStart(2, "0")}`,
    }
  }
  const year = 2000 + day
  return {
    date: new Date(Date.UTC(year, monthIndex, 1, 12, 0, 0)),
    key: `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
  }
}

async function readRenewalRows() {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(RENEWAL_FILE)
  const ws = wb.getWorksheet("Renewal_Master")
  if (!ws) throw new Error("Renewal_Master sheet missing")
  const map = new Map<string, Record<string, unknown>>()
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r)
    const id = asStr(raw(row.getCell(1).value)).toUpperCase()
    if (!IDS.includes(id as (typeof IDS)[number])) continue
    map.set(id, {
      id,
      brandName: asStr(raw(row.getCell(2).value)),
      tradeName: asStr(raw(row.getCell(3).value)) || null,
      city: asStr(raw(row.getCell(4).value)),
      state: asStr(raw(row.getCell(5).value)),
      lsuName: asStr(raw(row.getCell(7).value)),
      lsuTechnicianName: asStr(raw(row.getCell(8).value)),
      lsuTechNo: asStr(raw(row.getCell(9).value)) || "9999999999",
      operationsIncharge: asStr(raw(row.getCell(10).value)) || "Yash",
      serviceStart: asDateYmd(raw(row.getCell(23).value)),
      latestServiceStart: asDateYmd(raw(row.getCell(44).value)),
      renewal: asDateYmd(raw(row.getCell(47).value)),
      noOfKiosk: Math.max(0, Math.floor(Number(raw(row.getCell(24).value)) || 0)),
      collectionFrequency: asStr(raw(row.getCell(29).value)) || "Monthly",
      clientStatus: asStr(raw(row.getCell(43).value)) || "Active",
    })
  }
  return map
}

async function readMasterWaste() {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(MASTER_FILE)
  const ws = wb.getWorksheet("Master")
  if (!ws) throw new Error("Master sheet missing")
  const headers: string[] = []
  ws.getRow(1).eachCell((c, i) => {
    headers[i] = asStr(raw(c.value))
  })
  const wasteIdx = headers.findIndex((h) => /Waste collected/i.test(h))
  const tradeIdx = headers.findIndex((h) => /Trade Name/i.test(h))
  const waste = new Map<string, number>()
  const trade = new Map<string, string>()
  for (let r = 2; r <= ws.rowCount; r++) {
    const id = asStr(raw(ws.getRow(r).getCell(1).value)).toUpperCase()
    if (!IDS.includes(id as (typeof IDS)[number])) continue
    if (wasteIdx > 0) {
      const w = Number(raw(ws.getRow(r).getCell(wasteIdx).value))
      if (Number.isFinite(w)) waste.set(id, w)
    }
    if (tradeIdx > 0) {
      const tn = asStr(raw(ws.getRow(r).getCell(tradeIdx).value))
      if (tn) trade.set(id, tn)
    }
  }
  return { waste, trade }
}

async function importHistoric(customerId: string) {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(HISTORIC_FILE)
  const ws = wb.getWorksheet("Historic Data") || wb.worksheets[0]
  const rows: { period: string; date: Date; weight: number }[] = []
  ws.eachRow({ includeEmpty: false }, (row, n) => {
    if (n === 1) return
    const id = asStr(row.getCell(1).value).toUpperCase()
    if (id !== customerId) return
    const parsed = parseHistoricMonth(raw(row.getCell(2).value))
    if (!parsed) return
    const weight = Number(raw(row.getCell(3).value))
    rows.push({
      period: parsed.key,
      date: parsed.date,
      weight: Number.isFinite(weight) ? +weight.toFixed(6) : 0,
    })
  })

  for (const r of rows) {
    const colId = `col_hist_${customerId}_${r.period.replace("-", "")}_${crypto
      .randomBytes(3)
      .toString("hex")}`
    await sql`
      INSERT INTO "Collection" (id, "customerId", date, weight, location, status, notes)
      VALUES (
        ${colId},
        ${customerId},
        ${r.date.toISOString()},
        ${r.weight},
        ${"Historic import"},
        ${"Completed"},
        ${"Historic Data.xlsx"}
      )
    `
  }
  return rows.length
}

async function main() {
  const renewal = await readRenewalRows()
  const { waste, trade } = await readMasterWaste()
  const results: unknown[] = []

  for (const id of IDS) {
    const row = renewal.get(id)
    if (!row) {
      results.push({ id, status: "missing_in_excel" })
      continue
    }
    const exists = await sql`SELECT id FROM "Customer" WHERE id = ${id} LIMIT 1`
    if (exists[0]) {
      results.push({ id, status: "already_exists" })
      continue
    }

    const email = `${id.toLowerCase()}@import.buffindia.local`
    const brandName = String(row.brandName)
    const tradeName = (trade.get(id) || row.tradeName || brandName) as string
    const city = String(row.city)
    const state = String(row.state)
    const serviceYmd =
      (row.serviceStart as string | null) ||
      (row.latestServiceStart as string | null) ||
      "2024-01-01"
    const renewalYmd = row.renewal as string | null
    if (!renewalYmd) {
      results.push({ id, status: "no_renewal_date" })
      continue
    }

    const serviceStartIso = `${serviceYmd}T00:00:00.000Z`
    const contractEndIso = `${renewalYmd}T00:00:00.000Z`
    const passwordHash = await hashPassword(generatePortalPassword(10))
    const now = new Date().toISOString()
    const address = [city, state].filter(Boolean).join(", ")
    const phone = String(row.lsuTechNo || "9999999999")
    const noOfKiosk = Number(row.noOfKiosk) || 1
    const collectionPocs = JSON.stringify([
      {
        name: brandName,
        email,
        number: phone,
        designation: "Collection POC",
        emailEnabled: true,
        status: "Active",
      },
    ])
    const status = String(row.clientStatus || "Active")
    const serviceStatus = status.toLowerCase() === "active" ? "ACTIVE" : "INACTIVE"
    const totalWaste = Number(waste.get(id) || 0)
    const m = metricsFromWaste(totalWaste)

    await sql`
      INSERT INTO "Customer" (
        id, email, password, "companyName", "tradeName", city, state,
        "lsuName", "lsuTechnicianName", "operationsIncharge",
        "primaryPocName", "primaryPocEmail", "primaryPocNumber", "primaryPocDesignation",
        "collectionPocs", "serviceStartDate", "contractEndDate",
        "noOfKiosk", "noOfBasicKiosk", "noOfAdvanceKiosk", "noOfPanVendorKiosk", "noOfWallMountKiosk",
        "collectionFrequency", "kraftrebornCredits",
        "contactPerson", phone, address, status, "serviceStatus", "disposalUnitInstalled",
        "joinDate", "isGroup", "parentCustomerId",
        "totalWasteCollected", "cigaretteButtsCollected", "microplasticsUpcycled",
        "waterResourcesProtected", "treesEquivalent", "co2Saved",
        "createdAt", "updatedAt"
      ) VALUES (
        ${id},
        ${email},
        ${passwordHash},
        ${brandName},
        ${tradeName},
        ${city},
        ${state},
        ${String(row.lsuName || "")},
        ${String(row.lsuTechnicianName || "")},
        ${String(row.operationsIncharge || "Yash")},
        ${brandName},
        ${email},
        ${phone},
        ${null},
        ${collectionPocs},
        ${serviceStartIso},
        ${contractEndIso},
        ${noOfKiosk},
        ${0}, ${0}, ${0}, ${0},
        ${String(row.collectionFrequency || "Monthly")},
        ${0},
        ${brandName},
        ${phone},
        ${address},
        ${status},
        ${serviceStatus},
        ${1},
        ${serviceStartIso},
        ${false},
        ${null},
        ${totalWaste},
        ${m.cigaretteButts},
        ${m.microplasticsKg},
        ${m.waterProtectedL},
        ${m.treesEquivalent},
        ${m.co2AvoidedKg},
        ${now},
        ${now}
      )
    `

    let historicRows = 0
    try {
      historicRows = await importHistoric(id)
      if (historicRows > 0) {
        const agg = await sql<{ total: number }>`
          SELECT COALESCE(SUM(weight), 0)::float AS total
          FROM "Collection" WHERE "customerId" = ${id}
        `
        const totalWasteKg = Number(agg[0]?.total) || totalWaste
        const mm = metricsFromWaste(totalWasteKg)
        await sql`
          UPDATE "Customer"
          SET "totalWasteCollected" = ${totalWasteKg},
              "cigaretteButtsCollected" = ${mm.cigaretteButts},
              "microplasticsUpcycled" = ${mm.microplasticsKg},
              "waterResourcesProtected" = ${mm.waterProtectedL},
              "treesEquivalent" = ${mm.treesEquivalent},
              "co2Saved" = ${mm.co2AvoidedKg},
              "updatedAt" = CURRENT_TIMESTAMP
          WHERE id = ${id}
        `
      }
    } catch (e) {
      console.warn("historic import skipped", id, (e as Error).message)
    }

    const verify = await sql<{
      id: string
      companyName: string
      contract: string
      status: string
      totalWasteCollected: number
    }>`
      SELECT id, "companyName",
             to_char("contractEndDate" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS contract,
             status, "totalWasteCollected"::float AS "totalWasteCollected"
      FROM "Customer" WHERE id = ${id}
    `

    results.push({
      id,
      status: "created",
      email,
      renewal: renewalYmd,
      serviceStart: serviceYmd,
      historicRows,
      verify: verify[0],
    })
  }

  console.log(JSON.stringify({ created: results }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
