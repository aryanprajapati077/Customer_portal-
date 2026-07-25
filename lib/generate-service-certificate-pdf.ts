import React from "react"
import { renderToBuffer } from "@react-pdf/renderer"
import { sql } from "@/lib/db"
import { syncServiceCertificate } from "@/lib/sync-certificates"
import { CertificateOfServicesPdf } from "@/lib/certificate-of-services-pdf"
import { getIndianFiscalYear } from "@/lib/kraftreborn"
import { parseLocation, formatInstallDate } from "@/lib/esg-metrics"
import { resolveLogoForPdf } from "@/lib/resolve-logo"

export async function generateServiceCertificatePdf(customerId: string, certificateId?: string) {
  const sync = await syncServiceCertificate(customerId)
  if (!("id" in sync) || !sync.id) {
    throw new Error(`Customer ${customerId} not found`)
  }

  const id = certificateId || sync.id
  const certRows = await sql`
    SELECT * FROM "Certificate" WHERE id = ${id} LIMIT 1
  `
  const cert = certRows[0] as Record<string, unknown> | undefined
  if (!cert) throw new Error("Certificate not found after sync")

  const customerRows = await sql`
    SELECT id, email, "companyName", "contactPerson", address, "logoUrl", "tradeName", city, state
    FROM "Customer" WHERE id = ${customerId} LIMIT 1
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
  }
  if (!customer) throw new Error(`Customer ${customerId} not found`)

  const totalWaste = Number(sync.totalWaste) || 0

  const location =
    [customer.city, customer.state].filter(Boolean).join(", ") ||
    parseLocation(customer.address).replace("\n", ", ")

  const data = {
    certificateNumber: String(cert.certificateNumber || sync.certNumber || "206"),
    companyName: customer.companyName,
    location,
    fiscalYear: getIndianFiscalYear(),
    totalWasteKg: totalWaste,
    issuedBy: "Ketan Prajapati",
    issueDate: formatInstallDate(new Date().toISOString()),
    customerId: customer.id,
    logoUrl: resolveLogoForPdf(customer.logoUrl),
  }

  const pdfBuffer = await renderToBuffer(
    React.createElement(CertificateOfServicesPdf, { data }) as React.ReactElement,
  )

  return {
    pdfBuffer: Buffer.from(pdfBuffer),
    filename: `${customer.companyName.replace(/\s+/g, "-")}-Certificate-of-Services.pdf`,
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
      name: String(cert.name || "Certificate of Services"),
      type: String(cert.type || "services"),
      certificateNumber: data.certificateNumber,
    },
  }
}
