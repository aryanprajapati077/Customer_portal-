import { type NextRequest, NextResponse } from "next/server"
import {
  ensureEmailDeliveryLogTable,
  markEmailDeliveryByAddress,
  markEmailDeliveryByResendId,
  logEmailDelivery,
} from "@/lib/email-delivery-log"
import { sql } from "@/lib/db"

/**
 * Resend webhook receiver for bounce / complaint / failed / delivered events.
 * Configure in Resend dashboard → Webhooks → this URL.
 * Optional: set RESEND_WEBHOOK_SECRET and verify in production later.
 */
export async function POST(request: NextRequest) {
  try {
    await ensureEmailDeliveryLogTable()
    const payload = await request.json()
    const type = String(payload?.type || payload?.event || "")
    const data = payload?.data || payload

    const resendId =
      String(data?.email_id || data?.id || data?.emailId || "").trim() || null
    const toList: string[] = Array.isArray(data?.to)
      ? data.to.map((t: unknown) => String(t).toLowerCase().trim())
      : data?.to
        ? [String(data.to).toLowerCase().trim()]
        : []
    const bounceEmail =
      String(data?.bounce?.email || data?.email || toList[0] || "")
        .toLowerCase()
        .trim() || null
    const errorMsg =
      String(
        data?.bounce?.message ||
          data?.failed?.message ||
          data?.error ||
          data?.reason ||
          type,
      ) || null

    let status: "bounced" | "complained" | "failed" | "delivered" | null = null
    if (type.includes("bounced") || type === "email.bounced") status = "bounced"
    else if (type.includes("complained") || type === "email.complained") status = "complained"
    else if (type.includes("failed") || type === "email.failed") status = "failed"
    else if (type.includes("delivered") || type === "email.delivered") status = "delivered"

    if (!status) {
      return NextResponse.json({ success: true, ignored: true, type })
    }

    if (resendId) {
      await markEmailDeliveryByResendId(resendId, status, errorMsg)
    }
    if (bounceEmail) {
      await markEmailDeliveryByAddress(bounceEmail, status, errorMsg)

      // Ensure there is at least one open problem row for this bounce
      if (status === "bounced" || status === "failed" || status === "complained") {
        const existing = await sql`
          SELECT id FROM "EmailDeliveryLog"
          WHERE lower(email) = ${bounceEmail}
            AND "resolvedAt" IS NULL
            AND status = ${status}
          LIMIT 1
        `
        if (!existing[0]) {
          const customer = await sql`
            SELECT id, "companyName" FROM "Customer"
            WHERE lower(email) = ${bounceEmail}
               OR lower(COALESCE("primaryPocEmail", '')) = ${bounceEmail}
            LIMIT 1
          `
          const row = customer[0] as { id?: string; companyName?: string } | undefined
          await logEmailDelivery({
            customerId: row?.id || null,
            email: bounceEmail,
            emailRole: "to",
            kind: "esg_report",
            status,
            error: errorMsg,
            resendId,
            companyName: row?.companyName || null,
          })
        }
      }
    }

    return NextResponse.json({ success: true, status, email: bounceEmail, resendId })
  } catch (error) {
    console.error("Resend webhook error:", error)
    return NextResponse.json({ success: false, error: "Webhook error" }, { status: 500 })
  }
}
