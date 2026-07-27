import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendNotificationEmail } from "@/lib/send-notification-email"
import { sql } from "@/lib/db"

async function ensureSupportAttachmentColumn() {
  await sql.query(`ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "attachmentUrl" TEXT`)
}

export async function GET() {
  try {
    await ensureSupportAttachmentColumn()
    const tickets = await prisma.supportTicket.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    })
    const rows = tickets as Array<(typeof tickets)[number] & { attachmentUrl?: string | null }>
    return NextResponse.json({
      success: true,
      tickets: rows.map((t) => ({
        ...t,
        attachmentUrl: t.attachmentUrl || null,
      })),
    })
  } catch (err) {
    console.error("Admin support tickets error:", err)
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const id = String(body.id || "")
    const status = String(body.status || "")

    if (!id || !["open", "resolved"].includes(status)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const prev = await prisma.supportTicket.findUnique({ where: { id } })
    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: { status },
    })

    if (
      status === "resolved" &&
      prev?.status !== "resolved" &&
      ticket.email &&
      ticket.category !== "proposal" &&
      ticket.source !== "impact-calculator" &&
      ticket.category !== "contact" &&
      ticket.source !== "contact"
    ) {
      await sendNotificationEmail({
        templateId: "support_ticket_resolved",
        to: ticket.email,
        vars: {
          name: (ticket.name || "Partner").split(" ")[0],
          ticketId: ticket.id.slice(-8).toUpperCase(),
          subject: ticket.subject,
        },
      }).catch((err) => console.error("Support resolved email failed:", err))
    }

    return NextResponse.json({ success: true, ticket })
  } catch (err) {
    console.error("Admin support update error:", err)
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 })
  }
}
