import React from "react"
import { renderToBuffer } from "@react-pdf/renderer"
import { sql } from "@/lib/db"
import { syncServiceCertificate } from "@/lib/sync-certificates"
import { CertificateOfServicesPdf } from "@/lib/certificate-of-services-pdf"
import { getIndianFiscalYear } from "@/lib/kraftreborn"
import { parseLocation, formatInstallDate, formatCustomerCode } from "@/lib/esg-metrics"
import { resolveLogoForPdf } from "@/lib/resolve-logo"
import { absoluteUrl } from "@/lib/site-config"

export async function generateServiceCertificatePdf(customerId: string, certificateId?: string) {
  const sync = await syncServiceCertificate(customerId)
  if (!("id" in sync) || !sync.id) {
    throw new Error("Certificate could not be prepared. Please contact support@buffindia.com.")
  }

  const id = certificateId || sync.id
  const certRows = await sql`
    SELECT * FROM "Certificate" WHERE id = ${id} LIMIT 1
  `
  const cert = certRows[0] as Record<string, unknown> | undefined
  if (!cert) throw new Error("Certificate not found after sync")

  const ownerCustomerId = String(cert.customerId || customerId)
  if (certificateId && ownerCustomerId !== customerId) {
    throw new Error("Certificate does not belong to customer")
  }

  const customerRows = await sql`
    SELECT id, email, "companyName", "contactPerson", address, "logoUrl", "tradeName", city, state,
           COALESCE(phone, "primaryPocNumber") AS phone
    FROM "Customer" WHERE id = ${ownerCustomerId} LIMIT 1
  `
  const customer = customerRows[0] as {
    id: string
    email: string
    companyName: string
    contactPerson?: string | null
    address?: string | null
    logoUrl?: string | null
    tradeName?: string | null
    city?: string | null
    state?: string | null
    phone?: string | null
  }
  if (!customer) throw new Error(`Customer ${customerId} not found`)

  const totalWaste = Number(sync.totalWaste) || 0
  const cigaretteButts = Math.round(totalWaste * 3000)
  const microplasticUpcycledKg = +(totalWaste * 0.8).toFixed(2)

  const location =
    [customer.city, customer.state].filter(Boolean).join(", ") ||
    parseLocation(customer.address).replace("\n", ", ")

  const certificateNumber = String(cert.certificateNumber || sync.certNumber || "BUFF-CEP-001")
  const verifyUrl = absoluteUrl(
    `/api/customer/certificate-pdf?customerId=${encodeURIComponent(customer.id)}&type=services`,
  )

  const issueDateRaw = (sync as { issueDate?: Date }).issueDate || cert.issueDate || new Date()
  const issueDate =
    formatInstallDate(
      issueDateRaw instanceof Date ? issueDateRaw.toISOString() : String(issueDateRaw),
    ) || new Date(String(issueDateRaw)).toLocaleDateString("en-IN")

  const syncValidLabel = (sync as { validUntilLabel?: string }).validUntilLabel
  const rawValid = String(cert.validUntil || "").trim()
  let validTill = syncValidLabel || rawValid || "1 year"
  if (!syncValidLabel && rawValid && !/^lifetime$/i.test(rawValid)) {
    const t = Date.parse(rawValid)
    if (!Number.isNaN(t)) {
      validTill = new Date(t).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    }
  }
  if (/^lifetime$/i.test(validTill)) validTill = "1 year"

  const data = {
    certificateNumber,
    companyName: customer.companyName?.trim() || customer.tradeName?.trim() || "Partner Organization",
    location: location || "India",
    fiscalYear: getIndianFiscalYear(),
    totalWasteKg: totalWaste,
    cigaretteButts,
    microplasticUpcycledKg,
    recycledPercent: 80,
    issuedBy: "Ketan Prajapati",
    issueDate,
    validTill,
    customerId: formatCustomerCode(customer.id) || customer.id,
    logoUrl: resolveLogoForPdf(customer.logoUrl),
    verifyUrl,
    phone: customer.phone || "+91 63595 66528",
  }

  const pdfBuffer = await renderToBuffer(
    React.createElement(CertificateOfServicesPdf, { data }) as React.ReactElement,
  )

  const certName = "Certificate of Clean Environmental Partnership"

  return {
    pdfBuffer: Buffer.from(pdfBuffer),
    filename: `${customer.companyName.replace(/\s+/g, "-")}-Clean-Environmental-Partnership.pdf`,
    data,
    customer: {
      id: customer.id,
      email: customer.email,
      companyName: customer.companyName,
      contactPerson: customer.contactPerson || null,
      tradeName: customer.tradeName || null,
    },
    certificate: {
      id: String(cert.id),
      name: String(cert.name || certName),
      type: String(cert.type || "services"),
      certificateNumber: data.certificateNumber,
    },
  }
}
