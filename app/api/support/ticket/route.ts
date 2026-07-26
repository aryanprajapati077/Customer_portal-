import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"
import { sendNotificationEmail } from "@/lib/send-notification-email"

function mapStatus(status: string) {
  const s = (status || "").toLowerCase()
  if (s === "open") return "Open"
  if (s === "in_progress" || s === "in progress" || s === "processing") return "In Progress"
  if (s === "resolved" || s === "closed" || s === "done") return "Resolved"
  return status || "Open"
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = String(searchParams.get("email") || "")
      .trim()
      .toLowerCase()
    const customerId = String(searchParams.get("customerId") || "").trim()

    if (!email && !customerId) {
      return NextResponse.json({ error: "email or customerId required" }, { status: 400 })
    }

    const tickets = await prisma.supportTicket.findMany({
      where: email
        ? customerId
          ? { OR: [{ email: { equals: email, mode: "insensitive" } }, { customerId }] }
          : { email: { equals: email, mode: "insensitive" } }
        : { customerId },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return NextResponse.json({
      ok: true,
      tickets: tickets.map((t) => ({
        id: t.id,
        displayId: `#SUP-${t.id.slice(-4).toUpperCase()}`,
        subject: t.subject,
        status: mapStatus(t.status),
        createdAt: t.createdAt.toISOString(),
      })),
    })
  } catch (err) {
    console.error("Support tickets GET error:", err)
    return NextResponse.json({ error: "Failed to load tickets" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const subject = String(body.subject || "").trim()
    const message = String(body.message || "").trim()
    const category = String(body.category || "general").trim()
    const source = String(body.source || "web").trim()
    let name = String(body.name || "Portal User").trim()
    let email = String(body.email || "").trim()
    const customerId = body.customerId ? String(body.customerId) : null

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

    const ticket = await prisma.supportTicket.create({
      data: {
        customerId,
        name,
        email,
        subject,
        message,
        category,
        source,
        status: "open",
      },
    })

    const ticketId = ticket.id.slice(-8).toUpperCase()

    // Customer confirmation
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

    // Admin notify (simple text)
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
          subject: `[Support] ${subject}`,
          text: `New support ticket (#${ticketId})\n\nFrom: ${name} <${email}>\nCategory: ${category}\nSource: ${source}\n\n${message}`,
        })
        .catch(() => {})
    }

    return NextResponse.json({ ok: true, id: ticket.id })
  } catch (err) {
    console.error("Support ticket error:", err)
    return NextResponse.json({ error: "Failed to submit ticket" }, { status: 500 })
  }
}
