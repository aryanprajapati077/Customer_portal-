import { sql } from "@/lib/db"
import { getIndianFiscalYear } from "@/lib/kraftreborn"

function serviceCertificateId(customerId: string): string {
  return `cert_services_${customerId}`
}

function certificateNumber(customerId: string): string {
  const num = customerId.replace(/\D/g, "")
  return String(200 + (parseInt(num.slice(-3) || "1", 10) % 800))
}

export async function syncServiceCertificate(customerId: string) {
  const [customerRows, collectionRows] = await Promise.all([
    sql`
      SELECT id, "companyName", address, "joinDate", "totalWasteCollected"
      FROM "Customer"
      WHERE id = ${customerId}
      LIMIT 1
    `,
    sql`
      SELECT COALESCE(SUM(weight), 0)::float AS total
      FROM "Collection"
      WHERE "customerId" = ${customerId}
    `,
  ])

  const customer = customerRows[0] as Record<string, unknown> | undefined
  if (!customer) return { created: false as const }

  const totalFromCollections = Number((collectionRows[0] as { total?: number })?.total) || 0
  const totalWaste =
    totalFromCollections > 0 ? totalFromCollections : Number(customer.totalWasteCollected) || 0

  const id = serviceCertificateId(customerId)
  const existing = await sql`SELECT id FROM "Certificate" WHERE id = ${id} LIMIT 1`

  const companyName = String(customer.companyName)
  const address = customer.address ? String(customer.address) : "India"
  const fy = getIndianFiscalYear()
  const certNum = certificateNumber(customerId)
  const name = "Certificate of Clean Environmental Partnership"
  const description =
    totalWaste > 0
      ? `Clean Environmental Partnership recognition for BuffIndia cigarette waste management. Cumulative waste ${totalWaste.toFixed(2)} kg (${fy}) recovered and upcycled.`
      : `Clean Environmental Partnership recognition for BuffIndia cigarette waste management (${fy}).`
  const certNumber = `BUFF-CEP-${certNum}-${customerId}`

  if (existing.length > 0) {
    await sql`
      UPDATE "Certificate"
      SET name = ${name},
          description = ${description},
          type = ${"Services"},
          "issueDate" = CURRENT_TIMESTAMP,
          "certificateNumber" = ${certNumber},
          "validUntil" = ${"Lifetime"},
          "issuedBy" = ${"Buffindia Receptacles Pvt Ltd"}
      WHERE id = ${id}
    `
    return { created: false as const, updated: true as const, id, totalWaste, companyName, address, fy, certNumber }
  }

  await sql`
    INSERT INTO "Certificate" (
      id, "customerId", name, "issueDate", type, description,
      "certificateNumber", "validUntil", "issuedBy"
    ) VALUES (
      ${id},
      ${customerId},
      ${name},
      CURRENT_TIMESTAMP,
      ${"Services"},
      ${description},
      ${certNumber},
      ${"Lifetime"},
      ${"Buffindia Receptacles Pvt Ltd"}
    )
  `

  return { created: true as const, id, totalWaste, companyName, address, fy, certNumber }
}

export async function syncKraftRebornCertificate(
  customerId: string,
  options: {
    orderId: string
    contactName: string
    butts: number
    soilSqFt: number
    waterLitres: number
    productCount: number
  },
) {
  const id = `cert_kr_${options.orderId.replace(/[^a-zA-Z0-9]/g, "_")}`
  const name = "Kraft Reborn Certificate of Impact"
  const description = `${options.butts} cigarette butts rescued · ${options.soilSqFt} sq ft soil · ${options.waterLitres}L water protected`

  const existing = await sql`SELECT id FROM "Certificate" WHERE id = ${id} LIMIT 1`
  if (existing.length > 0) return { id, created: false }

  await sql`
    INSERT INTO "Certificate" (
      id, "customerId", name, "issueDate", type, description,
      "certificateNumber", "validUntil", "issuedBy"
    ) VALUES (
      ${id},
      ${customerId},
      ${name},
      CURRENT_TIMESTAMP,
      ${"KraftReborn"},
      ${description},
      ${options.orderId},
      ${"Lifetime"},
      ${"Kraft Reborn Studio"}
    )
  `

  return { id, created: true }
}
