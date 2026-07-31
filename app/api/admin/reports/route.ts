import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { resend, getResendFrom } from "@/lib/resend"
import { generateImpactReportPdf } from "@/lib/generate-impact-report-pdf"
import { generateImpactReportExcel } from "@/lib/generate-impact-report-excel"
import {
  syncMonthlyReportsForAllActiveCustomers,
  syncMonthlyReportsForCustomer,
  ensureMonthlyReportForPeriod,
  getCurrentMonthKey,
} from "@/lib/monthly-reports"
import {
  buildEsgReportEmailHtml,
  buildEsgReportEmailText,
  buildEsgReportSubject,
} from "@/lib/email-templates"
import { getEsgEmailCopy } from "@/lib/email-template-store"
import { formatReportingPeriod } from "@/lib/esg-metrics"
import { resolveReportRecipients } from "@/lib/report-recipients"
import { logEmailDelivery } from "@/lib/email-delivery-log"

function parsePeriodMonth(period?: string | null): Date | undefined {
  if (!period?.trim()) return undefined
  const match = period.match(/^(\d{4})-(\d{2})$/)
  if (!match) return undefined
  const year = Number(match[1])
  const month = Number(match[2]) - 1
  return new Date(year, month + 1, 0, 23, 59, 59, 999)
}

