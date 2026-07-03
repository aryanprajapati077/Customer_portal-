import React from "react"
import { renderToBuffer } from "@react-pdf/renderer"
import { sql } from "@/lib/db"
import { syncServiceCertificate } from "@/lib/sync-certificates"
import { CertificateOfServicesPdf } from "@/lib/certificate-of-services-pdf"
import { getIndianFiscalYear } from "@/lib/kraftreborn"
import { parseLocation, formatInstallDate } from "@/lib/esg-metrics"

export async function generateServiceCertificatePdf(customerId: string, certificateId?: string) {
  const sync = await syncServiceCertificate(customerId)

  const id = certificateId || sync.id || `cert_services_${customerId}`
  const certRows = await sql`
    SELECT * FROM "Certificate" WHERE id = ${id} LIMIT 1
  `
  const cert = certRows[0] as Record<string, unknown> | undefined
  if (!cert) throw new Error("Certificate not found")

  const customerRows = await sql`
    SELECT "companyName", address FROM "Customer" WHERE id = ${customerId} LIMIT 1
  `
  const customer = customerRows[0] as { companyName: string; address?: string | null }

  const collectionRows = await sql`
    SELECT COALESCE(SUM(weight), 0)::float AS total FROM "Collection" WHERE "customerId" = ${customerId}
  `
  const totalWaste =
    Number((collectionRows[0] as { total?: number })?.total) || sync.totalWaste || 0

  const data = {
    certificateNumber: String(cert.certificateNumber || sync.certNumber || "206"),
    companyName: customer.companyName,
    location: parseLocation(customer.address).replace("\n", ", "),
    fiscalYear: getIndianFiscalYear(),
    totalWasteKg: totalWaste,
    issuedBy: "Ketan Prajapati",
    issueDate: formatInstallDate(new Date().toISOString()),
  }

  const pdfBuffer = await renderToBuffer(
    React.createElement(CertificateOfServicesPdf, { data }) as React.ReactElement,
  )

  return {
    pdfBuffer: Buffer.from(pdfBuffer),
    filename: `${customer.companyName.replace(/\s+/g, "-")}-Certificate-of-Services.pdf`,
    data,
  }
}
