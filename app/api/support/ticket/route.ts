import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"

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

    const adminEmail = process.env.ADMIN_EMAIL || process.env.RESEND_FROM
    const resendKey = process.env.RESEND_API_KEY

    if (resendKey && adminEmail) {
      const resend = new Resend(resendKey)
      const from = process.env.RESEND_FROM || "Buffindia Portal <onboarding@resend.dev>"
      await resend.emails.send({
        from,
        to: adminEmail,
        replyTo: email,
        subject: `[Support] ${subject}`,
        text: `New support ticket (#${ticket.id.slice(-8)})\n\nFrom: ${name} <${email}>\nCategory: ${category}\nSource: ${source}\n\n${message}`,
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true, id: ticket.id })
  } catch (err) {
    console.error("Support ticket error:", err)
    return NextResponse.json({ error: "Failed to submit ticket" }, { status: 500 })
  }
}
