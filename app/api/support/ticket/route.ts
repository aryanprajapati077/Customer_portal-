import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"
import { sendNotificationEmail } from "@/lib/send-notification-email"
import { sql } from "@/lib/db"
import { saveBase64File, saveBase64Image } from "@/lib/upload"

function mapStatus(status: string) {
  const s = (status || "").toLowerCase()
  if (s === "open") return "Open"
  if (s === "in_progress" || s === "in progress" || s === "processing") return "In Progress"
  if (s === "resolved" || s === "closed" || s === "done") return "Resolved"
  return status || "Open"
}

async function ensureSupportAttachmentColumn() {
  await sql.query(`ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "attachmentUrl" TEXT`)
}

export async function GET(request: Request) {
  try {
    await ensureSupportAttachmentColumn()
    const { requireCustomerSession } = await import("@/lib/customer-api-auth")
    const session = await requireCustomerSession()
    if (!session.ok) return session.response

    const { searchParams } = new URL(request.url)
    const email = String(searchParams.get("email") || "")
      .trim()
      .toLowerCase()
    const customerId = session.customerId

    const tickets = await prisma.supportTicket.findMany({
      where: email
        ? { OR: [{ email: { equals: email, mode: "insensitive" } }, { customerId }] }
        : { customerId },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    // attachmentUrl may exist in DB even if older Prisma client types omit it
    const withAttachments = tickets as Array<(typeof tickets)[number] & { attachmentUrl?: string | null }>

    return NextResponse.json({
      ok: true,
      tickets: withAttachments.map((t) => ({
        id: t.id,
        displayId: `#SUP-${t.id.slice(-4).toUpperCase()}`,
        subject: t.subject,
        status: mapStatus(t.status),
        createdAt: t.createdAt.toISOString(),
        attachmentUrl: t.attachmentUrl || null,
      })),
    })
  } catch (err) {
    console.error("Support tickets GET error:", err)
    return NextResponse.json({ error: "Failed to load tickets" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await ensureSupportAttachmentColumn()
    const body = await request.json()
    const subject = String(body.subject || "").trim()
    const message = String(body.message || "").trim()
    const category = String(body.category || "general").trim()
    const source = String(body.source || "web").trim()
    let name = String(body.name || "Portal User").trim()
    let email = String(body.email || "").trim()
    const customerId = body.customerId ? String(body.customerId) : null
    const attachmentBase64 = body.attachmentBase64 ? String(body.attachmentBase64) : ""
    const attachmentName = body.attachmentName ? String(body.attachmentName) : "attachment"

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 })
    }

    if (customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { email: true, contactPerson: true, companyName: true },
      })
      if (customer) {
        if (!email) email = customer.email
        if (name === "Portal User") name = customer.contactPerson || customer.companyName
      }
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    let attachmentUrl: string | null = null
    if (attachmentBase64.startsWith("data:")) {
      try {
        if (attachmentBase64.startsWith("data:image/")) {
          const saved = await saveBase64Image(attachmentBase64, "attachments", `ticket-${Date.now()}`)
          attachmentUrl = saved.url
        } else {
          const saved = await saveBase64File(attachmentBase64, "attachments", `ticket-${Date.now()}`)
          attachmentUrl = saved.url
        }
      } catch (err) {
        console.error("Ticket attachment save failed:", err)
        attachmentUrl = attachmentBase64.length > 900_000 ? attachmentBase64.slice(0, 900_000) : attachmentBase64
      }
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        customerId,
        name,
        email,
        subject,
        message: attachmentUrl
          ? `${message}\n\n[Attachment: ${attachmentName}]`
          : message,
        category,
        source,
        status: "open",
      },
    })

    if (attachmentUrl) {
      await sql.query(`UPDATE "SupportTicket" SET "attachmentUrl" = $1 WHERE id = $2`, [
        attachmentUrl,
        ticket.id,
      ])
    }

    const ticketId = ticket.id.slice(-8).toUpperCase()

    await sendNotificationEmail({
      templateId: "support_ticket_received",
      to: email,
      vars: {
        name: name.split(" ")[0] || "Partner",
        ticketId,
        subject,
        category,
        message: message.slice(0, 500),
      },
    }).catch((err) => console.error("Support received email failed:", err))

    const adminEmail = process.env.ADMIN_EMAIL || process.env.RESEND_FROM
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey && adminEmail) {
      const resend = new Resend(resendKey)
      const from = process.env.RESEND_FROM || "Buffindia Portal <onboarding@resend.dev>"
      await resend.emails
        .send({
          from,
          to: adminEmail,
          replyTo: email,
          subject: source === "contact" ? `[Contact] ${subject}` : `[Support] ${subject}`,
          text: `New support ticket (#${ticketId})\n\nFrom: ${name} <${email}>\nCategory: ${category}\nSource: ${source}\nAttachment: ${attachmentUrl ? "Yes" : "No"}\n\n${message}`,
        })
        .catch(() => {})
    }

    return NextResponse.json({ ok: true, id: ticket.id })
  } catch (err) {
    console.error("Support ticket error:", err)
    return NextResponse.json({ error: "Failed to submit ticket" }, { status: 500 })
  }
}
