import { type NextRequest, NextResponse } from "next/server"
import { generateOrderSheetPdf } from "@/lib/generate-order-sheet-pdf"

export async function GET(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get("orderId")
    if (!orderId) {
      return NextResponse.json({ success: false, error: "orderId required" }, { status: 400 })
    }

    const { pdfBuffer, filename } = await generateOrderSheetPdf(orderId)

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Order sheet PDF error:", error)
    return NextResponse.json({ success: false, error: "Failed to generate PDF" }, { status: 500 })
  }
}
