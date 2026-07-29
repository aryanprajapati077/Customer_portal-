import { type NextRequest, NextResponse } from "next/server"
import { generateImpactReportPdf } from "@/lib/generate-impact-report-pdf"
import { resolveCustomerId } from "@/lib/customer-api-auth"

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveCustomerId(request.nextUrl.searchParams.get("customerId"))
    if (!auth.ok) return auth.response
    const customerId = auth.customerId
    const period = request.nextUrl.searchParams.get("period") || undefined
    const range = request.nextUrl.searchParams.get("range") || undefined
    const startDate = request.nextUrl.searchParams.get("startDate") || undefined
    const endDate = request.nextUrl.searchParams.get("endDate") || undefined

    const { pdfBuffer, filename } = await generateImpactReportPdf(customerId, {
      period,
      range,
      startDate,
      endDate,
    })

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Error generating impact report PDF:", error)
    return NextResponse.json({ success: false, error: "Failed to generate report" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      customerId?: string
      period?: string
      range?: string
      startDate?: string
      endDate?: string
    }

    if (!body.customerId) {
      return NextResponse.json({ success: false, error: "Customer ID required" }, { status: 400 })
    }

    const { pdfBuffer, filename } = await generateImpactReportPdf(body.customerId, {
      period: body.period,
      range: body.range,
      startDate: body.startDate,
      endDate: body.endDate,
    })

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Error generating impact report PDF:", error)
    return NextResponse.json({ success: false, error: "Failed to generate report" }, { status: 500 })
  }
}
