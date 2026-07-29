import { type NextRequest, NextResponse } from "next/server"
import { generateServiceCertificatePdf } from "@/lib/generate-service-certificate-pdf"
import { generateKraftRebornCertificatePdf } from "@/lib/generate-kraftreborn-certificate-pdf"
import { sendCertificateEmail } from "@/lib/certificate-email"
import { queueEmail } from "@/lib/email-queue"
import { sql } from "@/lib/db"
import { assertCustomerAccess, requireCustomerSession, resolveCustomerId } from "@/lib/customer-api-auth"

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

    if (type === "kraftreborn") {
      if (!orderId || amount <= 0) {
        return NextResponse.json(
          { success: false, error: "orderId and amount required" },
          { status: 400 },
        )
      }
      const { pdfBuffer, filename } = await generateKraftRebornCertificatePdf({
        contactName,
        orderId,
        orderAmountRupees: amount,
        productCount,
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

    if (type !== "services") {
      return NextResponse.json(
        { success: false, error: "Email share currently supports Certificate of Services" },
        { status: 400 },
      )
    }

    const generated = await generateServiceCertificatePdf(customerId, certificateId)

    if (action === "email" || action === "send") {
      const toEmail =
        String(body?.to || "").trim() || generated.customer.email
      if (!toEmail) {
        return NextResponse.json({ success: false, error: "No email on customer" }, { status: 400 })
      }

      const notifId = `notif_cert_${customerId}_${Date.now()}`
      const certLabel = `${generated.certificate.name} (${generated.certificate.certificateNumber})`

      // Respond immediately — Resend delivery runs in background
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
    console.error("Certificate POST error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed" },
      { status: 500 },
    )
  }
}
