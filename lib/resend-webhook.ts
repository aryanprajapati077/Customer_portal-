import crypto from "crypto"
import { sql } from "@/lib/db"
import {
  ensureEmailDeliveryLogTable,
  logEmailDelivery,
  markEmailDeliveryByAddress,
  markEmailDeliveryByResendId,
  type EmailDeliveryStatus,
} from "@/lib/email-delivery-log"

export const RESEND_EVENT_STATUS: Record<string, EmailDeliveryStatus> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.failed": "failed",
  "email.received": "received",
  "email.delivery_delayed": "delayed",
}

export function mapResendEventType(type: string): EmailDeliveryStatus | null {
  const key = String(type || "").trim().toLowerCase()
  if (RESEND_EVENT_STATUS[key]) return RESEND_EVENT_STATUS[key]
  if (key.includes("bounced")) return "bounced"
  if (key.includes("complained")) return "complained"
  if (key.includes("clicked")) return "clicked"
  if (key.includes("opened")) return "opened"
  if (key.includes("delivered")) return "delivered"
  if (key.includes("received")) return "received"
  if (key.includes("delayed")) return "delayed"
  if (key.includes("failed")) return "failed"
  if (key.endsWith(".sent") || key === "sent") return "sent"
  return null
}

/** Verify Resend/Svix webhook signatures when RESEND_WEBHOOK_SECRET is set. */
export function verifyResendWebhookSignature(rawBody: string, headers: Headers): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim()
  if (!secret) return true
  const msgId = headers.get("svix-id") || headers.get("webhook-id") || ""
  const timestamp = headers.get("svix-timestamp") || headers.get("webhook-timestamp") || ""
  const signatureHeader = headers.get("svix-signature") || headers.get("webhook-signature") || ""
  if (!msgId || !timestamp || !signatureHeader) return false
  const age = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (!Number.isFinite(age) || age > 60 * 5) return false

  const secretPart = secret.startsWith("whsec_") ? secret.slice(6) : secret
  const key = Buffer.from(secretPart, "base64")
  const toSign = `${msgId}.${timestamp}.${rawBody}`
  const digest = crypto.createHmac("sha256", key).update(toSign).digest("base64")
  const expected = `v1,${digest}`
  return signatureHeader.split(" ").some((part) => {
    const given = part.trim()
    if (given.length !== expected.length) return false
    try {
      return crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected))
    } catch {
      return false
    }
  })
}

export async function applyResendWebhookEvent(input: {
  eventId: string
  type: string
  resendId: string | null
  email: string | null
  error?: string | null
}) {
  await ensureEmailDeliveryLogTable()
  const status = mapResendEventType(input.type)
  if (!status) return { ignored: true as const, type: input.type }

  const eventId = input.eventId || `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  const inserted = await sql`
    INSERT INTO "EmailDeliveryEvent" (id, "resendId", email, type, status, error)
    VALUES (
      ${eventId},
      ${input.resendId},
      ${input.email},
      ${input.type},
      ${status},
      ${input.error || null}
    )
    ON CONFLICT (id) DO NOTHING
    RETURNING id
  `
  if (!inserted[0]) return { duplicate: true as const, status }

  let updated = 0
  if (input.resendId) {
    updated = await markEmailDeliveryByResendId(input.resendId, status, input.error)
  }

  const problem = status === "bounced" || status === "failed" || status === "complained"
  if (!updated && problem && input.email) {
    updated = await markEmailDeliveryByAddress(input.email, status, input.error)
  }

  if (!updated && input.email) {
    const customer = await sql`
      SELECT id, "companyName" FROM "Customer"
      WHERE lower(email) = ${input.email}
         OR lower(COALESCE("primaryPocEmail", '')) = ${input.email}
      LIMIT 1
    `
    const row = customer[0] as { id?: string; companyName?: string } | undefined
    await logEmailDelivery({
      customerId: row?.id || null,
      email: input.email,
      emailRole: "to",
      kind: status === "received" ? "inbound" : "esg_report",
      status,
      error: input.error || null,
      resendId: input.resendId,
      companyName: row?.companyName || null,
    })
  }

  return { success: true as const, status, eventId }
}
