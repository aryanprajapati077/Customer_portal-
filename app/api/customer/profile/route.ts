import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { resolveCustomerId } from "@/lib/customer-api-auth"
import { getGroupLocations } from "@/lib/group-customer-access"

/** Safe portal profile fields — never select password or secrets. */
const PROFILE_SELECT = `
  id, email, "companyName", "tradeName", city, state, gstin, "logoUrl",
  "lsuName", "lsuTechnicianName", "operationsIncharge",
  "contactPerson", "primaryPocName", "primaryPocEmail", "primaryPocNumber", "primaryPocDesignation",
  phone, address, status, "serviceStatus", "serviceStartDate", "contractEndDate",
  "collectionFrequency", "collectionPocs",
  "noOfKiosk", "noOfBasicKiosk", "noOfAdvanceKiosk", "noOfPanVendorKiosk", "noOfWallMountKiosk",
  "totalWasteCollected", "cigaretteButtsCollected", "microplasticsUpcycled",
  "waterResourcesProtected", "pendingCollection", "certificatesEarned",
  "co2Saved", "kraftrebornCredits", "treesEquivalent", "monthlyTarget",
  "disposalUnitInstalled", "joinDate", "lastCollection", industry, "employeeCount",
  "isGroup", "parentCustomerId", "updatedAt"
`

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveCustomerId(request.nextUrl.searchParams.get("customerId"))
    if (!auth.ok) return auth.response
    const customerId = auth.customerId

    const result = await sql.query(
      `SELECT ${PROFILE_SELECT} FROM "Customer" WHERE id = $1 LIMIT 1`,
      [customerId],
    )

    const customer = result?.[0]
    if (!customer) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 })
    }

    const customerData = customer as Record<string, unknown>
    const isGroup = Boolean(customerData.isGroup)
    const groupLocations = isGroup ? await getGroupLocations(customerId) : []

    // Prefer primary POC name for greeting when contactPerson is missing/title-only
    const contactPerson =
      String(customerData.contactPerson || customerData.primaryPocName || "").trim() || null

    return NextResponse.json({
      success: true,
      customer: {
        ...customerData,
        contactPerson,
        primaryPocName: customerData.primaryPocName ?? contactPerson,
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
