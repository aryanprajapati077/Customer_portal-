import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendNotificationEmail } from "@/lib/send-notification-email"
import { sql } from "@/lib/db"

async function ensureSupportAttachmentColumn() {
  const g = globalThis as typeof globalThis & { __buffSupportAttach?: Promise<void> }
  if (!g.__buffSupportAttach) {
    g.__buffSupportAttach = sql
      .query(`ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "attachmentUrl" TEXT`)
      .then(() => undefined)
      .catch((err) => {
        g.__buffSupportAttach = undefined
        throw err
      })
  }
  await g.__buffSupportAttach
}

export async function GET(request: Request) {
  try {
    await ensureSupportAttachmentColumn()
    const { searchParams } = new URL(request.url)
    const inbox = String(searchParams.get("inbox") || "all").toLowerCase()
    const includeAttachment = searchParams.get("attachments") === "1"
    const take = Math.min(200, Math.max(20, Number(searchParams.get("take") || 100) || 100))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let where: any = {}
    if (inbox === "proposal") {
      where = {
        OR: [{ category: "proposal" }, { source: "impact-calculator" }, { source: "landing" }],
      }
    } else if (inbox === "contact") {
      where = { OR: [{ category: "contact" }, { source: "contact" }] }
    } else if (inbox === "support") {
      where = {
        AND: [
          { NOT: { category: "proposal" } },
          { NOT: { source: "impact-calculator" } },
          { NOT: { category: "contact" } },
          { NOT: { source: "contact" } },
        ],
      }
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
    })

    const rows = tickets as Array<(typeof tickets)[number] & { attachmentUrl?: string | null }>

    return NextResponse.json({
      success: true,
      tickets: rows.map((t) => ({
        id: t.id,
        name: t.name,
        email: t.email,
        subject: t.subject,
        message: t.message,
        category: t.category,
        status: t.status,
        source: t.source,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        attachmentUrl: includeAttachment ? t.attachmentUrl || null : null,
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
