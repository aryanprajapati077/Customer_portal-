import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { resend, getResendFrom } from "@/lib/resend"
import { generateImpactReportPdf } from "@/lib/generate-impact-report-pdf"
import {
  syncMonthlyReportsForAllActiveCustomers,
  syncMonthlyReportsForCustomer,
  getCurrentMonthKey,
} from "@/lib/monthly-reports"
import { buildEsgReportEmailHtml, buildEsgReportEmailText } from "@/lib/email-templates"
import { formatReportingPeriod } from "@/lib/esg-metrics"

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
      const customerId = body?.customerId ? String(body.customerId) : null
      const months = Number(body?.months) || 12

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
        return NextResponse.json({ success: true, ...result })
      }

      const result = await syncMonthlyReportsForAllActiveCustomers(months)
      return NextResponse.json({ success: true, ...result })
    }

    if (action === "send-reports") {
      if (!resend) {
        return NextResponse.json(
          { success: false, error: "Email not configured. Set RESEND_API_KEY in .env" },
          { status: 503 },
        )
      }

      const period = body?.period ? String(body.period) : getCurrentMonthKey()
      const customerId = body?.customerId ? String(body.customerId) : null
      const asOfDate = parsePeriodMonth(period)
      const periodLabel = formatReportingPeriod(asOfDate)

      const customers = customerId
        ? await sql`
            SELECT id, email, "companyName", "contactPerson", status, "joinDate"
            FROM "Customer"
            WHERE id = ${customerId}
          `
        : await sql`
            SELECT id, email, "companyName", "contactPerson", status, "joinDate"
            FROM "Customer"
            WHERE status = 'Active'
            ORDER BY "companyName" ASC
          `

      const results: { id: string; email: string; status: "sent" | "failed" | "skipped"; error?: string }[] = []

      for (const row of customers as {
        id: string
        email: string
        companyName: string
        contactPerson: string | null
        status: string
        joinDate?: string | Date | null
      }[]) {
        if (row.status !== "Active") {
          results.push({ id: row.id, email: row.email, status: "skipped", error: "Inactive" })
          continue
        }

        if (!row.email?.trim()) {
          results.push({ id: row.id, email: row.email, status: "skipped", error: "No email" })
          continue
        }

        try {
          await syncMonthlyReportsForCustomer(row.id, { months: 12, joinDate: row.joinDate })

          const { pdfBuffer, filename, reportData } = await generateImpactReportPdf(row.id, { period })

          await resend.emails.send({
            from: getResendFrom(),
            to: row.email,
            subject: `Your ${periodLabel} ESG Impact Report – Buffindia`,
            html: buildEsgReportEmailHtml({
              companyName: row.companyName,
              contactName: row.contactPerson,
              period: periodLabel,
              customerId: reportData.customerId,
            }),
            text: buildEsgReportEmailText({
              companyName: row.companyName,
              contactName: row.contactPerson,
              period: periodLabel,
              customerId: reportData.customerId,
            }),
            attachments: [
              {
                filename,
                content: pdfBuffer,
              },
            ],
          })

          const notifId = `notif_report_${row.id}_${Date.now()}`
          await sql`
            INSERT INTO "Notification" (id, "customerId", title, body)
            VALUES (
              ${notifId},
              ${row.id},
              ${`Your ${periodLabel} ESG Report is ready`},
              ${"We emailed your latest ESG impact report. You can also download it from Reports & Documents in your dashboard."}
            )
          `

          results.push({ id: row.id, email: row.email, status: "sent" })
        } catch (error) {
          results.push({
            id: row.id,
            email: row.email,
            status: "failed",
            error: error instanceof Error ? error.message : "Send failed",
          })
        }
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
