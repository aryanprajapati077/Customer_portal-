import { type NextRequest, NextResponse } from "next/server"
import { createLogo, deleteLogo, listLogos } from "@/lib/sign-presets"
import { toPortalMediaUrl } from "@/lib/media-url"

export const runtime = "nodejs"
export const maxDuration = 60

function withMediaUrl<T extends { imageUrl: string }>(row: T) {
  return { ...row, imageUrl: toPortalMediaUrl(row.imageUrl) }
}

export async function GET() {
  try {
    const logos = (await listLogos()).map(withMediaUrl)
    return NextResponse.json({ success: true, logos })
  } catch (error) {
    console.error("preset logos GET:", error)
    return NextResponse.json({ success: false, error: "Could not load logos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const files = form.getAll("files").filter((item): item is File => item instanceof File && item.size > 0)
    if (!files.length) {
      return NextResponse.json({ success: false, error: "Add at least one logo" }, { status: 400 })
    }
    const logos = []
    for (const file of files) {
      if (file.size > 40 * 1024 * 1024) continue
      const name = file.name.replace(/\.[^.]+$/, "")
      const logo = await createLogo(Buffer.from(await file.arrayBuffer()), name)
      if (logo) logos.push(withMediaUrl(logo))
    }
    if (!logos.length) {
      return NextResponse.json({ success: false, error: "No logos could be saved" }, { status: 400 })
    }
    return NextResponse.json({ success: true, logos })
  } catch (error) {
    console.error("preset logos POST:", error)
    return NextResponse.json({ success: false, error: "Could not save logos" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = String(request.nextUrl.searchParams.get("id") || "")
    if (!id) return NextResponse.json({ success: false, error: "Logo id required" }, { status: 400 })
    const ok = await deleteLogo(id)
    if (!ok) return NextResponse.json({ success: false, error: "Logo not found" }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("preset logos DELETE:", error)
    return NextResponse.json({ success: false, error: "Could not delete logo" }, { status: 500 })
  }
}
