import React from "react"
import { renderToBuffer } from "@react-pdf/renderer"
import { prisma } from "@/lib/prisma"
import { OrderSheetPdf, type OrderSheetData } from "@/lib/order-sheet-pdf"

export async function generateOrderSheetPdf(orderId: string) {
  const order = await prisma.shopOrder.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      customer: true,
    },
  })

  if (!order) throw new Error("Order not found")

  const data: OrderSheetData = {
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    companyName: order.customer.companyName,
    contactPerson: order.customer.contactPerson || order.customer.companyName,
    email: order.shippingEmail || order.customer.email,
    phone: order.shippingPhone || order.customer.phone || "",
    address: order.shippingAddress || order.customer.address || "",
    subtotal: order.subtotal,
    useKrCredits: order.useKrCredits,
    logoRequested: order.logoRequested,
    logoUrl: order.logoUrl,
    notes: order.notes,
    items: order.items.map((i) => ({
      productName: i.productName,
      quantity: i.quantity,
      price: i.price,
      allowsLogo: i.allowsLogo,
    })),
  }

  const pdfBuffer = await renderToBuffer(
    React.createElement(OrderSheetPdf, { data }) as React.ReactElement,
  )

  return {
    pdfBuffer: Buffer.from(pdfBuffer),
    filename: `Order-${order.orderNumber}.pdf`,
    data,
  }
}
