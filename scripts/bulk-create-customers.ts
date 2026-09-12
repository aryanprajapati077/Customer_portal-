/**
 * Bulk-create customer accounts with specific IDs.
 * Usage: npx tsx scripts/bulk-create-customers.ts
 */
import "dotenv/config"
import { sql } from "../lib/db"
import { hashPassword } from "../lib/password"
import { generatePortalPassword } from "../lib/welcome-email"
import { defaultContractRenewalDate } from "../lib/admin-permissions"

type NewCustomer = {
  id: string
  companyName: string
  city: string
  state: string
  lsuName: string
  lsuTechnicianName: string
  tradeName?: string
  noOfKiosk?: number
  serviceStartDate?: string
}

const CUSTOMERS: NewCustomer[] = [
  {
    id: "BI501",
    companyName: "Indiqube Serenity",
    city: "Bengaluru",
    state: "Karnataka",
    lsuName: "Bengaluru",
    lsuTechnicianName: "Ravikumar",
    noOfKiosk: 2,
    serviceStartDate: "2026-08-01",
  },
  {
    id: "BI515",
    companyName: "Indiqube Echo",
    city: "Bengaluru",
    state: "Karnataka",
    lsuName: "Bengaluru",
    lsuTechnicianName: "Ravikumar",
  },
  {
    id: "BI516",
    companyName: "Indiqube Ashford",
    city: "Bengaluru",
    state: "Karnataka",
    lsuName: "Bengaluru",
    lsuTechnicianName: "Ravikumar",
  },
  {
    id: "BI517",
    companyName: "The Park Hyderabad",
    city: "Hyderabad",
    state: "Telangana",
    lsuName: "Hyderabad",
    lsuTechnicianName: "Mohd Jeelani Khan",
  },
  {
    id: "BI518",
    companyName: "Indiqube Platina",
    city: "Bengaluru",
    state: "Karnataka",
    lsuName: "Bengaluru",
    lsuTechnicianName: "Ravikumar",
  },
  {
    id: "BI519",
    companyName: "Vivanta Ektanagar",
    city: "Bengaluru",
    state: "Karnataka",
    lsuName: "Bengaluru",
    lsuTechnicianName: "Ravikumar",
  },
  {
    id: "BI520",
    companyName: "Indiqube Ocean",
    city: "Chennai",
    state: "Tamil Nadu",
    lsuName: "Chennai",
    lsuTechnicianName: "Senthil Kumar",
  },
  {
    id: "BI521",
    companyName: "Taj Lands End Mumbai",
    city: "Mumbai",
    state: "Maharashtra",
    lsuName: "Mumbai",
    lsuTechnicianName: "Imtiyaz Ahmed Shaikh",
  },
  {
    id: "BI522",
    companyName: "Bigg Boss Hindi Season 20",
    city: "Mumbai",
    state: "Maharashtra",
    lsuName: "Mumbai",
    lsuTechnicianName: "Imtiyaz Ahmed Shaikh",
  },
  {
    id: "BI523",
    companyName: "Big Boss Bangla Season 3",
    city: "Kolkata",
    state: "West Bengal",
    lsuName: "Kolkata",
    lsuTechnicianName: "Amresh Mishra",
  },
  {
    id: "BI524",
    companyName: "Indiqube Miniforest",
    city: "Bengaluru",
    state: "Karnataka",
    lsuName: "Bengaluru",
    lsuTechnicianName: "Ravikumar",
  },
  {
    id: "BI525",
    companyName: "Taj Palace Lucknow",
    city: "Lucknow",
    state: "Uttar Pradesh",
    lsuName: "Lucknow",
    lsuTechnicianName: "Manoj Kumar Verma",
  },
  {
    id: "BI526",
    companyName: "The Leela Gandhinagar",
    city: "Gandhinagar",
    state: "Gujarat",
    lsuName: "Ahmedabad",
    lsuTechnicianName: "Shubham Kurli",
  },
]

async function createCustomer(row: NewCustomer) {
  const existing = await sql<{ id: string }>`
    SELECT id FROM "Customer" WHERE id = ${row.id} LIMIT 1
  `
  if (existing[0]) {
    console.log(`Skip ${row.id} — already exists`)
    return { id: row.id, status: "skipped" as const }
  }

  const email = `${row.id.toLowerCase()}@import.buffindia.local`
  const serviceStartDate = new Date(row.serviceStartDate || "2026-09-01")
  const contractEndDate = new Date(defaultContractRenewalDate(serviceStartDate))
  const passwordHash = await hashPassword(generatePortalPassword(10))
  const now = new Date().toISOString()
  const address = [row.city, row.state].filter(Boolean).join(", ")
  const tradeName = row.tradeName || row.companyName
  const noOfKiosk = row.noOfKiosk ?? 1
  const collectionPocs = JSON.stringify([
    {
      name: row.companyName,
      email,
      number: "9999999999",
      designation: "Collection POC",
      emailEnabled: true,
      status: "Active",
    },
  ])

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
      ${row.id},
      ${email},
      ${passwordHash},
      ${row.companyName},
      ${tradeName},
      ${row.city},
      ${row.state},
      ${row.lsuName},
      ${row.lsuTechnicianName},
      ${"Yash"},
      ${row.companyName},
      ${email},
      ${"9999999999"},
      ${null},
      ${collectionPocs},
      ${serviceStartDate.toISOString()},
      ${contractEndDate.toISOString()},
      ${noOfKiosk},
      ${0},
      ${0},
      ${0},
      ${0},
      ${"Monthly"},
      ${0},
      ${row.companyName},
      ${"9999999999"},
      ${address},
      ${"Active"},
      ${"ACTIVE"},
      ${noOfKiosk},
      ${serviceStartDate.toISOString()},
      ${false},
      ${null},
      ${now},
      ${now}
    )
  `

  console.log(`Created ${row.id}: ${row.companyName}`)
  return { id: row.id, status: "created" as const, companyName: row.companyName }
}

async function main() {
  const results = []
  for (const row of CUSTOMERS) {
    results.push(await createCustomer(row))
  }
  console.log("\nSummary:", results)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
