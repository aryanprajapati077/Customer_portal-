import React from "react"
import { renderToBuffer } from "@react-pdf/renderer"
import { KraftRebornCertificatePdf } from "@/lib/kraftreborn-certificate-pdf"
import { computeKraftRebornImpact } from "@/lib/kraftreborn"

export async function generateKraftRebornCertificatePdf(options: {
  contactName: string
  orderId: string
  orderAmountRupees: number
  productCount?: number
}) {
  const impact = computeKraftRebornImpact(options.orderAmountRupees, options.productCount ?? 1)
  const issueDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const data = {
    contactName: options.contactName,
    orderId: options.orderId,
    issueDate,
    butts: impact.butts,
    soilSqFt: impact.soilSqFt,
    waterLitres: impact.waterLitres,
    productCount: impact.productCount,
  }

  const pdfBuffer = await renderToBuffer(
    React.createElement(KraftRebornCertificatePdf, { data }) as React.ReactElement,
  )

  return {
    pdfBuffer: Buffer.from(pdfBuffer),
    filename: `KraftReborn-Impact-${options.orderId}.pdf`,
    data,
    impact,
  }
}
