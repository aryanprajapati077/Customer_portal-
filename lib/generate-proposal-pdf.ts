import React from "react"
import { renderToBuffer } from "@react-pdf/renderer"
import {
  ProposalPdfDocument,
  type ProposalLead,
  type ProposalPdfData,
} from "@/lib/proposal-pdf"
import type { ImpactEstimate } from "@/lib/impact-calculator"

export async function generateProposalPdf(
  lead: ProposalLead,
  estimate: ImpactEstimate,
): Promise<{ pdfBuffer: Buffer; filename: string }> {
  const generatedAt = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const data: ProposalPdfData = { lead, estimate, generatedAt }
  const pdfBuffer = await renderToBuffer(
    React.createElement(ProposalPdfDocument, data) as React.ReactElement,
  )

  const safeCompany = lead.companyName.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "") || "Organisation"
  const filename = `Buffindia-Proposal-${safeCompany}.pdf`

  return { pdfBuffer: Buffer.from(pdfBuffer), filename }
}
