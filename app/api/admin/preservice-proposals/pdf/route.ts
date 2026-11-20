import { type NextRequest, NextResponse } from "next/server"
import React from "react"
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer"
import { requireAdminSession } from "@/lib/admin-auth-server"
import { hasAdminPermission } from "@/lib/admin-permissions"
import { coercePreService } from "@/lib/preservice"
import { PreServiceDocument } from "@/lib/preservice-pdf"

export const maxDuration = 60

export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  if (!hasAdminPermission(session.role, session.permissions, "quotations")) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }
  try {
    const config = coercePreService(await request.json())
    if (!config.name) return NextResponse.json({ success: false, error: "Client / property name is required" }, { status: 400 })
    const buf = await renderToBuffer(React.createElement(PreServiceDocument, { config }) as unknown as React.ReactElement<DocumentProps>)
    const safe = config.name.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "") || "Client"
    const inline = request.nextUrl.searchParams.get("inline") === "1"
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="Buffindia-PreService-Proposal-${safe}.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("PreService PDF error:", error)
    return NextResponse.json({ success: false, error: "Failed to generate PDF" }, { status: 500 })
  }
}
