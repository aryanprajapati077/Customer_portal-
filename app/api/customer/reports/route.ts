import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get("customerId")

    if (!customerId) {
      return NextResponse.json({ success: false, error: "Customer ID required" }, { status: 400 })
    }

    // Fetch reports from database
    const reports = await prisma.report.findMany({
      where: {
        customerId: customerId,
      },
      orderBy: {
        date: "desc",
      },
    })

    return NextResponse.json({ success: true, reports })
  } catch (error) {
    console.error("Error fetching reports:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
