import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { resend } from "@/lib/resend"
import {
  syncMonthlyReportsForAllActiveCustomers,
  syncMonthlyReportsForCustomer,
  ensureMonthlyReportForPeriod,
  getCurrentMonthKey,
} from "@/lib/monthly-reports"
import { formatReportingPeriod } from "@/lib/esg-metrics"
import { resolveReportRecipients } from "@/lib/report-recipients"
import { logEmailDelivery } from "@/lib/email-delivery-log"
import { requireAdminSession } from "@/lib/admin-auth-server"
import { hasAdminPermission } from "@/lib/admin-permissions"
import { isEmailEnabled } from "@/lib/email-settings"
import { getReportSendBlockReasonSync, getCollectionStatsByCustomer } from "@/lib/report-eligibility"
import { queueEmail } from "@/lib/email-queue"
import {
  drainReportSendJobs,
  enqueueBulkReportSend,
  getActiveReportSendJob,
  getLatestReportSendJob,
  processReportSendBatch,
} from "@/lib/report-send-job"
import {
  sendEsgReportEmail,
  type ReportCustomerRow,
} from "@/lib/send-esg-report-email"

export const maxDuration = 300

function parsePeriodMonth(period?: string | null): Date | undefined {
  if (!period?.trim()) return undefined
  const match = period.match(/^(\d{4})-(\d{2})$/)
  if (!match) return undefined
  const year = Number(match[1])
  const month = Number(match[2]) - 1
  return new Date(year, month + 1, 0, 23, 59, 59, 999)
}

async function requireReportsAdmin(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session) {
    return { ok: false as const, response: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }) }
  }
  if (!hasAdminPermission(session.role, session.permissions, "reports")) {
    return { ok: false as const, response: NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }) }
  }
  return { ok: true as const, session }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireReportsAdmin(request)
    if (!auth.ok) return auth.response

    const [reports, stats, sendJob] = await Promise.all([
      sql`
        SELECT r.id, r."customerId", r.name, r.date, r.type, r.period, r."generatedBy",
               c."companyName", c.email, c.status,
               COALESCE((
                 SELECT SUM(col.weight)::float
                 FROM "Collection" col
                 WHERE col."customerId" = r."customerId"
                   AND date_trunc('month', col.date) = date_trunc('month', r.date)
                   AND LOWER(COALESCE(col.status, 'completed')) = 'completed'
               ), 0) AS "collectionKg"
        FROM "Report" r
        JOIN "Customer" c ON c.id = r."customerId"
        ORDER BY r.date DESC, r.id DESC
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
      getActiveReportSendJob(),
    ])

    return NextResponse.json({
      success: true,
      reports,
      stats: stats[0] || {},
      sendJob,
    })
  } catch (error) {
    console.error("Error fetching admin reports:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireReportsAdmin(request)
    if (!auth.ok) return auth.response

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
      if (!(await isEmailEnabled("esg_report"))) {
        return NextResponse.json(
          { success: false, error: "ESG report emails are turned off in Email On/Off settings." },
          { status: 403 },
        )
      }
      const period = body?.period ? String(body.period) : getCurrentMonthKey()
      const customerId = body?.customerId ? String(body.customerId).trim() : null
      const asOfDate = parsePeriodMonth(period)
      const periodLabel = formatReportingPeriod(asOfDate)

      if (!/^\d{4}-\d{2}$/.test(period)) {
        return NextResponse.json(
          { success: false, error: "Invalid month. Use YYYY-MM." },
          { status: 400 },
        )
      }

      const customers = customerId
        ? await sql`
            SELECT id, email, "companyName", "contactPerson", "primaryPocName", status, "serviceStatus", "joinDate",
                   "serviceStartDate", "collectionFrequency",
                   "primaryPocEmail", "collectionPocs"
            FROM "Customer"
            WHERE id = ${customerId}
          `
        : await sql`
            SELECT id, email, "companyName", "contactPerson", "primaryPocName", status, "serviceStatus", "joinDate",
                   "serviceStartDate", "collectionFrequency",
                   "primaryPocEmail", "collectionPocs"
            FROM "Customer"
            WHERE status = 'Active'
              AND COALESCE("serviceStatus", 'ACTIVE') = 'ACTIVE'
            ORDER BY "companyName" ASC
          `

      if (customerId && (!Array.isArray(customers) || customers.length === 0)) {
        return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 })
      }

      const rows = customers as ReportCustomerRow[]

      if (customerId) {
        const row = rows[0]
        const collectionStats = await getCollectionStatsByCustomer(period)
        const pendingReason = getReportSendBlockReasonSync(period, row, collectionStats.get(row.id))
        if (pendingReason) {
          return NextResponse.json({
            success: false,
            error: pendingReason,
            period,
            periodLabel,
            sent: 0,
            failed: 0,
            skipped: 1,
            results: [{ id: row.id, email: row.email, status: "skipped", error: pendingReason }],
          })
        }
        const recipients = resolveReportRecipients(row)
        if (!recipients.to) {
          return NextResponse.json({
            success: false,
            error: "No email",
            period,
            periodLabel,
            sent: 0,
            failed: 0,
            skipped: 1,
          })
        }

        queueEmail("esg-report", async () => {
          try {
            await sendEsgReportEmail({ row, period, periodLabel })
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

        return NextResponse.json({
          success: true,
          period,
          periodLabel,
          sent: 0,
          queued: 1,
          failed: 0,
          skipped: 0,
          results: [{ id: row.id, email: recipients.to, status: "queued" }],
        })
      }

      const queued = await enqueueBulkReportSend(period, rows)
      queueEmail("esg-reports-job", () => drainReportSendJobs(240_000))

      return NextResponse.json({
        success: true,
        period,
        periodLabel,
        sent: queued.job.sent,
        queued: queued.queued,
        failed: queued.job.failed,
        skipped: queued.skipped,
        alreadySent: 0,
        reused: queued.reused,
        job: queued.job,
        results: [],
      })
    }

    if (action === "send-job-status") {
      const period = body?.period ? String(body.period) : ""
      let job = period ? await getLatestReportSendJob(period) : await getActiveReportSendJob()
      if (job && (job.status === "queued" || job.status === "running")) {
        await processReportSendBatch(8)
        job = (await getLatestReportSendJob(job.period)) || job
      }
      return NextResponse.json({ success: true, job })
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 })
  } catch (error) {
    console.error("Error in admin reports POST:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireReportsAdmin(request)
    if (!auth.ok) return auth.response

    const body = await request.json().catch(() => ({}))
    const id = String(body?.id || "").trim()
    if (!id) {
      return NextResponse.json({ success: false, error: "Report id required" }, { status: 400 })
    }

    const deleted = await sql.query<{ id: string }>(
      `DELETE FROM "Report" WHERE id = $1 RETURNING id`,
      [id],
    )
    if (!deleted.length) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error("Error deleting admin report:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
