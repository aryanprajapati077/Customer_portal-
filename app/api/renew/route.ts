import { type NextRequest, NextResponse } from "next/server"
import {
  ensureRenewalCtaPointsToPublicPage,
  recordRenewalInterest,
} from "@/lib/renewal-response"
import { clientIpFromRequest, consumeRateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    await ensureRenewalCtaPointsToPublicPage()
    const body = await request.json().catch(() => ({}))
    const customerId = String(body?.customerId || body?.c || "").trim().toUpperCase()
    if (!customerId) {
      return NextResponse.json({ success: false, error: "Missing customer id" }, { status: 400 })
    }

    const ip = clientIpFromRequest(request)
    const limited = consumeRateLimit(`renew:${ip}:${customerId}`, 8, 60_000)
    if (!limited.ok) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please wait a moment." },
        { status: 429 },
      )
    }

    const result = await recordRenewalInterest({
      customerId,
      source: String(body?.source || "renew_now_email"),
    })

    return NextResponse.json({
      success: true,
      created: result.created,
      customerId: result.customer.id,
      companyName: result.customer.companyName,
      message: "Our team will connect with you shortly.",
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Server error"
    const status = msg === "Customer not found" || msg === "Invalid customer" ? 404 : 500
    console.error("renew POST:", error)
    return NextResponse.json({ success: false, error: msg }, { status })
  }
}
