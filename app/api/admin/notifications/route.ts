import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { resend, getResendFrom } from "@/lib/resend"

export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get("customerId")
    const rows = customerId
      ? await sql`
          SELECT id, "customerId", title, body, "createdAt", "readAt"
          FROM "Notification"
          WHERE "customerId" = ${customerId}
          ORDER BY "createdAt" DESC
          LIMIT 200
        `
      : await sql`
          SELECT id, "customerId", title, body, "createdAt", "readAt"
          FROM "Notification"
          ORDER BY "createdAt" DESC
          LIMIT 200
        `
    return NextResponse.json({ success: true, notifications: rows })
  } catch (error) {
    console.error("Error fetching notifications (admin):", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const customerId = String(body?.customerId || "")
    const title = String(body?.title || "")
    const msg = body?.body ? String(body.body) : null
    const sendEmail = body?.sendEmail === true

    if (!customerId || !title) {
      return NextResponse.json({ success: false, error: "customerId and title required" }, { status: 400 })
    }

    const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const rows = await sql`
      INSERT INTO "Notification" (id, "customerId", title, body)
      VALUES (${id}, ${customerId}, ${title}, ${msg})
      RETURNING id, "customerId", title, body, "createdAt", "readAt"
    `

    if (sendEmail) {
      try {
        const customerRows = await sql`
          SELECT email, "companyName"
          FROM "Customer"
          WHERE id = ${customerId}
          LIMIT 1
        `
        const customer = customerRows?.[0] as any
        if (customer?.email && resend) {
          await resend.emails.send({
            from: getResendFrom(),
            to: customer.email,
            subject: title,
            text: msg || "",
            html: `
              <div style="font-family: ui-sans-serif, system-ui; line-height: 1.5">
                <h2 style="margin:0 0 12px 0;">${title}</h2>
                ${msg ? `<p style="margin:0 0 16px 0; white-space: pre-wrap;">${msg}</p>` : ""}
                <p style="margin:0; color:#666; font-size:12px;">Buffindia Customer Portal</p>
              </div>
            `,
          })
        }
      } catch (e) {
        console.error("Resend send error:", e)
      }
    }
    return NextResponse.json({ success: true, notification: rows?.[0] || null })
  } catch (error) {
    console.error("Error creating notification (admin):", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const id = String(body?.id || "")
    const markRead = body?.markRead === true
    if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 })

    const rows = await sql`
      UPDATE "Notification"
      SET "readAt" = CASE WHEN ${markRead} THEN CURRENT_TIMESTAMP ELSE NULL END
      WHERE id = ${id}
      RETURNING id, "customerId", title, body, "createdAt", "readAt"
    `
    return NextResponse.json({ success: true, notification: rows?.[0] || null })
  } catch (error) {
    console.error("Error updating notification (admin):", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

