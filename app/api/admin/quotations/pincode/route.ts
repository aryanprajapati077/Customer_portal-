import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/admin-auth-server"

/** Pincode → city/state via India Post (public API). */
export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  const pin = (request.nextUrl.searchParams.get("pincode") || "").replace(/\D/g, "")
  if (pin.length !== 6) return NextResponse.json({ success: false, error: "Pincode must be 6 digits" }, { status: 400 })
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, { cache: "no-store", signal: AbortSignal.timeout(10_000) })
    const j = (await res.json()) as { Status?: string; PostOffice?: { District?: string; State?: string; Name?: string }[] }[]
    const po = j?.[0]?.PostOffice?.[0]
    if (!po) return NextResponse.json({ success: false, error: "Pincode not found" }, { status: 404 })
    return NextResponse.json({ success: true, city: po.District || po.Name || "", state: po.State || "" })
  } catch {
    return NextResponse.json({ success: false, error: "Pincode lookup failed" }, { status: 502 })
  }
}
