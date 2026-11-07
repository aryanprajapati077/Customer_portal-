import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sql } from "@/lib/db"
import { requireAdminSession } from "@/lib/admin-auth-server"
import {
  ensureKrCreditsLockColumns,
  KR_UNLOCK_CATEGORY,
} from "@/lib/kr-credits-lock"
import { sendNotificationEmail } from "@/lib/send-notification-email"

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession(request)
    await ensureKrCreditsLockColumns()

    const status = String(request.nextUrl.searchParams.get("status") || "open").toLowerCase()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { category: KR_UNLOCK_CATEGORY }
    if (status === "open") {
      where.status = { in: ["open", "in_progress"] }
    } else if (status === "resolved") {
      where.status = { in: ["resolved", "closed"] }
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    })

    const customerIds = [...new Set(tickets.map((t) => t.customerId).filter(Boolean))] as string[]
    const customerRows =
      customerIds.length > 0
        ? await sql.query(
            `SELECT id, "companyName", email, "kraftrebornCredits",
                    COALESCE("krCreditsLocked", false) AS "krCreditsLocked"
             FROM "Customer" WHERE id = ANY($1)`,
            [customerIds],
          )
        : []
    const byId = new Map(
      (customerRows as Array<{
        id: string
        companyName: string
        email: string
        kraftrebornCredits: number
        krCreditsLocked: boolean
      }>).map((c) => [c.id, c]),
    )

    return NextResponse.json({
      success: true,
      requests: tickets.map((t) => {
        const c = t.customerId ? byId.get(t.customerId) : undefined
        return {
          id: t.id,
          customerId: t.customerId,
          name: t.name,
          email: t.email,
          subject: t.subject,
          message: t.message,
          status: t.status,
          createdAt: t.createdAt,
          companyName: c?.companyName || t.name,
          kraftrebornCredits: c?.kraftrebornCredits ?? null,
          krCreditsLocked: c?.krCreditsLocked ?? null,
        }
      }),
    })
  } catch (error) {
    console.error("kr-unlock-requests GET:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession(request)
    await ensureKrCreditsLockColumns()
    const body = await request.json()
    const customerId = String(body?.customerId || "").trim()
    const ticketId = body?.ticketId ? String(body.ticketId) : null
    const unlock = body?.unlock !== false

    if (!customerId) {
      return NextResponse.json({ success: false, error: "customerId required" }, { status: 400 })
    }

    if (unlock) {
      await sql`
        UPDATE "Customer"
        SET "krCreditsLocked" = false,
            "krCreditsLockedAt" = NULL,
            "krCreditsLockedReason" = NULL,
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = ${customerId}
      `
    }

    if (ticketId) {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: "resolved" },
      }).catch(() => null)
    } else {
      await prisma.supportTicket.updateMany({
        where: {
          customerId,
          category: KR_UNLOCK_CATEGORY,
          status: { in: ["open", "in_progress"] },
        },
        data: { status: "resolved" },
      })
    }

    if (unlock) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { email: true, contactPerson: true, companyName: true },
      })
      const to = String(customer?.email || "").toLowerCase().trim()
      if (to.includes("@")) {
        await sendNotificationEmail({
          templateId: "support_ticket_resolved",
          to,
          vars: {
            name: customer?.contactPerson?.split(" ")[0] || customer?.companyName || "Partner",
            ticketId: ticketId?.slice(-8).toUpperCase() || "KRUNLOCK",
            subject: "KR credits unlocked — you can redeem again",
          },
        }).catch((err) => console.error("KR unlock resolved email failed:", err))
      }
    }

    return NextResponse.json({
      success: true,
      unlocked: unlock,
      unlockedBy: session?.name || session?.email || "Admin",
    })
  } catch (error) {
    console.error("kr-unlock-requests POST:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
