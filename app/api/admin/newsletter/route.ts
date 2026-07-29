import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { resend, getResendFrom } from "@/lib/resend"
import {
  emailSupporterFooterHtml,
  emailSupporterFooterText,
} from "@/lib/email-supporter-footer"
import { ensureEmailDeliveryLogTable, logEmailDelivery } from "@/lib/email-delivery-log"

export async function GET() {
  try {
    await ensureEmailDeliveryLogTable()
    const rows = await sql`
      SELECT id, email, "companyName", status, error, "createdAt"
      FROM "EmailDeliveryLog"
      WHERE kind = 'newsletter'
      ORDER BY "createdAt" DESC
      LIMIT 100
    `
    return NextResponse.json({ success: true, sends: rows })
  } catch (error) {
    console.error("Newsletter history error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const subject = String(body?.subject || "").trim()
    const htmlBody = String(body?.htmlBody || "").trim()
    const textBody = body?.textBody ? String(body.textBody).trim() : ""
    const sendToAll = body?.sendToAll === true
    const customerIds = Array.isArray(body?.customerIds)
      ? body.customerIds.map((id: unknown) => String(id)).filter(Boolean)
      : []

    if (!subject || !htmlBody) {
      return NextResponse.json({ success: false, error: "subject and htmlBody required" }, { status: 400 })
    }
    if (!sendToAll && customerIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Select customers or enable send to all" },
        { status: 400 },
      )
    }
    if (!resend) {
      return NextResponse.json({ success: false, error: "Email service not configured" }, { status: 503 })
    }

    await ensureEmailDeliveryLogTable()

    const recipients = sendToAll
      ? ((await sql`
          SELECT id, email, "companyName", "primaryPocEmail"
          FROM "Customer"
          WHERE status = 'active' OR status IS NULL
        `) as { id: string; email: string; companyName: string; primaryPocEmail: string | null }[])
      : ((await sql.query(
          `SELECT id, email, "companyName", "primaryPocEmail"
           FROM "Customer"
           WHERE id = ANY($1::text[])`,
          [customerIds],
        )) as { id: string; email: string; companyName: string; primaryPocEmail: string | null }[])

    let sent = 0
    let failed = 0
    const errors: string[] = []

    for (const customer of recipients) {
      const to = String(customer.primaryPocEmail || customer.email || "")
        .toLowerCase()
        .trim()
      if (!to.includes("@")) {
        failed++
        continue
      }

      try {
        const result = await resend.emails.send({
          from: getResendFrom(),
          to,
          subject,
          text: `${textBody || htmlBody.replace(/<[^>]+>/g, "")}\n\n${emailSupporterFooterText()}`,
          html: `
            <div style="font-family: ui-sans-serif, system-ui; line-height: 1.6; max-width: 640px; color: #141414;">
              ${htmlBody}
              ${emailSupporterFooterHtml()}
            </div>
          `,
        })
        await logEmailDelivery({
          customerId: customer.id,
          email: to,
          emailRole: "to",
          kind: "newsletter",
          status: "sent",
          resendId: result.data?.id || null,
          companyName: customer.companyName,
        })
        sent++
      } catch (e) {
        failed++
        const msg = e instanceof Error ? e.message : "Send failed"
        errors.push(`${customer.companyName}: ${msg}`)
        await logEmailDelivery({
          customerId: customer.id,
          email: to,
          emailRole: "to",
          kind: "newsletter",
          status: "failed",
          error: msg,
          companyName: customer.companyName,
        })
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: recipients.length,
      errors: errors.slice(0, 10),
    })
  } catch (error) {
    console.error("Newsletter send error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
