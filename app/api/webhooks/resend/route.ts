import { type NextRequest, NextResponse } from "next/server"
import {
  applyResendWebhookEvent,
  verifyResendWebhookSignature,
} from "@/lib/resend-webhook"

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    if (!verifyResendWebhookSignature(rawBody, request.headers)) {
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401 })
    }

    const payload = JSON.parse(rawBody || "{}") as Record<string, unknown>
    const type = String(payload?.type || payload?.event || "")
    const data = (payload?.data || payload) as Record<string, unknown>

    const resendId =
      String(data?.email_id || data?.id || data?.emailId || "").trim() || null
    const toList: string[] = Array.isArray(data?.to)
      ? data.to.map((t) => String(t).toLowerCase().trim())
      : data?.to
        ? [String(data.to).toLowerCase().trim()]
        : []
    const bounce = data?.bounce as { email?: string; message?: string } | undefined
    const email =
      String(bounce?.email || data?.email || toList[0] || "")
        .toLowerCase()
        .trim() || null
    const errorMsg =
      String(
        bounce?.message ||
          (data?.failed as { message?: string } | undefined)?.message ||
          data?.error ||
          data?.reason ||
          type,
      ) || null
    const eventId =
      request.headers.get("svix-id") ||
      String(payload?.id || "") ||
      `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    const result = await applyResendWebhookEvent({
      eventId,
      type,
      resendId,
      email,
      error: errorMsg,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("Resend webhook error:", error)
    return NextResponse.json({ success: false, error: "Webhook error" }, { status: 500 })
  }
}
