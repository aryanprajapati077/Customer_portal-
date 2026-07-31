import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sql } from "@/lib/db"
import { computeKraftRebornImpact } from "@/lib/kraftreborn"
import { generateKraftRebornCertificatePdf } from "@/lib/generate-kraftreborn-certificate-pdf"
import { syncKraftRebornCertificate } from "@/lib/sync-certificates"

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status")

    const orders = await prisma.shopOrder.findMany({
      where: status && status !== "all" ? { status } : undefined,
      include: {
        items: true,
        customer: {
          select: {
            id: true,
            companyName: true,
            email: true,
            contactPerson: true,
            kraftrebornCredits: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return NextResponse.json({
      success: true,
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        subtotal: o.subtotal,
        useKrCredits: o.useKrCredits,
        creditsDeducted: o.creditsDeducted,
        logoRequested: o.logoRequested,
        logoUrl: o.logoUrl,
        notes: o.notes,
        createdAt: o.createdAt.toISOString(),
        completedAt: o.completedAt?.toISOString() || null,
        customer: o.customer,
        items: o.items,
        itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
      })),
    })
  } catch (error) {
    console.error("Admin orders GET error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

async function completeOrder(orderId: string) {
  const order = await prisma.shopOrder.findUnique({
    where: { id: orderId },
    include: { items: true, customer: true },
  })
  if (!order) throw new Error("Order not found")
  if (order.status === "completed") return { alreadyCompleted: true }
  if (order.status === "cancelled") throw new Error("Cannot complete cancelled order")

  if (order.useKrCredits && !order.creditsDeducted) {
    // Atomic claim before deducting — never deduct after cancel has won
    const debitClaim = await prisma.shopOrder.updateMany({
      where: {
        id: orderId,
        useKrCredits: true,
        creditsDeducted: false,
        status: { notIn: ["cancelled", "completed"] },
      },
      data: { creditsDeducted: true },
    })
    if (debitClaim.count > 0) {
      let debited = false
      try {
        const deducted = await sql.query<{ id: string }>(
          `UPDATE "Customer"
           SET "kraftrebornCredits" = "kraftrebornCredits" - $1,
               "updatedAt" = CURRENT_TIMESTAMP
           WHERE id = $2 AND "kraftrebornCredits" >= $1
           RETURNING id`,
          [order.subtotal, order.customerId],
        )
        debited = deducted.length > 0
      } catch (err) {
        await prisma.shopOrder
          .updateMany({
            where: { id: orderId, creditsDeducted: true },
            data: { creditsDeducted: false },
          })
          .catch(() => {})
        throw err
      }
      if (!debited) {
        await prisma.shopOrder.updateMany({
          where: { id: orderId, creditsDeducted: true },
          data: { creditsDeducted: false },
        })
        throw new Error(`Customer has insufficient credits (need ₹${order.subtotal})`)
      }
    }
  }

  const productCount = order.items.reduce((s, i) => s + i.quantity, 0)
  const contactName = order.customer.contactPerson?.split(" ")[0] || order.customer.companyName
  const impact = computeKraftRebornImpact(order.subtotal, productCount)

  await syncKraftRebornCertificate(order.customerId, {
    orderId: order.orderNumber,
    contactName,
    butts: impact.butts,
    soilSqFt: impact.soilSqFt,
    waterLitres: impact.waterLitres,
    productCount: impact.productCount,
  })

  await generateKraftRebornCertificatePdf({
    contactName,
    orderId: order.orderNumber,
    orderAmountRupees: order.subtotal,
    productCount,
  })

  await prisma.notification.create({
    data: {
      id: `notif_order_done_${order.customerId}_${Date.now()}`,
      customerId: order.customerId,
      title: "Order completed",
      body: `Order ${order.orderNumber} is complete.${
        order.useKrCredits ? ` ₹${order.subtotal} KR credits were applied.` : ""
      } Your impact certificate is ready in Certificates.`,
    },
  }).catch(() => {})

  const finished = await prisma.shopOrder.updateMany({
    where: {
      id: orderId,
      status: { notIn: ["cancelled", "completed"] },
    },
    data: {
      status: "completed",
      creditsDeducted: order.useKrCredits ? true : order.creditsDeducted,
      completedAt: new Date(),
    },
  })
  if (finished.count === 0) {
    throw new Error("Cannot complete cancelled order")
  }

  return { completed: true, impact }
}

async function refundCreditsAfterCancel(orderId: string) {
  // Claim refund atomically — only one concurrent cancel can clear creditsDeducted
  const claimed = await prisma.shopOrder.updateMany({
    where: {
      id: orderId,
      useKrCredits: true,
      creditsDeducted: true,
      status: "cancelled",
    },
    data: { creditsDeducted: false },
  })
  if (claimed.count === 0) return

  const order = await prisma.shopOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      customerId: true,
      subtotal: true,
      orderNumber: true,
    },
  })
  if (!order) return

  try {
    await sql`
      UPDATE "Customer"
      SET "kraftrebornCredits" = "kraftrebornCredits" + ${order.subtotal},
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${order.customerId}
    `
  } catch (err) {
    // Restore flag so a retry can refund later
    await prisma.shopOrder
      .updateMany({
        where: { id: orderId, creditsDeducted: false, useKrCredits: true },
        data: { creditsDeducted: true },
      })
      .catch(() => {})
    throw err
  }

  await prisma.notification.create({
    data: {
      id: `notif_order_refund_${order.customerId}_${Date.now()}`,
      customerId: order.customerId,
      title: "Order cancelled — credits restored",
      body: `Order ${order.orderNumber} was cancelled. ₹${order.subtotal} KR credits were returned to your balance.`,
    },
  }).catch(() => {})
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const id = String(body?.id || "")
    const status = body?.status ? String(body.status) : null

    if (!id) {
      return NextResponse.json({ success: false, error: "id required" }, { status: 400 })
    }

    if (status === "completed") {
      const result = await completeOrder(id)
      const order = await prisma.shopOrder.findUnique({
        where: { id },
        include: {
          items: true,
          customer: {
            select: { id: true, companyName: true, email: true, contactPerson: true },
          },
        },
      })
      if (order?.customer?.email) {
        const itemSummary = order.items
          .map((i) => `${i.productName} × ${i.quantity}`)
          .join(", ")
        const { sendNotificationEmail } = await import("@/lib/send-notification-email")
        await sendNotificationEmail({
          templateId: "kraftreborn_delivered",
          to: order.customer.email,
          vars: {
            name: order.customer.contactPerson?.split(" ")[0] || order.customer.companyName,
            company: order.customer.companyName,
            orderNumber: order.orderNumber,
            itemSummary: itemSummary || "Your KraftReborn products",
          },
        }).catch((err) => console.error("Delivered email failed:", err))
      }
      return NextResponse.json({ success: true, order, ...result })
    }

    const prev = await prisma.shopOrder.findUnique({
      where: { id },
      select: { status: true, useKrCredits: true, creditsDeducted: true },
    })

    if (status === "cancelled") {
      const prevStatus = String(prev?.status || "").toLowerCase()
      if (prevStatus === "completed") {
        return NextResponse.json(
          { success: false, error: "Cannot cancel a completed order" },
          { status: 400 },
        )
      }
      if (prevStatus !== "cancelled") {
        const cancelled = await prisma.shopOrder.updateMany({
          where: {
            id,
            status: { notIn: ["cancelled", "completed"] },
          },
          data: { status: "cancelled" },
        })
        if (cancelled.count > 0) {
          await refundCreditsAfterCancel(id)
        }
      }

      const order = await prisma.shopOrder.update({
        where: { id },
        data: {
          notes: body.notes !== undefined ? String(body.notes) : undefined,
        },
        include: {
          items: true,
          customer: {
            select: { id: true, companyName: true, email: true, contactPerson: true },
          },
        },
      })
      return NextResponse.json({ success: true, order })
    }

    const order = await prisma.shopOrder.update({
      where: { id },
      data: {
        status: status || undefined,
        notes: body.notes !== undefined ? String(body.notes) : undefined,
      },
      include: {
        items: true,
        customer: {
          select: { id: true, companyName: true, email: true, contactPerson: true },
        },
      },
    })

    const nextStatus = String(order.status || "").toLowerCase()
    const prevStatus = String(prev?.status || "").toLowerCase()
    if (
      order.customer?.email &&
      nextStatus !== prevStatus &&
      (nextStatus === "shipped" || nextStatus === "dispatched")
    ) {
      const itemSummary = order.items.map((i) => `${i.productName} × ${i.quantity}`).join(", ")
      const { sendNotificationEmail } = await import("@/lib/send-notification-email")
      await sendNotificationEmail({
        templateId: "kraftreborn_dispatched",
        to: order.customer.email,
        vars: {
          name: order.customer.contactPerson?.split(" ")[0] || order.customer.companyName,
          company: order.customer.companyName,
          orderNumber: order.orderNumber,
          itemSummary: itemSummary || "Your KraftReborn products",
        },
      }).catch((err) => console.error("Dispatched email failed:", err))
    }

    if (
      order.customer?.email &&
      nextStatus !== prevStatus &&
      nextStatus === "delivered"
    ) {
      const itemSummary = order.items.map((i) => `${i.productName} × ${i.quantity}`).join(", ")
      const { sendNotificationEmail } = await import("@/lib/send-notification-email")
      await sendNotificationEmail({
        templateId: "kraftreborn_delivered",
        to: order.customer.email,
        vars: {
          name: order.customer.contactPerson?.split(" ")[0] || order.customer.companyName,
          company: order.customer.companyName,
          orderNumber: order.orderNumber,
          itemSummary: itemSummary || "Your KraftReborn products",
        },
      }).catch((err) => console.error("Delivered email failed:", err))
    }

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error("Admin orders PATCH error:", error)
    const message = error instanceof Error ? error.message : "Update failed"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
