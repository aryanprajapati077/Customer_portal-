import { type NextRequest, NextResponse } from "next/server"
import { generateLocationWiseExcel, NotGroupClientError } from "@/lib/generate-location-wise-excel"
import { resolveCustomerId } from "@/lib/customer-api-auth"

/** Location-wise monthly collection matrix — group clients only, always the whole group. */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      customerId?: string
      period?: string
      range?: string
      startDate?: string
      endDate?: string
    }

    const auth = await resolveCustomerId(body.customerId || null)
    if (!auth.ok) return auth.response

    const { buffer, filename } = await generateLocationWiseExcel(auth.customerId, {
      period: body.period,
      range: body.range,
      startDate: body.startDate,
      endDate: body.endDate,
    })

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    if (error instanceof NotGroupClientError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    console.error("Error generating location-wise Excel:", error)
    return NextResponse.json(
      { success: false, error: "Failed to generate location-wise report" },
      { status: 500 },
    )
  }
}
