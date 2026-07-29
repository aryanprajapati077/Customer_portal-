import { NextResponse } from "next/server"
import { requireCustomerSession } from "@/lib/customer-api-auth"
import { getGroupLocations, isGroupCustomer } from "@/lib/group-customer-access"

export async function GET() {
  try {
    const session = await requireCustomerSession()
    if (!session.ok) return session.response

    const isGroup = await isGroupCustomer(session.customerId)
    if (!isGroup) {
      return NextResponse.json({ success: true, isGroup: false, locations: [] })
    }

    const locations = await getGroupLocations(session.customerId)
    return NextResponse.json({
      success: true,
      isGroup: true,
      locations,
    })
  } catch (error) {
    console.error("Group locations error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
