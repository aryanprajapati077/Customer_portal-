import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { syncMonthlyReportsForCustomer } from "@/lib/monthly-reports"

function formatReport(row: {
  id: string
  name: string
  date: Date
  type: string | null
  period: string | null
  description: string | null
  driveFileUrl: string | null
  size: string | null
  generatedBy: string | null
}) {
  return {
    id: row.id,
    name: row.name,
    date: row.date.toISOString(),
    type: row.type || "monthly",
    period: row.period,
    description: row.description,
    driveFileUrl: row.driveFileUrl,
    size: row.size,
    generatedBy: row.generatedBy,
  }
}

export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get("customerId")

    if (!customerId) {
      return NextResponse.json({ success: false, error: "Customer ID required" }, { status: 400 })
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, joinDate: true },
    })

    if (!customer) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 })
    }

    await syncMonthlyReportsForCustomer(customerId, {
      months: 12,
      joinDate: customer.joinDate,
    })

    const reports = await prisma.report.findMany({
      where: { customerId },
      orderBy: { date: "desc" },
    })

    return NextResponse.json({
      success: true,
      reports: reports.map(formatReport),
    })
  } catch (error) {
    console.error("Error fetching reports:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
