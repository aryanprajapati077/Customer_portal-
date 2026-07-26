import { resolveReportDateWindow } from "@/lib/report-date-range"
import { sql } from "@/lib/db"
import { computeImpactReportData } from "@/lib/esg-metrics"
import { ImpactReportPdfDocument } from "@/lib/impact-report-pdf"
import { resolveLogoForPdf } from "@/lib/resolve-logo"
import React from "react"
import { renderToBuffer } from "@react-pdf/renderer"

export function parsePeriodMonth(period?: string | null): Date | undefined {
  if (!period?.trim()) return undefined
  const match = period.match(/^(\d{4})-(\d{2})$/)
  if (!match) return undefined
  const year = Number(match[1])
  const month = Number(match[2]) - 1
  if (!Number.isFinite(year) || !Number.isFinite(month)) return undefined
  return new Date(year, month + 1, 0, 23, 59, 59, 999)
}

export type ImpactReportOptions = {
  period?: string
  range?: string
  startDate?: string
  endDate?: string
  logoUrl?: string | null
}

export async function generateImpactReportPdf(
  customerId: string,
  options?: ImpactReportOptions,
) {
  const window = resolveReportDateWindow({
    range: options?.range,
    period: options?.period,
    startDate: options?.startDate,
    endDate: options?.endDate,
  })

  const startIso = window.startDate?.toISOString()
  const endIso = window.endDate?.toISOString()

  const [customerRows, collectionRows] = await Promise.all([
    sql`
      SELECT id, "companyName", address, "joinDate", "disposalUnitInstalled",
             "totalWasteCollected", "kraftrebornCredits", "contactPerson", email, "logoUrl"
      FROM "Customer"
      WHERE id = ${customerId}
      LIMIT 1
    `,
    startIso && endIso
      ? sql`
          SELECT weight, date
          FROM "Collection"
          WHERE "customerId" = ${customerId}
            AND date >= ${startIso}
            AND date <= ${endIso}
          ORDER BY date DESC
        `
      : endIso
        ? sql`
            SELECT weight, date
            FROM "Collection"
            WHERE "customerId" = ${customerId}
              AND date <= ${endIso}
            ORDER BY date DESC
          `
        : sql`
            SELECT weight, date
            FROM "Collection"
            WHERE "customerId" = ${customerId}
            ORDER BY date DESC
          `,
  ])

  const customer = customerRows[0] as Record<string, unknown> | undefined
  if (!customer) {
    throw new Error("Customer not found")
  }

  const reportData = computeImpactReportData(
    {
      id: String(customer.id),
      companyName: String(customer.companyName),
      address: customer.address as string | null,
      joinDate: customer.joinDate as string | Date | null,
      disposalUnitInstalled: Number(customer.disposalUnitInstalled) || 0,
      totalWasteCollected: Number(customer.totalWasteCollected) || 0,
      kraftrebornCredits: Number(customer.kraftrebornCredits) || 0,
    },
    collectionRows as { weight?: number | string | null }[],
    window.endDate,
  )

  reportData.reportingPeriod = window.label
  reportData.logoUrl =
    resolveLogoForPdf(options?.logoUrl) || resolveLogoForPdf(customer.logoUrl as string | null)

  const pdfBuffer = await renderToBuffer(
    React.createElement(ImpactReportPdfDocument, { data: reportData }) as any,
  )

  const filename = `${reportData.customerId}-ESG-Report-${reportData.reportingPeriod.replace(/\s+/g, "-").replace(/–/g, "-")}.pdf`

  return {
    pdfBuffer: Buffer.from(pdfBuffer),
    filename,
    reportData,
    customer: {
      id: String(customer.id),
      email: String(customer.email || ""),
      companyName: String(customer.companyName),
      contactPerson: customer.contactPerson as string | null,
    },
  }
}
