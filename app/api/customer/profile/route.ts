import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { resolveCustomerId } from "@/lib/customer-api-auth"
import { getGroupLocations } from "@/lib/group-customer-access"

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveCustomerId(request.nextUrl.searchParams.get("customerId"))
    if (!auth.ok) return auth.response
    const customerId = auth.customerId

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
    const { password: _, ...customerData } = customer as Record<string, unknown>

    const isGroup = Boolean(customerData.isGroup)
    const groupLocations = isGroup ? await getGroupLocations(customerId) : []

    return NextResponse.json({
      success: true,
      customer: {
        ...customerData,
        disposalUnitInstalled: customerData.disposalUnitInstalled ?? 0,
        totalWasteCollected: customerData.totalWasteCollected || 0,
        kraftrebornCredits: customerData.kraftrebornCredits || 0,
        isGroup,
        parentCustomerId: customerData.parentCustomerId ?? null,
        groupLocations,
      },
    })
  } catch (error) {
    console.error("Error fetching customer profile:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

