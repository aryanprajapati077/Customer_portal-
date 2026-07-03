import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sql } from "@/lib/db"
import { creditsToRupees, computeKraftRebornImpact } from "@/lib/kraftreborn"
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
      take: 200,
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
    const credits = creditsToRupees(Number(order.customer.kraftrebornCredits) || 0)
    if (order.subtotal > credits) {
      throw new Error(`Customer has insufficient credits (₹${credits} available, ₹${order.subtotal} required)`)
    }

    await sql`
      UPDATE "Customer"
      SET "kraftrebornCredits" = GREATEST(0, "kraftrebornCredits" - ${order.subtotal}),
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${order.customerId}
    `
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
      body: `Order ${order.orderNumber} is complete. ₹${order.subtotal} KR credits deducted. Your impact certificate is ready in Certificates.`,
    },
  })

  await prisma.shopOrder.update({
    where: { id: orderId },
    data: {
      status: "completed",
      creditsDeducted: order.useKrCredits ? true : order.creditsDeducted,
      completedAt: new Date(),
    },
  })

  return { completed: true, impact }
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
        include: { items: true, customer: { select: { id: true, companyName: true, email: true } } },
      })
      return NextResponse.json({ success: true, order, ...result })
    }

    const order = await prisma.shopOrder.update({
      where: { id },
      data: {
        status: status || undefined,
        notes: body.notes !== undefined ? String(body.notes) : undefined,
      },
      include: { items: true, customer: { select: { id: true, companyName: true, email: true } } },
    })

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error("Admin orders PATCH error:", error)
    const message = error instanceof Error ? error.message : "Update failed"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
