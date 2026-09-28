/**
 * Import BI526–BI532 from Client Master PDF extract.
 * BI532 (DEMO) gets a copy of BI001 collection rows (no BI001 references).
 *
 * Usage: npx tsx scripts/import-bi526-bi532.ts
 */
import "dotenv/config"
import { randomBytes } from "crypto"
import { sql } from "../lib/db"
import { hashPassword } from "../lib/password"
import { generatePortalPassword } from "../lib/welcome-email"
import { deriveServiceStatusFromContractEnd } from "../lib/service-status"

type Row = {
  id: string
  companyName: string
  tradeName: string
  city: string
  state: string
  lsuName: string
  lsuTechnicianName: string
  operationsIncharge: string
  primaryPocNumber: string
  serviceStartDate: string // YYYY-MM-DD
  noOfKiosk: number
  noOfBasicKiosk: number
  noOfAdvanceKiosk: number
  collectionFrequency: string
  totalWasteCollected?: number
  cigaretteButtsCollected?: number
  microplasticsUpcycled?: number
  waterResourcesProtected?: number
  isDemo?: boolean
}

function newId(prefix: string) {
  return `${prefix}${Date.now().toString(36)}${randomBytes(4).toString("hex")}`.slice(0, 28)
}

function parseDdMmYyyy(raw: string) {
  const [dd, mm, yyyy] = raw.split("/").map((x) => Number(x))
  return new Date(Date.UTC(yyyy, mm - 1, dd))
}

const ROWS: Row[] = [
  {
    id: "BI526",
    companyName: "Taj Guras Kutir Resort & Spa, Gangtok",
    tradeName: "Classical Paradise Hotels & Resort Ltd",
    city: "Gangtok",
    state: "Sikkim",
    lsuName: "Gangtok",
    lsuTechnicianName: "Unassigned",
    operationsIncharge: "Yash",
    primaryPocNumber: "",
    serviceStartDate: "2026-09-26",
    noOfKiosk: 5,
    noOfBasicKiosk: 5,
    noOfAdvanceKiosk: 0,
    collectionFrequency: "Monthly",
  },
  {
    id: "BI527",
    companyName: "Indiqube Olive",
    tradeName: "Indiqube Spaces Limited",
    city: "Chennai",
    state: "Tamil Nadu",
    lsuName: "Chennai",
    lsuTechnicianName: "Senthil Kumar",
    operationsIncharge: "Yash",
    primaryPocNumber: "9790954740",
    serviceStartDate: "2026-10-02",
    noOfKiosk: 2,
    noOfBasicKiosk: 0,
    noOfAdvanceKiosk: 2,
    collectionFrequency: "Monthly",
  },
  {
    id: "BI528",
    companyName: "Indiqube Viceroy",
    tradeName: "Indiqube Spaces Limited",
    city: "Chennai",
    state: "Tamil Nadu",
    lsuName: "Chennai",
    lsuTechnicianName: "Senthil Kumar",
    operationsIncharge: "Yash",
    primaryPocNumber: "9790954740",
    serviceStartDate: "2026-10-02",
    noOfKiosk: 1,
    noOfBasicKiosk: 0,
    noOfAdvanceKiosk: 1,
    collectionFrequency: "Monthly",
  },
  {
    id: "BI529",
    companyName: "Divyasree Tower",
    tradeName: "Denali Management Services Pvt Ltd",
    city: "Bengaluru",
    state: "Karnataka",
    lsuName: "Bengaluru",
    lsuTechnicianName: "Ravikumar",
    operationsIncharge: "Yash",
    primaryPocNumber: "9353932696",
    serviceStartDate: "2026-04-01",
    noOfKiosk: 2,
    noOfBasicKiosk: 2,
    noOfAdvanceKiosk: 0,
    collectionFrequency: "Monthly",
    totalWasteCollected: 0.06,
    cigaretteButtsCollected: 180,
    microplasticsUpcycled: 0.048,
    waterResourcesProtected: 18000,
  },
  {
    id: "BI530",
    companyName: "Taj Devi Ratn Resort & Spa",
    tradeName: "Taj Devi Ratn Resort & Spa",
    city: "Jaipur",
    state: "Rajasthan",
    lsuName: "Jaipur",
    lsuTechnicianName: "Somendra Nagaji",
    operationsIncharge: "Yash",
    primaryPocNumber: "8290844071",
    serviceStartDate: "2026-08-19",
    noOfKiosk: 2,
    noOfBasicKiosk: 2,
    noOfAdvanceKiosk: 0,
    collectionFrequency: "Monthly",
  },
  {
    id: "BI531",
    companyName: "Vivanta Jamshedpur",
    tradeName: "Vijaya Motels Pvt Ltd",
    city: "Jamshedpur",
    state: "Jharkhand",
    lsuName: "Ranchi",
    lsuTechnicianName: "Kalyan Beck",
    operationsIncharge: "Yash",
    primaryPocNumber: "",
    serviceStartDate: "2026-09-05",
    noOfKiosk: 2,
    noOfBasicKiosk: 2,
    noOfAdvanceKiosk: 0,
    collectionFrequency: "Monthly",
  },
  {
    id: "BI532",
    companyName: "DEMO",
    tradeName: "DEMO",
    city: "Demo",
    state: "Demo",
    lsuName: "Bengaluru",
    lsuTechnicianName: "Ravikumar",
    operationsIncharge: "Yash",
    primaryPocNumber: "",
    serviceStartDate: "2026-01-01",
    noOfKiosk: 0,
    noOfBasicKiosk: 0,
    noOfAdvanceKiosk: 0,
    collectionFrequency: "Monthly",
    isDemo: true,
  },
]

