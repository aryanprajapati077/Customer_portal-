import { sql } from "@/lib/db"
import { resend, getResendFrom } from "@/lib/resend"
import { generateImpactReportPdf } from "@/lib/generate-impact-report-pdf"
import { generateImpactReportExcel } from "@/lib/generate-impact-report-excel"
import { ensureMonthlyReportForPeriod } from "@/lib/monthly-reports"
import {
  buildEsgReportEmailHtml,
  buildEsgReportEmailText,
  buildEsgReportSubject,
} from "@/lib/email-templates"
import { getEsgEmailCopy } from "@/lib/email-template-store"
import { resolveReportRecipients } from "@/lib/report-recipients"
import { logEmailDelivery } from "@/lib/email-delivery-log"
import { formatReportingPeriod } from "@/lib/esg-metrics"

export type ReportCustomerRow = {
  id: string
  email: string
  companyName: string
  contactPerson: string | null
  primaryPocName?: string | null
  status: string
  serviceStatus?: string | null
  joinDate?: string | Date | null
  serviceStartDate?: string | Date | null
  collectionFrequency?: string | null
  primaryPocEmail?: string | null
  primaryPocEmailEnabled?: boolean | null
  primaryPocStatus?: string | null
  collectionPocs?: string | null
}

export async function loadReportCustomer(customerId: string): Promise<ReportCustomerRow | null> {
  const rows = await sql`
    SELECT id, email, "companyName", "contactPerson", "primaryPocName", status, "serviceStatus", "joinDate",
           "serviceStartDate", "collectionFrequency",
           "primaryPocEmail", "primaryPocEmailEnabled", "primaryPocStatus", "collectionPocs"
    FROM "Customer"
    WHERE id = ${customerId}
    LIMIT 1
  `
  return (rows[0] as ReportCustomerRow | undefined) || null
}

export async function sendEsgReportEmail(options: {
  row: ReportCustomerRow
  period: string
  periodLabel?: string
}) {
  const mailer = resend
  if (!mailer) throw new Error("Email not configured")

  const { row, period } = options
  const periodLabel = options.periodLabel || formatReportingPeriod(parsePeriodEnd(period))
  const emailCopy = await getEsgEmailCopy()

  await ensureMonthlyReportForPeriod(row.id, period)
  const [{ pdfBuffer, filename: pdfFilename, reportData }, excel] = await Promise.all([
    generateImpactReportPdf(row.id, { period }),
    generateImpactReportExcel(row.id, { period }),
  ])
  const recipients = resolveReportRecipients(row)
  if (!recipients.to) throw new Error("No email")

  const sendResult = await mailer.emails.send({
    from: getResendFrom(),
    to: recipients.to,
    ...(recipients.cc.length ? { cc: recipients.cc } : {}),
    subject: buildEsgReportSubject(
      { period: periodLabel, companyName: row.companyName },
      emailCopy,
    ),
    html: buildEsgReportEmailHtml(
      {
        companyName: row.companyName,
        contactName: row.primaryPocName || row.contactPerson,
        period: periodLabel,
        customerId: reportData.customerId,
      },
      emailCopy,
    ),
    text: buildEsgReportEmailText(
      {
        companyName: row.companyName,
        contactName: row.primaryPocName || row.contactPerson,
        period: periodLabel,
        customerId: reportData.customerId,
      },
      emailCopy,
    ),
    attachments: [
      { filename: pdfFilename, content: pdfBuffer },
      { filename: excel.filename, content: excel.buffer },
    ],
  })
  const sendError = (sendResult as { error?: { message?: string } | null })?.error
  if (sendError) {
    throw new Error(sendError.message || "Resend send failed")
  }
  const resendId = (sendResult as { data?: { id?: string } })?.data?.id || null
  if (!resendId) {
    console.warn("[esg-report] Resend send succeeded but no email id was returned")
  }
  await logEmailDelivery({
    customerId: row.id,
    email: recipients.to,
    emailRole: "to",
    kind: "esg_report",
    status: "sent",
    resendId,
    period,
    companyName: row.companyName,
  })
  for (const cc of recipients.cc) {
    await logEmailDelivery({
      customerId: row.id,
      email: cc,
      emailRole: "cc",
      kind: "esg_report",
      status: "sent",
      resendId,
      period,
      companyName: row.companyName,
    })
  }
  const notifId = `notif_report_${row.id}_${Date.now()}`
  await sql`
    INSERT INTO "Notification" (id, "customerId", title, body)
    VALUES (
      ${notifId},
      ${row.id},
      ${`Your ${periodLabel} ESG Report is ready`},
      ${"We emailed your latest ESG impact report (PDF + Excel). You can also download it from Reports & Documents in your dashboard."}
    )
  `
  return recipients.to
}

function parsePeriodEnd(period: string): Date | undefined {
  const match = period.match(/^(\d{4})-(\d{2})$/)
  if (!match) return undefined
  const year = Number(match[1])
  const month = Number(match[2]) - 1
  return new Date(year, month + 1, 0, 23, 59, 59, 999)
}
