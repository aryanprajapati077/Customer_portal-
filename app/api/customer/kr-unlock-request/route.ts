import { NextResponse } from "next/server"
import { Resend } from "resend"
import { prisma } from "@/lib/prisma"
import { requireCustomerSession } from "@/lib/customer-api-auth"
import { sendNotificationEmail } from "@/lib/send-notification-email"
import {
  ensureKrCreditsLockColumns,
  isCustomerKrCreditsLocked,
  KR_UNLOCK_CATEGORY,
  KR_UNLOCK_SOURCE,
} from "@/lib/kr-credits-lock"

export async function POST() {
  try {
    const session = await requireCustomerSession()
    if (!session.ok) return session.response

    await ensureKrCreditsLockColumns()
    const customerId = session.customerId
    const locked = await isCustomerKrCreditsLocked(customerId)
    if (!locked) {
      return NextResponse.json({
        success: true,
        alreadyUnlocked: true,
        message: "KR credits are already unlocked.",
      })
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        email: true,
        companyName: true,
        contactPerson: true,
        kraftrebornCredits: true,
      },
    })
    if (!customer) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 })
    }

    const existing = await prisma.supportTicket.findFirst({
      where: {
        customerId,
        category: KR_UNLOCK_CATEGORY,
        status: { in: ["open", "in_progress"] },
      },
      orderBy: { createdAt: "desc" },
    })
    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyRequested: true,
        ticketId: existing.id,
        message: "We already received your unlock request. Our team will review it shortly.",
      })
    }

    const name = customer.contactPerson || customer.companyName || "Partner"
    const email = customer.email
    const balance = Math.floor(Number(customer.kraftrebornCredits) || 0)
    const subject = `KR unlock request – payment pending · ${customer.companyName}`
    const message = [
      `${name} from ${customer.companyName} (${customer.id}) reports that service payment is done and requests KR credits unlock.`,
      `Current KR balance: ₹${balance}`,
      `Please verify payment and unlock KR credits from Admin → KR Credits.`,
    ].join("\n")

    const ticket = await prisma.supportTicket.create({
      data: {
        customerId,
        name,
        email,
        subject,
        message,
        category: KR_UNLOCK_CATEGORY,
        source: KR_UNLOCK_SOURCE,
        status: "open",
      },
    })

    const ticketId = ticket.id.slice(-8).toUpperCase()

    await sendNotificationEmail({
      templateId: "support_ticket_received",
      to: email,
      vars: {
        name: name.split(" ")[0] || "Partner",
        ticketId,
        subject,
        category: "KR unlock",
        message: message.slice(0, 500),
      },
    }).catch((err) => console.error("KR unlock customer email failed:", err))

    const extractEmail = (raw?: string | null) => {
      const s = String(raw || "").trim()
      const angled = s.match(/<([^>]+)>/)
      const candidate = (angled?.[1] || s).trim().toLowerCase()
      return candidate.includes("@") ? candidate : ""
    }
    const notifyEmails = ["campaign@buffindia.com", "aryan@buffindia.com"]
    const adminEmail = extractEmail(process.env.ADMIN_EMAIL) || extractEmail(process.env.RESEND_FROM)
    // Always notify campaign + aryan; also include admin when configured.
    const recipients = [...notifyEmails, adminEmail]
      .filter(Boolean)
      .filter((addr, i, all) => all.findIndex((a) => a === addr) === i)

    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      const resend = new Resend(resendKey)
      const from = process.env.RESEND_FROM || "Buffindia Portal <onboarding@resend.dev>"
      const mailBody = {
        from,
        replyTo: email,
        subject: `[KR Unlock] ${customer.companyName} (${customer.id})`,
        text: `New KR credits unlock request (#${ticketId})\n\nFrom: ${name} <${email}>\nCustomer ID: ${customer.id}\nCompany: ${customer.companyName}\nKR balance: ₹${balance}\n\nCustomer says service payment is done and wants KR credits unlocked.\n\nOpen Admin → KR Support / Unlock Requests to review and unlock.\n\n${message}`,
      }
      // Always reach campaign@ and aryan@buffindia.com.
      await resend.emails
        .send({ ...mailBody, to: notifyEmails })
        .catch((err) => console.error("KR unlock notify email failed:", err))
      const extras = recipients.filter((addr) => !notifyEmails.includes(addr))
      if (extras.length) {
        await resend.emails
          .send({ ...mailBody, to: extras })
          .catch((err) => console.error("KR unlock admin email failed:", err))
      }
    }

    return NextResponse.json({
      success: true,
      ticketId: ticket.id,
      message: "Notification sent. Our team will unlock KR credits after payment confirmation.",
    })
  } catch (error) {
    console.error("kr-unlock-request POST:", error)
    return NextResponse.json({ success: false, error: "Could not send unlock request" }, { status: 500 })
  }
}
