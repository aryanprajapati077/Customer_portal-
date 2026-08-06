import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sql } from "@/lib/db"
import { creditsToRupees } from "@/lib/kraftreborn"
import { formatOrderNumber } from "@/lib/shop-constants"
import { saveBase64Image } from "@/lib/upload"
import { assertCustomerAccess, requireCustomerSession, resolveCustomerId } from "@/lib/customer-api-auth"
import { ensureOrderItemColorColumn } from "@/lib/shop-order-schema"

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveCustomerId(request.nextUrl.searchParams.get("customerId"))
    if (!auth.ok) return auth.response
    const customerId = auth.customerId

    const orders = await prisma.shopOrder.findMany({
      where: { customerId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return NextResponse.json({
      success: true,
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        subtotal: o.subtotal,
        logoRequested: o.logoRequested,
        creditsDeducted: o.creditsDeducted,
        createdAt: o.createdAt.toISOString(),
        itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
      })),
    })
  } catch (error) {
    console.error("Customer orders GET error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireCustomerSession()
    if (!session.ok) return session.response

    const body = await request.json()
    const denied = assertCustomerAccess(session.customerId, body?.customerId)
    if (denied) return denied

    const customerId = session.customerId
    const items = Array.isArray(body?.items) ? body.items : []
    const useKrCredits = body?.useKrCredits !== false
    const logoRequested = Boolean(body?.logoRequested)
    const logoBase64 = body?.logoBase64 ? String(body.logoBase64) : null
    const notes = body?.notes ? String(body.notes) : null

    if (!customerId || items.length === 0) {
      return NextResponse.json({ success: false, error: "customerId and items required" }, { status: 400 })
    }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } })
    if (!customer) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 })
    }

    // Resolve catalog prices server-side; drop invalid FK productIds (showcase/local ids)
    const productIds = items
      .map((i: { productId?: string }) => String(i.productId || "").trim())
      .filter(Boolean)
    const dbProducts =
      productIds.length > 0
        ? await prisma.product.findMany({
            where: { id: { in: productIds }, active: true },
          })
        : []
    const byId = new Map(dbProducts.map((p) => [p.id, p]))

    type ResolvedItem = {
      productId: string | null
      productName: string
      price: number
      quantity: number
      allowsLogo: boolean
      selectedColor: string | null
    }

    const resolvedItems: ResolvedItem[] = items.map(
      (i: {
        productId?: string
        name?: string
        price?: number
        quantity?: number
        allowsLogo?: boolean
        color?: string
      }) => {
        const qty = Math.max(1, Math.min(99, Number(i.quantity) || 1))
        const pid = String(i.productId || "").trim()
        const db = pid ? byId.get(pid) : undefined
        const color = i.color ? String(i.color).trim().slice(0, 40) : null
        return {
          productId: db ? db.id : null,
          productName: db?.name || String(i.name || "Product").slice(0, 120),
          price: db ? Number(db.price) : Math.max(0, Number(i.price) || 0),
          quantity: qty,
          allowsLogo: db ? Boolean(db.allowsLogo) : Boolean(i.allowsLogo),
          selectedColor: color || null,
        }
      },
    )

    if (resolvedItems.some((i) => i.price <= 0)) {
      return NextResponse.json({ success: false, error: "Invalid product pricing" }, { status: 400 })
    }

    const subtotal = resolvedItems.reduce(
      (sum: number, i: ResolvedItem) => sum + i.price * i.quantity,
      0,
    )

    if (useKrCredits) {
      const credits = creditsToRupees(Number(customer.kraftrebornCredits) || 0)
      if (subtotal > credits) {
        return NextResponse.json(
          { success: false, error: `Insufficient KR credits. Need ₹${subtotal}, have ₹${credits}` },
          { status: 400 },
        )
      }
      const deducted = await sql.query<{ id: string }>(
        `UPDATE "Customer"
         SET "kraftrebornCredits" = "kraftrebornCredits" - $1,
             "updatedAt" = CURRENT_TIMESTAMP
         WHERE id = $2 AND "kraftrebornCredits" >= $1
         RETURNING id`,
        [subtotal, customerId],
      )
      if (!deducted.length) {
        return NextResponse.json(
          { success: false, error: "Insufficient KR credits (concurrent update). Please refresh and try again." },
          { status: 409 },
        )
      }
    }

    await ensureOrderItemColorColumn()

    let logoUrl: string | null = null
    let order
    let orderCreated = false
    try {
      if (logoRequested && logoBase64) {
        const saved = await saveBase64Image(logoBase64, "logos", "order-logo")
        logoUrl = saved.url
      }

      const orderNumber = formatOrderNumber(customerId)
      order = await prisma.shopOrder.create({
        data: {
          orderNumber,
          customerId,
          status: "pending",
          subtotal,
          useKrCredits,
          creditsDeducted: useKrCredits,
          logoRequested,
          logoUrl,
          shippingName: customer.contactPerson || customer.companyName,
          shippingEmail: customer.email,
          shippingPhone: customer.phone,
          shippingAddress: customer.address,
          notes,
          items: {
            create: resolvedItems,
          },
        },
        include: { items: true },
      })
      orderCreated = true

      try {
        const notifId = `notif_order_${customerId}_${Date.now()}`
        await prisma.notification.create({
          data: {
            id: notifId,
            customerId,
            title: "Order placed — pending review",
            body: useKrCredits
              ? `Order ${orderNumber} for ₹${subtotal} placed. ₹${subtotal} KR credits deducted. We'll process your order shortly.`
              : `Order ${orderNumber} for ₹${subtotal} received. We'll process your order shortly.`,
          },
        })
      } catch (notifErr) {
        console.error("Order notification failed:", notifErr)
      }

      try {
        const { sendKrOrderConfirmationEmail } = await import("@/lib/kr-order-email")
        const { queueEmail } = await import("@/lib/email-queue")
        queueEmail("kr-order", () =>
          sendKrOrderConfirmationEmail({
            to: customer.email,
            contactName: customer.contactPerson,
            companyName: customer.companyName,
            orderNumber,
            subtotal,
            items: resolvedItems.map((i) => ({
              productName: i.productName,
              quantity: i.quantity,
              price: i.price,
            })),
            useKrCredits,
          }),
        )
      } catch (emailErr) {
        console.error("Order confirmation email queue failed:", emailErr)
      }
    } catch (err) {
      // Only refund if credits were taken and the order row never landed
      if (useKrCredits && !orderCreated) {
        await sql`
          UPDATE "Customer"
          SET "kraftrebornCredits" = "kraftrebornCredits" + ${subtotal},
              "updatedAt" = CURRENT_TIMESTAMP
          WHERE id = ${customerId}
        `.catch(() => {})
      }
      throw err
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        subtotal: order.subtotal,
        items: order.items,
      },
    })
  } catch (error) {
    console.error("Customer orders POST error:", error)
    return NextResponse.json({ success: false, error: "Failed to place order" }, { status: 500 })
  }
}
