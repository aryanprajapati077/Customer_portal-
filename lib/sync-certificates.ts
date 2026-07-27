import { sql } from "@/lib/db"
import { getIndianFiscalYear } from "@/lib/kraftreborn"

function serviceCertificateId(customerId: string): string {
  return `cert_services_${customerId}`
}

function certificateNumber(customerId: string, year: number): string {
  const num = customerId.replace(/\D/g, "")
  const base = String(200 + (parseInt(num.slice(-3) || "1", 10) % 800))
  return `BUFF-CEP-${base}-${customerId}-${year}`
}

function addOneYear(from: Date): Date {
  const d = new Date(from)
  d.setFullYear(d.getFullYear() + 1)
  return d
}

function formatValidUntilLabel(d: Date): string {
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

function toValidUntilStorage(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function parseValidUntil(raw: unknown): Date | null {
  if (raw == null) return null
  const s = String(raw).trim()
  if (!s || /^lifetime$/i.test(s)) return null
  const t = Date.parse(s)
  if (Number.isNaN(t)) return null
  return new Date(t)
}

function isExpired(validUntil: Date | null, now = new Date()): boolean {
  if (!validUntil) return true
  // valid through end of validUntil day
  const end = new Date(validUntil)
  end.setHours(23, 59, 59, 999)
  return now.getTime() > end.getTime()
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
  const existingRows = await sql`
    SELECT id, "issueDate", "validUntil", "certificateNumber"
    FROM "Certificate"
    WHERE id = ${id}
    LIMIT 1
  `
  const existing = existingRows[0] as
    | {
        id: string
        issueDate?: Date | string | null
        validUntil?: string | null
        certificateNumber?: string | null
      }
    | undefined

  const companyName = String(customer.companyName)
  const address = customer.address ? String(customer.address) : "India"
  const fy = getIndianFiscalYear()
  const name = "Certificate of Clean Environmental Partnership"
  const description =
    totalWaste > 0
      ? `Clean Environmental Partnership recognition for BuffIndia cigarette waste management. Cumulative waste ${totalWaste.toFixed(2)} kg (${fy}) recovered and upcycled.`
      : `Clean Environmental Partnership recognition for BuffIndia cigarette waste management (${fy}).`

  const now = new Date()

  if (existing) {
    const prevValid = parseValidUntil(existing.validUntil)
    const expired = isExpired(prevValid, now)
    const prevIssue = existing.issueDate ? new Date(existing.issueDate) : now

    if (!expired && !Number.isNaN(prevIssue.getTime())) {
      // Still valid — refresh description/waste only; keep issue + validity window
      const until = prevValid || addOneYear(prevIssue)
      const validUntilLabel = formatValidUntilLabel(until)
      await sql`
        UPDATE "Certificate"
        SET name = ${name},
            description = ${description},
            type = ${"Services"},
            "issuedBy" = ${"Buffindia Receptacles Pvt Ltd"}
        WHERE id = ${id}
      `
      return {
        created: false as const,
        updated: true as const,
        renewed: false as const,
        id,
        totalWaste,
        companyName,
        address,
        fy,
        certNumber: String(existing.certificateNumber || ""),
        issueDate: prevIssue,
        validUntil: until,
        validUntilLabel,
      }
    }

    // Expired (or Lifetime / missing) — issue a new 1-year certificate
    const issueDate = now
    const validUntil = addOneYear(issueDate)
    const certNumber = certificateNumber(customerId, issueDate.getFullYear())
    const validUntilLabel = formatValidUntilLabel(validUntil)

    await sql`
      UPDATE "Certificate"
      SET name = ${name},
          description = ${description},
          type = ${"Services"},
          "issueDate" = ${issueDate},
          "certificateNumber" = ${certNumber},
          "validUntil" = ${toValidUntilStorage(validUntil)},
          "issuedBy" = ${"Buffindia Receptacles Pvt Ltd"}
      WHERE id = ${id}
    `
    return {
      created: false as const,
      updated: true as const,
      renewed: true as const,
      id,
      totalWaste,
      companyName,
      address,
      fy,
      certNumber,
      issueDate,
      validUntil,
      validUntilLabel,
    }
  }

  const issueDate = now
  const validUntil = addOneYear(issueDate)
  const certNumber = certificateNumber(customerId, issueDate.getFullYear())
  const validUntilLabel = formatValidUntilLabel(validUntil)

  await sql`
    INSERT INTO "Certificate" (
      id, "customerId", name, "issueDate", type, description,
      "certificateNumber", "validUntil", "issuedBy"
    ) VALUES (
      ${id},
      ${customerId},
      ${name},
      ${issueDate},
      ${"Services"},
      ${description},
      ${certNumber},
      ${toValidUntilStorage(validUntil)},
      ${"Buffindia Receptacles Pvt Ltd"}
    )
  `

  return {
    created: true as const,
    id,
    totalWaste,
    companyName,
    address,
    fy,
    certNumber,
    issueDate,
    validUntil,
    validUntilLabel,
  }
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

  const issueDate = new Date()
  const validUntil = addOneYear(issueDate)

  await sql`
    INSERT INTO "Certificate" (
      id, "customerId", name, "issueDate", type, description,
      "certificateNumber", "validUntil", "issuedBy"
    ) VALUES (
      ${id},
      ${customerId},
      ${name},
      ${issueDate},
      ${"KraftReborn"},
      ${description},
      ${options.orderId},
      ${toValidUntilStorage(validUntil)},
      ${"Kraft Reborn Studio"}
    )
  `

  return { id, created: true }
}
