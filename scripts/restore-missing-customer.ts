/**
 * Restore a customer skipped during bulk import (e.g. BI431) from Collection Master xlsx,
 * then import their Historic Data.xlsx month rows.
 *
 * Usage: npx tsx scripts/restore-missing-customer.ts BI431
 */
import "dotenv/config"
import crypto from "crypto"
import path from "path"
import ExcelJS from "exceljs"
import { sql } from "../lib/db"
import { hashPassword } from "../lib/password"
import { generatePortalPassword } from "../lib/welcome-email"

const MASTER_FILE = path.join(
  process.env.HOME || "",
  "Downloads/Collection Master and Month On Month Collection.xlsx",
)
const HISTORIC_FILE = path.join(process.env.HOME || "", "Downloads/Historic Data.xlsx")

function cellValue(raw: unknown): string | number | null {
  if (raw == null) return null
  if (typeof raw === "object" && raw !== null && "result" in raw) {
    const result = (raw as { result?: unknown }).result
    return result == null ? null : (result as string | number)
  }
  return raw as string | number
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
  const month = monthIndex + 1
  return {
    date: new Date(Date.UTC(year, monthIndex, 1, 12, 0, 0)),
    key: `${year}-${String(month).padStart(2, "0")}`,
  }
}

function metricsFromWaste(totalWasteKg: number) {
  const cigaretteButts = Math.round(totalWasteKg * 3000)
  const microplasticsKg = +(totalWasteKg * 0.8).toFixed(2)
  const waterProtectedL = Math.round(cigaretteButts * 100)
  const treesEquivalent = Math.max(0, Math.round(totalWasteKg * 8.14))
  const co2AvoidedKg = Math.round(totalWasteKg * 178)
  return { cigaretteButts, microplasticsKg, waterProtectedL, treesEquivalent, co2AvoidedKg }
}

async function readMasterRow(customerId: string) {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(MASTER_FILE)
  const ws = wb.getWorksheet("Master")
  if (!ws) throw new Error("Master sheet not found")

  const headers: string[] = []
  ws.getRow(1).eachCell((cell, i) => {
    headers[i] = String(cell.value || "")
  })

  for (let n = 2; n <= ws.rowCount; n++) {
    const row = ws.getRow(n)
    const id = String(cellValue(row.getCell(1).value) || "")
      .trim()
      .toUpperCase()
    if (id !== customerId) continue

    const get = (label: string) => {
      const idx = headers.findIndex((h) => h === label)
      if (idx < 0) return null
      return cellValue(row.getCell(idx).value)
    }

    const serviceStartRaw = get("Service Start Date")
    const serviceStart = serviceStartRaw ? new Date(String(serviceStartRaw)) : null
    if (!serviceStart || Number.isNaN(serviceStart.getTime())) {
      throw new Error(`Invalid service start for ${customerId}`)
    }
    const contractEnd = new Date(serviceStart)
    contractEnd.setUTCFullYear(contractEnd.getUTCFullYear() + 1)

    const brandName = String(get("Customer Brand Name") || "").trim()
    if (!brandName) throw new Error(`Missing brand name for ${customerId}`)

    const noOfKiosk = Math.max(0, Math.floor(Number(get("No Of Kiosks")) || 0))
    const email = `${customerId.toLowerCase()}@import.buffindia.local`
    const city = String(get("City") || "").trim()
    const state = String(get("State") || "").trim()

    return {
      id: customerId,
      email,
      brandName,
      tradeName: String(get("Customer Trade Name") || "").trim() || null,
      city,
      state,
      lsuName: String(get("LSU Name") || "").trim() || null,
      lsuTechnicianName: String(get("LSU Technician Name") || "").trim() || null,
      operationsIncharge: String(get("Operations Incharge") || "").trim() || null,
      primaryPocName: String(get("Primary POC Name") || brandName).trim(),
      primaryPocEmail: String(get("Primary POC Email") || email).trim().toLowerCase(),
      primaryPocNumber: String(get("Primary POC Mobile") || "9999999999").trim(),
      primaryPocDesignation: String(get("Primary POC Designation") || "").trim() || null,
      collectionFrequency: String(get("Collection Frequency") || "Monthly").trim(),
      serviceStartDate: serviceStart,
      contractEndDate: contractEnd,
      noOfKiosk,
      noOfBasicKiosk: Math.max(0, Math.floor(Number(get("No Of Basic Kiosks")) || 0)),
      noOfAdvanceKiosk: Math.max(0, Math.floor(Number(get("No of Advance Kiosks")) || 0)),
      noOfPanVendorKiosk: Math.max(0, Math.floor(Number(get("No of Pan Vendor Kiosks")) || 0)),
      noOfWallMountKiosk: Math.max(0, Math.floor(Number(get("No of Wall Mount Kiosks")) || 0)),
      address: [city, state].filter(Boolean).join(", "),
    }
  }

  throw new Error(`${customerId} not found in Master sheet`)
}

