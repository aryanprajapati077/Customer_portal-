import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get("customerId")

    if (!customerId) {
      return NextResponse.json({ success: false, error: "Customer ID required" }, { status: 400 })
    }

    const result = await sql`
      SELECT * FROM "Customer"
      WHERE id = ${customerId}
      LIMIT 1
    `

    const customer = result?.[0]
    if (!customer) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 })
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...customerData } = customer as any

    return NextResponse.json({
      success: true,
      customer: {
        ...customerData,
        disposalUnitInstalled: customerData.disposalUnitInstalled ?? 0,
        totalWasteCollected: customerData.totalWasteCollected || 0,
        kraftrebornCredits: customerData.kraftrebornCredits || 0,
        isGroup: customerData.isGroup ?? false,
        parentCustomerId: customerData.parentCustomerId ?? null,
      },
    })
  } catch (error) {
    console.error("Error fetching customer profile:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

