import { type NextRequest, NextResponse } from "next/server"
import { generateServiceCertificatePdf } from "@/lib/generate-service-certificate-pdf"
import { generateKraftRebornCertificatePdf } from "@/lib/generate-kraftreborn-certificate-pdf"
import { sendCertificateEmail } from "@/lib/certificate-email"
import { queueEmail } from "@/lib/email-queue"
import { isEmailEnabled } from "@/lib/email-settings"
import { sql } from "@/lib/db"
import { assertCustomerAccess, requireCustomerSession, resolveCustomerId } from "@/lib/customer-api-auth"
import { prisma } from "@/lib/prisma"

export const maxDuration = 60

async function resolveKraftRebornCertificate(
  customerId: string,
  certificateId?: string,
  orderId?: string,
  amount?: number,
  productCount?: number,
) {
  if (certificateId) {
    const cert = await prisma.certificate.findFirst({
      where: { id: certificateId, customerId },
    })
    if (!cert || cert.type !== "KraftReborn") {
      throw new Error("KraftReborn certificate not found")
    }
    const order = await prisma.shopOrder.findFirst({
      where: { orderNumber: cert.certificateNumber, customerId },
      include: { items: true },
    })
    if (!order) throw new Error("Order not found for certificate")
    return {
      orderId: order.orderNumber,
      orderAmountRupees: order.subtotal,
      productCount: order.items.reduce((s, i) => s + i.quantity, 0),
    }
  }
  if (!orderId || !amount || amount <= 0) {
    throw new Error("orderId and amount required")
  }
  return {
    orderId,
    orderAmountRupees: amount,
    productCount: productCount ?? 1,
  }
}

function pdfResponse(pdfBuffer: Buffer, filename: string) {
  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}

async function generateCertificatePdf(
  customerId: string,
  type: string,
  options: {
    certificateId?: string
    orderId?: string
    amount?: number
    contactName?: string
    productCount?: number
  },
) {
  if (type === "kraftreborn") {
    const kr = await resolveKraftRebornCertificate(
      customerId,
      options.certificateId,
      options.orderId,
      options.amount,
      options.productCount,
    )
    return generateKraftRebornCertificatePdf({
      contactName: options.contactName || "Partner",
      orderId: kr.orderId,
      orderAmountRupees: kr.orderAmountRupees,
      productCount: kr.productCount,
    })
  }

  const generated = await generateServiceCertificatePdf(customerId, options.certificateId)
  return { pdfBuffer: generated.pdfBuffer, filename: generated.filename, generated }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveCustomerId(request.nextUrl.searchParams.get("customerId"))
    if (!auth.ok) return auth.response
    const customerId = auth.customerId
    const type = request.nextUrl.searchParams.get("type") || "services"
    const certificateId = request.nextUrl.searchParams.get("certificateId") || undefined
    const orderId = request.nextUrl.searchParams.get("orderId") || undefined
    const amount = Number(request.nextUrl.searchParams.get("amount") || 0)
    const contactName = request.nextUrl.searchParams.get("contactName") || "Partner"
    const productCount = Number(request.nextUrl.searchParams.get("productCount") || 1)

    const result = await generateCertificatePdf(customerId, type, {
      certificateId,
      orderId,
      amount,
      contactName,
      productCount,
    })

    if ("generated" in result) {
      return pdfResponse(result.pdfBuffer, result.filename)
    }

    return pdfResponse(result.pdfBuffer, result.filename)
  } catch (error) {
    console.error("Certificate PDF error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate certificate",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireCustomerSession()
    if (!session.ok) return session.response

    const body = await request.json()
    const denied = assertCustomerAccess(session.customerId, body?.customerId)
    if (denied) return denied

    const action = String(body?.action || "download")
    const customerId = session.customerId
    const certificateId = body?.certificateId ? String(body.certificateId) : undefined
    const type = String(body?.type || "services")

    if (action === "email" || action === "send") {
      if (type !== "services") {
        return NextResponse.json(
          { success: false, error: "Email share currently supports Certificate of Services" },
          { status: 400 },
        )
      }

      const generated = await generateServiceCertificatePdf(customerId, certificateId)
      const toEmail = String(body?.to || "").trim() || generated.customer.email
      if (!toEmail) {
        return NextResponse.json({ success: false, error: "No email on customer" }, { status: 400 })
      }

      const notifId = `notif_cert_${customerId}_${Date.now()}`
      const certLabel = `${generated.certificate.name} (${generated.certificate.certificateNumber})`

      queueEmail("certificate", async () => {
        if (!(await isEmailEnabled("certificate_email"))) return
        const mail = await sendCertificateEmail({
          to: toEmail,
          companyName: generated.customer.companyName,
          contactName: generated.customer.contactPerson,
          customerId: generated.customer.id,
          certificateName: generated.certificate.name,
          certificateNumber: generated.certificate.certificateNumber,
          fiscalYear: generated.data.fiscalYear,
          pdfBuffer: generated.pdfBuffer,
          filename: generated.filename,
        })
        if (mail.sent) {
          await sql`
            INSERT INTO "Notification" (id, "customerId", title, body)
            VALUES (
              ${notifId},
              ${customerId},
              ${"Your certificate was emailed"},
              ${`${certLabel} was sent to ${toEmail}.`}
            )
          `
        }
      })

      return NextResponse.json({
        success: true,
        emailed: true,
        queued: true,
        certificate: generated.certificate,
        to: toEmail,
      })
    }

    const result = await generateCertificatePdf(customerId, type, {
      certificateId,
      orderId: body?.orderId ? String(body.orderId) : undefined,
      amount: body?.amount != null ? Number(body.amount) : undefined,
      contactName: body?.contactName ? String(body.contactName) : "Partner",
      productCount: body?.productCount != null ? Number(body.productCount) : 1,
    })

    if ("generated" in result) {
      return pdfResponse(result.pdfBuffer, result.filename)
    }

    return pdfResponse(result.pdfBuffer, result.filename)
  } catch (error) {
    console.error("Certificate POST error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed" },
      { status: 500 },
    )
  }
}
