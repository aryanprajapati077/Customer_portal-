import { type NextRequest, NextResponse } from "next/server"
import { generateImpactReportPdf } from "@/lib/generate-impact-report-pdf"
import { resolveCustomerScope } from "@/lib/customer-api-auth"

function displayCustomerId(
  sessionCustomerId: string,
  scopeIds: string[],
): string {
  return scopeIds.length === 1 ? scopeIds[0]! : sessionCustomerId
}

export async function GET(request: NextRequest) {
  try {
    const locationId = request.nextUrl.searchParams.get("locationId")
    const auth = await resolveCustomerScope(
      request.nextUrl.searchParams.get("customerId"),
      locationId,
    )
    if (!auth.ok) return auth.response

    const period = request.nextUrl.searchParams.get("period") || undefined
    const range = request.nextUrl.searchParams.get("range") || undefined
    const startDate = request.nextUrl.searchParams.get("startDate") || undefined
    const endDate = request.nextUrl.searchParams.get("endDate") || undefined

    const { pdfBuffer, filename } = await generateImpactReportPdf(
      displayCustomerId(auth.sessionCustomerId, auth.customerIds),
      {
        period,
        range,
        startDate,
        endDate,
        scopeCustomerIds: auth.customerIds,
      },
    )

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
      locationId?: string
      period?: string
      range?: string
      startDate?: string
      endDate?: string
    }

    const auth = await resolveCustomerScope(body.customerId || null, body.locationId || null)
    if (!auth.ok) return auth.response

    const { pdfBuffer, filename } = await generateImpactReportPdf(
      displayCustomerId(auth.sessionCustomerId, auth.customerIds),
      {
        period: body.period,
        range: body.range,
        startDate: body.startDate,
        endDate: body.endDate,
        scopeCustomerIds: auth.customerIds,
      },
    )

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
