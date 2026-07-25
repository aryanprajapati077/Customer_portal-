import { type NextRequest, NextResponse } from "next/server"
import { getEsgEmailCopy, saveEsgEmailCopy } from "@/lib/email-template-store"
import { DEFAULT_ESG_EMAIL_COPY, type EsgEmailCopy } from "@/lib/email-templates"

export async function GET() {
  try {
    const copy = await getEsgEmailCopy()
    return NextResponse.json({ success: true, copy, defaults: DEFAULT_ESG_EMAIL_COPY })
  } catch (error) {
    console.error("email-templates GET:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const incoming = (body?.copy || body) as Partial<EsgEmailCopy>
    const saved = await saveEsgEmailCopy({
      ...DEFAULT_ESG_EMAIL_COPY,
      ...incoming,
    })
    return NextResponse.json({ success: true, copy: saved })
  } catch (error) {
    console.error("email-templates PUT:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
