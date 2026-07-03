import { type NextRequest, NextResponse } from "next/server"
import { generateServiceCertificatePdf } from "@/lib/generate-service-certificate-pdf"
import { generateKraftRebornCertificatePdf } from "@/lib/generate-kraftreborn-certificate-pdf"

export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get("customerId")
    const type = request.nextUrl.searchParams.get("type") || "services"
    const certificateId = request.nextUrl.searchParams.get("certificateId") || undefined
    const orderId = request.nextUrl.searchParams.get("orderId") || undefined
    const amount = Number(request.nextUrl.searchParams.get("amount") || 0)
    const contactName = request.nextUrl.searchParams.get("contactName") || "Partner"
    const productCount = Number(request.nextUrl.searchParams.get("productCount") || 1)

    if (!customerId) {
      return NextResponse.json({ success: false, error: "Customer ID required" }, { status: 400 })
    }

    if (type === "kraftreborn") {
      if (!orderId || amount <= 0) {
        return NextResponse.json({ success: false, error: "orderId and amount required" }, { status: 400 })
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
    return NextResponse.json({ success: false, error: "Failed to generate certificate" }, { status: 500 })
  }
}