export async function GET() {
  try {
    const [reports, stats] = await Promise.all([
      sql`
        SELECT r.id, r."customerId", r.name, r.date, r.type, r.period, r."generatedBy",
               c."companyName", c.email, c.status
        FROM "Report" r
        JOIN "Customer" c ON c.id = r."customerId"
        ORDER BY r.date DESC
        LIMIT 100
      `,
      sql`
        SELECT
          (SELECT COUNT(*)::int FROM "Customer" WHERE status = 'Active') AS active_customers,
          (SELECT COUNT(*)::int FROM "Report" WHERE type = 'monthly') AS monthly_reports,
          (SELECT COUNT(*)::int FROM "Report"
            WHERE type = 'monthly'
              AND date >= date_trunc('month', CURRENT_DATE)) AS reports_this_month
      `,
    ])

    return NextResponse.json({
      success: true,
      reports,
      stats: stats[0] || {},
    })
  } catch (error) {
    console.error("Error fetching admin reports:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const action = String(body?.action || "")

    if (action === "generate-monthly") {
      const customerId = body?.customerId ? String(body.customerId).trim() : null
      const period = body?.period ? String(body.period).trim() : null
      const months = Number(body?.months) || 12

      if (customerId && period) {
        const customerRows = await sql`
          SELECT id FROM "Customer" WHERE id = ${customerId} LIMIT 1
        `
        if (!customerRows[0]) {
          return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 })
        }
        if (!/^\d{4}-\d{2}$/.test(period)) {
          return NextResponse.json(
            { success: false, error: "Invalid month. Use YYYY-MM." },
            { status: 400 },
          )
        }
        const result = await ensureMonthlyReportForPeriod(customerId, period)
        return NextResponse.json({
          success: true,
          customerId,
          period,
          created: result.created ? 1 : 0,
          reportId: result.id,
          mode: "single",
        })
      }

      if (customerId) {
        const customerRows = await sql`
          SELECT id, "joinDate" FROM "Customer" WHERE id = ${customerId} LIMIT 1
        `
        if (!customerRows[0]) {
          return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 })
        }
        const result = await syncMonthlyReportsForCustomer(customerId, {
          months,
          joinDate: (customerRows[0] as { joinDate?: string }).joinDate,
        })
        return NextResponse.json({ success: true, mode: "customer", ...result })
      }

      const result = await syncMonthlyReportsForAllActiveCustomers(months)
      return NextResponse.json({ success: true, mode: "all", ...result })
    }

    if (action === "send-reports") {
      if (!resend) {
        return NextResponse.json(
          { success: false, error: "Email not configured. Set RESEND_API_KEY in .env" },
          { status: 503 },
        )
      }
      const mailer = resend

      const period = body?.period ? String(body.period) : getCurrentMonthKey()
      const customerId = body?.customerId ? String(body.customerId).trim() : null
      const asOfDate = parsePeriodMonth(period)
      const periodLabel = formatReportingPeriod(asOfDate)
      const emailCopy = await getEsgEmailCopy()

      if (!/^\d{4}-\d{2}$/.test(period)) {
        return NextResponse.json(
          { success: false, error: "Invalid month. Use YYYY-MM." },
          { status: 400 },
        )
      }

      const customers = customerId
        ? await sql`
            SELECT id, email, "companyName", "contactPerson", "primaryPocName", status, "joinDate",
                   "primaryPocEmail", "collectionPocs"
            FROM "Customer"
            WHERE id = ${customerId}
          `
        : await sql`
            SELECT id, email, "companyName", "contactPerson", "primaryPocName", status, "joinDate",
                   "primaryPocEmail", "collectionPocs"
            FROM "Customer"
            WHERE status = 'Active'
            ORDER BY "companyName" ASC
          `

      if (customerId && (!Array.isArray(customers) || customers.length === 0)) {
        return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 })
      }

      type CustomerRow = {
        id: string
        email: string
        companyName: string
        contactPerson: string | null
        primaryPocName?: string | null
        status: string
        joinDate?: string | Date | null
        primaryPocEmail?: string | null
        collectionPocs?: string | null
      }

      const rows = customers as CustomerRow[]
      const results: {
        id: string
        email: string
        status: "sent" | "failed" | "skipped" | "queued"
        error?: string
      }[] = []

      const toSend: CustomerRow[] = []
      for (const row of rows) {
        if (!customerId && row.status !== "Active") {
          results.push({ id: row.id, email: row.email, status: "skipped", error: "Inactive" })
          continue
        }
        if (!resolveReportRecipients(row).to) {
          results.push({ id: row.id, email: row.email, status: "skipped", error: "No email" })
          continue
        }
        toSend.push(row)
      }

      // Single-customer send: generate + queue Resend, return immediately
      if (customerId && toSend.length === 1) {
        const row = toSend[0]
        await ensureMonthlyReportForPeriod(row.id, period)
        const [{ pdfBuffer, filename: pdfFilename, reportData }, excel] = await Promise.all([
          generateImpactReportPdf(row.id, { period }),
          generateImpactReportExcel(row.id, { period }),
        ])

        const { queueEmail } = await import("@/lib/email-queue")
        const recipients = resolveReportRecipients(row)
        if (!recipients.to) {
          results.push({ id: row.id, email: row.email, status: "skipped", error: "No email" })
          return NextResponse.json({
            success: true,
            period,
            periodLabel,
            sent: 0,
            queued: 0,
            failed: 0,
            skipped: results.filter((r) => r.status === "skipped").length,
            results,
          })
        }

        queueEmail("esg-report", async () => {
          try {
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
            const resendId =
              (sendResult as { data?: { id?: string }; id?: string })?.data?.id ||
              (sendResult as { id?: string })?.id ||
              null
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
          } catch (err) {
            const message = err instanceof Error ? err.message : "Send failed"
            await logEmailDelivery({
              customerId: row.id,
              email: recipients.to,
              emailRole: "to",
              kind: "esg_report",
              status: "failed",
              error: message,
              period,
              companyName: row.companyName,
            })
            throw err
          }
        })

        await logEmailDelivery({
          customerId: row.id,
          email: recipients.to,
          emailRole: "to",
          kind: "esg_report",
          status: "queued",
          period,
          companyName: row.companyName,
        })

        results.push({ id: row.id, email: recipients.to, status: "queued" })
        return NextResponse.json({
          success: true,
          period,
          periodLabel,
          sent: 0,
          queued: 1,
          failed: 0,
          skipped: results.filter((r) => r.status === "skipped").length,
          results,
        })
      }

      // Bulk: generate + send in parallel (batches of 4)
      const CONCURRENCY = 4
      for (let i = 0; i < toSend.length; i += CONCURRENCY) {
        const batch = toSend.slice(i, i + CONCURRENCY)
        const settled = await Promise.allSettled(
          batch.map(async (row) => {
            await ensureMonthlyReportForPeriod(row.id, period)
            const [{ pdfBuffer, filename: pdfFilename, reportData }, excel] = await Promise.all([
              generateImpactReportPdf(row.id, { period }),
              generateImpactReportExcel(row.id, { period }),
            ])
            const recipients = resolveReportRecipients(row)
            if (!recipients.to) throw new Error("No email")
            try {
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
              const resendId =
                (sendResult as { data?: { id?: string }; id?: string })?.data?.id ||
                (sendResult as { id?: string })?.id ||
                null
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
              return { row, to: recipients.to }
            } catch (err) {
              const message = err instanceof Error ? err.message : "Send failed"
              await logEmailDelivery({
                customerId: row.id,
                email: recipients.to,
                emailRole: "to",
                kind: "esg_report",
                status: "failed",
                error: message,
                period,
                companyName: row.companyName,
              })
              throw err
            }
          }),
        )

        settled.forEach((outcome, idx) => {
          const row = batch[idx]
          if (outcome.status === "fulfilled") {
            results.push({
              id: row.id,
              email: outcome.value.to || row.email,
              status: "sent",
            })
          } else {
            const recipients = resolveReportRecipients(row)
            results.push({
              id: row.id,
              email: recipients.to || row.email,
              status: "failed",
              error:
                outcome.reason instanceof Error ? outcome.reason.message : "Send failed",
            })
          }
        })
      }

      const sent = results.filter((r) => r.status === "sent").length
      const failed = results.filter((r) => r.status === "failed").length
      const skipped = results.filter((r) => r.status === "skipped").length

      return NextResponse.json({
        success: true,
        period,
        periodLabel,
        sent,
        failed,
        skipped,
        results,
      })
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 })
  } catch (error) {
    console.error("Error in admin reports POST:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
