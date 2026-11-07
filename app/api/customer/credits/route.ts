import { type NextRequest, NextResponse } from "next/server"
import { requireCustomerSession } from "@/lib/customer-api-auth"
import { sumKrCreditsForReadableScope } from "@/lib/group-customer-access"
import { ensureKrCreditsLockColumns, isCustomerKrCreditsLocked } from "@/lib/kr-credits-lock"

/** Lightweight live KR / rupee balance — polled by the portal for near-instant updates. */
export async function GET(request: NextRequest) {
  try {
    const session = await requireCustomerSession()
    if (!session.ok) return session.response

    await ensureKrCreditsLockColumns()
    const locationId = request.nextUrl.searchParams.get("locationId")
    const [kraftrebornCredits, krCreditsLocked] = await Promise.all([
      sumKrCreditsForReadableScope(session.customerId, locationId),
      isCustomerKrCreditsLocked(session.customerId),
    ])

    return NextResponse.json(
      {
        success: true,
        customerId: session.customerId,
        kraftrebornCredits,
        krCreditsLocked,
        fetchedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    )
  } catch (error) {
    console.error("customer credits GET:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