async function ensureOpsManager(name: string) {
  await sql.query(`
    CREATE TABLE IF NOT EXISTS "OperationsManager" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      active BOOLEAN NOT NULL DEFAULT true,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  const existing = await sql`
    SELECT id FROM "OperationsManager" WHERE LOWER(name) = ${name.toLowerCase()} LIMIT 1
  `
  if (existing[0]) return
  const id = newId("om")
  const now = new Date().toISOString()
  await sql`
    INSERT INTO "OperationsManager" (id, name, active, "sortOrder", "createdAt", "updatedAt")
    VALUES (${id}, ${name}, true, 0, ${now}, ${now})
  `
}

async function copyDemoCollections(demoId: string) {
  const source = await sql`
    SELECT date, weight, location, status, "co2Saved", "collectorName", "vehicleNumber", notes
    FROM "Collection"
    WHERE "customerId" = ${"BI001"}
    ORDER BY date ASC
  `

  await sql`DELETE FROM "Collection" WHERE "customerId" = ${demoId}`

  let copied = 0
  for (const row of source as {
    date: Date
    weight: number
    location: string | null
    status: string
    co2Saved: number | null
    collectorName: string | null
    vehicleNumber: string | null
    notes: string | null
  }[]) {
    const notesRaw = String(row.notes || "")
    // Never carry source-customer references into the demo account.
    const notes =
      /BI001|Adani/i.test(notesRaw) || !notesRaw.trim() ? null : notesRaw.replace(/BI001/gi, "").trim() || null
    const location =
      row.location && /BI001|Adani/i.test(row.location) ? "Demo site" : row.location || "Demo site"

    const id = newId("col_demo_")
    await sql`
      INSERT INTO "Collection" (
        id, "customerId", date, weight, location, status,
        "co2Saved", "collectorName", "vehicleNumber", notes
      ) VALUES (
        ${id},
        ${demoId},
        ${row.date},
        ${row.weight},
        ${location},
        ${row.status || "Completed"},
        ${row.co2Saved},
        ${row.collectorName},
        ${row.vehicleNumber},
        ${notes}
      )
    `
    copied++
  }

  const metrics = await sql`
    SELECT
      "totalWasteCollected",
      "cigaretteButtsCollected",
      "microplasticsUpcycled",
      "waterResourcesProtected",
      "co2Saved",
      "treesEquivalent",
      "kraftrebornCredits",
      "certificatesEarned"
    FROM "Customer"
    WHERE id = ${"BI001"}
    LIMIT 1
  `
  const m = metrics[0] as
    | {
        totalWasteCollected: number
        cigaretteButtsCollected: number
        microplasticsUpcycled: number
        waterResourcesProtected: number
        co2Saved: number
        treesEquivalent: number
        kraftrebornCredits: number
        certificatesEarned: number
      }
    | undefined

  if (m) {
    await sql`
      UPDATE "Customer"
      SET "totalWasteCollected" = ${m.totalWasteCollected},
          "cigaretteButtsCollected" = ${m.cigaretteButtsCollected},
          "microplasticsUpcycled" = ${m.microplasticsUpcycled},
          "waterResourcesProtected" = ${m.waterResourcesProtected},
          "co2Saved" = ${m.co2Saved},
          "treesEquivalent" = ${m.treesEquivalent},
          "kraftrebornCredits" = ${m.kraftrebornCredits},
          "certificatesEarned" = ${m.certificatesEarned},
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${demoId}
    `
  }

  return copied
}

async function upsertCustomer(row: Row) {
  const existing = await sql`SELECT id FROM "Customer" WHERE id = ${row.id} LIMIT 1`
  const serviceStart = new Date(`${row.serviceStartDate}T00:00:00.000Z`)
  const contractEnd = new Date(serviceStart)
  contractEnd.setUTCFullYear(contractEnd.getUTCFullYear() + 1)
  const serviceStatus = deriveServiceStatusFromContractEnd(contractEnd)
  const email = `${row.id.toLowerCase()}@import.buffindia.local`
  const phone = row.primaryPocNumber || null
  const address = [row.city, row.state].filter(Boolean).join(", ")
  const now = new Date().toISOString()
  const pocName = row.isDemo ? "Demo User" : "Primary POC"

  if (existing[0]) {
    await sql`
      UPDATE "Customer"
      SET "companyName" = ${row.companyName},
          "tradeName" = ${row.tradeName},
          city = ${row.city},
          state = ${row.state},
          "lsuName" = ${row.lsuName},
          "lsuTechnicianName" = ${row.lsuTechnicianName},
          "operationsIncharge" = ${row.operationsIncharge},
          "primaryPocName" = ${pocName},
          "primaryPocNumber" = ${phone},
          "serviceStartDate" = ${serviceStart.toISOString()},
          "contractEndDate" = ${contractEnd.toISOString()},
          "serviceStatus" = ${serviceStatus},
          "noOfKiosk" = ${row.noOfKiosk},
          "noOfBasicKiosk" = ${row.noOfBasicKiosk},
          "noOfAdvanceKiosk" = ${row.noOfAdvanceKiosk},
          "disposalUnitInstalled" = ${row.noOfKiosk},
          "collectionFrequency" = ${row.collectionFrequency},
          "totalWasteCollected" = ${row.totalWasteCollected ?? 0},
          "cigaretteButtsCollected" = ${row.cigaretteButtsCollected ?? 0},
          "microplasticsUpcycled" = ${row.microplasticsUpcycled ?? 0},
          "waterResourcesProtected" = ${row.waterResourcesProtected ?? 0},
          phone = ${phone},
          address = ${address},
          status = ${"Active"},
          "updatedAt" = ${now}
      WHERE id = ${row.id}
    `
    console.log(`Updated ${row.id} — ${row.companyName}`)
    return { created: false }
  }

  const passwordHash = await hashPassword(generatePortalPassword(10))
  await sql`
    INSERT INTO "Customer" (
      id, email, password, "companyName", "tradeName", city, state,
      "lsuName", "lsuTechnicianName", "operationsIncharge",
      "primaryPocName", "primaryPocEmail", "primaryPocNumber",
      "primaryPocEmailEnabled", "primaryPocStatus",
      "serviceStartDate", "contractEndDate", "serviceStatus",
      "noOfKiosk", "noOfBasicKiosk", "noOfAdvanceKiosk",
      "noOfPanVendorKiosk", "noOfWallMountKiosk",
      "collectionFrequency", "kraftrebornCredits",
      "contactPerson", phone, address, status, "disposalUnitInstalled",
      "totalWasteCollected", "cigaretteButtsCollected",
      "microplasticsUpcycled", "waterResourcesProtected",
      "joinDate", "isGroup", "createdAt", "updatedAt"
    ) VALUES (
      ${row.id},
      ${email},
      ${passwordHash},
      ${row.companyName},
      ${row.tradeName},
      ${row.city},
      ${row.state},
      ${row.lsuName},
      ${row.lsuTechnicianName},
      ${row.operationsIncharge},
      ${pocName},
      ${email},
      ${phone},
      ${true},
      ${"Active"},
      ${serviceStart.toISOString()},
      ${contractEnd.toISOString()},
      ${serviceStatus},
      ${row.noOfKiosk},
      ${row.noOfBasicKiosk},
      ${row.noOfAdvanceKiosk},
      ${0},
      ${0},
      ${row.collectionFrequency},
      ${0},
      ${pocName},
      ${phone},
      ${address},
      ${"Active"},
      ${row.noOfKiosk},
      ${row.totalWasteCollected ?? 0},
      ${row.cigaretteButtsCollected ?? 0},
      ${row.microplasticsUpcycled ?? 0},
      ${row.waterResourcesProtected ?? 0},
      ${serviceStart.toISOString()},
      ${false},
      ${now},
      ${now}
    )
  `
  console.log(`Created ${row.id} — ${row.companyName} <${email}>`)
  return { created: true }
}

async function main() {
  await ensureOpsManager("Yash")

  for (const row of ROWS) {
    await upsertCustomer(row)
    if (row.isDemo) {
      const n = await copyDemoCollections(row.id)
      console.log(`  Demo collections copied: ${n} (source metrics only, no source ID stored)`)
    }
  }

  const check = await sql`
    SELECT id, "companyName", "serviceStatus", "contractEndDate"::date AS renewal
    FROM "Customer"
    WHERE id = ANY(${ROWS.map((r) => r.id)})
    ORDER BY id
  `
  console.log("\nResult:")
  for (const r of check) console.log(`  ${r.id}  ${r.companyName}  ${r.serviceStatus}  renewal=${r.renewal}`)

  const demoCols = await sql`
    SELECT COUNT(*)::int AS n, COALESCE(SUM(weight),0)::float AS kg
    FROM "Collection" WHERE "customerId" = ${"BI532"}
  `
  console.log("BI532 collections:", demoCols[0])
  console.log("Done.")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
