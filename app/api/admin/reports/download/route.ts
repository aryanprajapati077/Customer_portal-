import { type NextRequest, NextResponse } from "next/server"
import { generateImpactReportPdf } from "@/lib/generate-impact-report-pdf"
import { generateImpactReportExcel } from "@/lib/generate-impact-report-excel"
import { requireAdminSession } from "@/lib/admin-auth-server"
import { hasAdminPermission } from "@/lib/admin-permissions"
import { sql } from "@/lib/db"
import { parsePeriodToMonthKey } from "@/lib/report-periods"

function monthKeyFromDate(date: string | Date): string | null {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }
  if (!hasAdminPermission(session.role, session.permissions, "reports")) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  const reportId = request.nextUrl.searchParams.get("reportId")?.trim()
  let customerId = request.nextUrl.searchParams.get("customerId")?.trim()
  let period = request.nextUrl.searchParams.get("period")?.trim()
  const format = request.nextUrl.searchParams.get("format") || "pdf"

  if (reportId) {
    const rows = await sql`
      SELECT id, "customerId", period, date
      FROM "Report"
      WHERE id = ${reportId}
      LIMIT 1
    `
    const report = rows[0] as
      | { id: string; customerId: string; period?: string | null; date?: string | Date | null }
      | undefined
    if (!report) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 })
    }
    customerId = report.customerId
    period =
      parsePeriodToMonthKey(report.period, report.date) ||
      monthKeyFromDate(report.date as string | Date) ||
      period
  }

  if (!customerId || !period || !/^\d{4}-\d{2}$/.test(period)) {
    return NextResponse.json(
      { success: false, error: "customerId and period (YYYY-MM) required" },
      { status: 400 },
    )
  }

  if (format !== "pdf" && format !== "excel") {
    return NextResponse.json({ success: false, error: "format must be pdf or excel" }, { status: 400 })
  }

  try {
    const reportOptions = { period, range: "month" as const }

    if (format === "excel") {
      const { buffer, filename } = await generateImpactReportExcel(customerId, reportOptions)
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      })
    }

    const { pdfBuffer, filename } = await generateImpactReportPdf(customerId, reportOptions)
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Admin report download error:", error)
    return NextResponse.json({ success: false, error: "Failed to generate report" }, { status: 500 })
  }
}
