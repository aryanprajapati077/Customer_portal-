import { type NextRequest, NextResponse } from "next/server"
import React from "react"
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer"
import { requireAdminSession } from "@/lib/admin-auth-server"
import { hasAdminPermission } from "@/lib/admin-permissions"
import { coerceQuotation, computeQuotation, validateGstin } from "@/lib/quotation"
import { QuotationDocument } from "@/lib/quotation-pdf"

export const maxDuration = 60

export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  if (!hasAdminPermission(session.role, session.permissions, "quotations")) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  try {
    const config = coerceQuotation(await request.json())
    if (!config.clientName) return NextResponse.json({ success: false, error: "Client name is required" }, { status: 400 })
    if (!config.piNo) return NextResponse.json({ success: false, error: "PI number is required" }, { status: 400 })
    for (const [label, g] of [["Billing", config.bill.gstin], ["Shipping", config.ship.gstin]] as const) {
      if (g && (() => { const r = validateGstin(g); return !r.valid && !r.checksumOnly })()) {
        return NextResponse.json({ success: false, error: `${label} GSTIN is invalid` }, { status: 400 })
      }
    }

    const buf = await renderToBuffer(React.createElement(QuotationDocument, { config }) as unknown as React.ReactElement<DocumentProps>)
    const safe = config.clientName.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "") || "Client"
    const filename = `Buffindia-Proposal-${safe}-${computeQuotation(config).kioskLabel.replace(/[^a-zA-Z]+/g, "-")}.pdf`
    const inline = request.nextUrl.searchParams.get("inline") === "1"
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Quotation PDF error:", error)
    return NextResponse.json({ success: false, error: "Failed to generate PDF" }, { status: 500 })
  }
}
