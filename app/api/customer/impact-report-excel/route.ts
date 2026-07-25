import { type NextRequest, NextResponse } from "next/server"
import { generateImpactReportExcel } from "@/lib/generate-impact-report-excel"

export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get("customerId")
    const period = request.nextUrl.searchParams.get("period") || undefined

    if (!customerId) {
      return NextResponse.json({ success: false, error: "Customer ID required" }, { status: 400 })
    }

    const { buffer, filename } = await generateImpactReportExcel(customerId, { period })

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Error generating impact report Excel:", error)
    return NextResponse.json({ success: false, error: "Failed to generate Excel report" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      customerId?: string
      period?: string
    }

    if (!body.customerId) {
      return NextResponse.json({ success: false, error: "Customer ID required" }, { status: 400 })
    }

    const { buffer, filename } = await generateImpactReportExcel(body.customerId, {
      period: body.period,
    })

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Error generating impact report Excel:", error)
    return NextResponse.json({ success: false, error: "Failed to generate Excel report" }, { status: 500 })
  }
}