async function importHistoricCollections(customerId: string) {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(HISTORIC_FILE)
  const ws = wb.getWorksheet("Historic Data") || wb.worksheets[0]

  const rows: { period: string; date: Date; weight: number }[] = []
  ws.eachRow({ includeEmpty: false }, (row, n) => {
    if (n === 1) return
    const id = String(row.getCell(1).value || "")
      .trim()
      .toUpperCase()
    if (id !== customerId) return
    const parsed = parseHistoricMonth(row.getCell(2).value)
    if (!parsed) return
    const weight = Number(row.getCell(3).value)
    rows.push({
      period: parsed.key,
      date: parsed.date,
      weight: Number.isFinite(weight) ? +weight.toFixed(6) : 0,
    })
  })

  await sql`
    DELETE FROM "Collection"
    WHERE "customerId" = ${customerId}
      AND (notes = 'Historic Data.xlsx' OR location = 'Historic import')
  `

  for (const r of rows) {
    const colId = `col_hist_${customerId}_${r.period.replace("-", "")}_${crypto.randomBytes(3).toString("hex")}`
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

  const agg = await sql<{ total: number }>`
    SELECT COALESCE(SUM(weight), 0)::float AS total
    FROM "Collection"
    WHERE "customerId" = ${customerId}
  `
  const totalWasteKg = Number(agg[0]?.total) || 0
  const m = metricsFromWaste(totalWasteKg)
  await sql`
    UPDATE "Customer"
    SET "totalWasteCollected" = ${totalWasteKg},
        "cigaretteButtsCollected" = ${m.cigaretteButts},
        "microplasticsUpcycled" = ${m.microplasticsKg},
        "waterResourcesProtected" = ${m.waterProtectedL},
        "treesEquivalent" = ${m.treesEquivalent},
        "co2Saved" = ${m.co2AvoidedKg},
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE id = ${customerId}
  `

  return { collectionRows: rows.length, totalWasteKg }
}

async function main() {
  const customerId = (process.argv[2] || "BI431").trim().toUpperCase()
  if (!/^BI\d+$/.test(customerId)) {
    throw new Error("Customer ID must look like BI431")
  }

  const existing = await sql<{ id: string }>`
    SELECT id FROM "Customer" WHERE id = ${customerId} LIMIT 1
  `
  if (existing[0]) {
    console.log(`${customerId} already exists — importing historic collections only`)
  } else {
    const master = await readMasterRow(customerId)
    const passwordHash = await hashPassword(generatePortalPassword(10))
    const now = new Date().toISOString()

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
        "createdAt", "updatedAt"
      ) VALUES (
        ${master.id},
        ${master.email},
        ${passwordHash},
        ${master.brandName},
        ${master.tradeName},
        ${master.city},
        ${master.state},
        ${master.lsuName},
        ${master.lsuTechnicianName},
        ${master.operationsIncharge},
        ${master.primaryPocName},
        ${master.primaryPocEmail},
        ${master.primaryPocNumber},
        ${master.primaryPocDesignation},
        ${"[]"},
        ${master.serviceStartDate.toISOString()},
        ${master.contractEndDate.toISOString()},
        ${master.noOfKiosk},
        ${master.noOfBasicKiosk},
        ${master.noOfAdvanceKiosk},
        ${master.noOfPanVendorKiosk},
        ${master.noOfWallMountKiosk},
        ${master.collectionFrequency},
        ${0},
        ${master.primaryPocName},
        ${master.primaryPocNumber},
        ${master.address},
        ${"Active"},
        ${"ACTIVE"},
        ${master.noOfKiosk},
        ${master.serviceStartDate.toISOString()},
        ${false},
        ${null},
        ${now},
        ${now}
      )
    `
    console.log(`Created ${customerId}: ${master.brandName}`)
  }

  const historic = await importHistoricCollections(customerId)
  const row = await sql`
    SELECT id, "companyName", "totalWasteCollected", "contractEndDate", "serviceStartDate"
    FROM "Customer" WHERE id = ${customerId}
  `
  console.log("Historic import:", historic)
  console.log("Customer:", row[0])
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
