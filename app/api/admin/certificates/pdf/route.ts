import { type NextRequest, NextResponse } from "next/server"
import { generateServiceCertificatePdf } from "@/lib/generate-service-certificate-pdf"
import { generateKraftRebornCertificatePdf } from "@/lib/generate-kraftreborn-certificate-pdf"
import { sendCertificateEmail } from "@/lib/certificate-email"
import { queueEmail } from "@/lib/email-queue"
import { sql } from "@/lib/db"
import { prisma } from "@/lib/prisma"
import { requireAdminSession } from "@/lib/admin-auth-server"
import { hasAdminPermission } from "@/lib/admin-permissions"

async function requireCertificatesAdmin(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session) {
    return { ok: false as const, response: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }) }
  }
  if (!hasAdminPermission(session.role, session.permissions, "certificates")) {
    return { ok: false as const, response: NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }) }
  }
  return { ok: true as const, session }
}

async function resolveKraftRebornFromCertificate(certificateId: string) {
  const cert = await prisma.certificate.findUnique({ where: { id: certificateId } })
  if (!cert || cert.type !== "KraftReborn") {
    throw new Error("KraftReborn certificate not found")
  }
  const orderNumber = cert.certificateNumber
  const order = await prisma.shopOrder.findFirst({
    where: { orderNumber },
    include: { items: true },
  })
  if (!order) throw new Error("Order not found for certificate")
  const productCount = order.items.reduce((s, i) => s + i.quantity, 0)
  return {
    orderId: order.orderNumber,
    orderAmountRupees: order.subtotal,
    productCount,
    customerId: cert.customerId,
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireCertificatesAdmin(request)
  if (!auth.ok) return auth.response

  try {
    const customerId = request.nextUrl.searchParams.get("customerId")?.trim()
    const type = request.nextUrl.searchParams.get("type") || "services"
    const certificateId = request.nextUrl.searchParams.get("certificateId") || undefined

    if (!customerId) {
      return NextResponse.json({ success: false, error: "customerId required" }, { status: 400 })
    }

    if (type === "kraftreborn") {
      if (!certificateId) {
        return NextResponse.json({ success: false, error: "certificateId required" }, { status: 400 })
      }
      const kr = await resolveKraftRebornFromCertificate(certificateId)
      if (kr.customerId !== customerId) {
        return NextResponse.json({ success: false, error: "Certificate does not belong to customer" }, { status: 403 })
      }
      const { pdfBuffer, filename } = await generateKraftRebornCertificatePdf({
        contactName: "Partner",
        orderId: kr.orderId,
        orderAmountRupees: kr.orderAmountRupees,
        productCount: kr.productCount,
      })
      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      })
    }

    const { pdfBuffer, filename } = await generateServiceCertificatePdf(customerId, certificateId)
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Admin certificate PDF error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to generate certificate" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCertificatesAdmin(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const action = String(body?.action || "email")
    const customerId = String(body?.customerId || "").trim()
    const certificateId = body?.certificateId ? String(body.certificateId) : undefined
    const type = String(body?.type || "services")

    if (!customerId) {
      return NextResponse.json({ success: false, error: "customerId required" }, { status: 400 })
    }

    if (type !== "services") {
      return NextResponse.json(
        { success: false, error: "Email share currently supports Certificate of Services" },
        { status: 400 },
      )
    }

    const generated = await generateServiceCertificatePdf(customerId, certificateId)

    if (action === "email" || action === "send") {
      const toEmail = String(body?.to || "").trim() || generated.customer.email
      if (!toEmail) {
        return NextResponse.json({ success: false, error: "No email on customer" }, { status: 400 })
      }

      const notifId = `notif_cert_${customerId}_${Date.now()}`
      const certLabel = `${generated.certificate.name} (${generated.certificate.certificateNumber})`

      queueEmail("certificate", async () => {
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

    return new NextResponse(new Uint8Array(generated.pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${generated.filename}"`,
      },
    })
  } catch (error) {
    console.error("Admin certificate POST error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed" },
      { status: 500 },
    )
  }
}
