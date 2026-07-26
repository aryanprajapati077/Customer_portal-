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
    throw new Error(`Customer ${customerId} not found`)
  }

  const id = certificateId || sync.id
  const certRows = await sql`
    SELECT * FROM "Certificate" WHERE id = ${id} LIMIT 1
  `
  const cert = certRows[0] as Record<string, unknown> | undefined
  if (!cert) throw new Error("Certificate not found after sync")

  const customerRows = await sql`
    SELECT id, email, "companyName", "contactPerson", address, "logoUrl", "tradeName", city, state,
           COALESCE(phone, "primaryPocNumber") AS phone
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
    phone?: string | null
  }
  if (!customer) throw new Error(`Customer ${customerId} not found`)

  const totalWaste = Number(sync.totalWaste) || 0
  const cigaretteButts = Math.round(totalWaste * 3000)
  const co2PreventedKg = Math.round(cigaretteButts * 0.014)
  const tobaccoAshKg = +(totalWaste * 0.2).toFixed(2)
  const peopleImpacted = Math.max(1, Math.round(cigaretteButts / 80))

  const location =
    [customer.city, customer.state].filter(Boolean).join(", ") ||
    parseLocation(customer.address).replace("\n", ", ")

  const certificateNumber = String(cert.certificateNumber || sync.certNumber || "BUFF-CEP-001")
  const verifyUrl = absoluteUrl(
    `/api/customer/certificate-pdf?customerId=${encodeURIComponent(customer.id)}&type=services`,
  )

  const data = {
    certificateNumber,
    companyName: customer.companyName,
    location,
    fiscalYear: getIndianFiscalYear(),
    totalWasteKg: totalWaste,
    co2PreventedKg,
    tobaccoAshKg,
    recycledPercent: 99,
    peopleImpacted,
    issuedBy: "Ketan Prajapati",
    issueDate: formatInstallDate(new Date().toISOString()),
    validTill: "Lifetime",
    customerId: formatCustomerCode(customer.id),
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
