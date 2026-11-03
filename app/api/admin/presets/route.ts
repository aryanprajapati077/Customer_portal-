import { type NextRequest, NextResponse } from "next/server"
import { createPreset, deletePreset, listPresets, updatePresetSlot } from "@/lib/sign-presets"
import { toPortalMediaUrl } from "@/lib/media-url"

export const runtime = "nodejs"
export const maxDuration = 60

function withMediaUrl<T extends { imageUrl: string }>(row: T) {
  return { ...row, imageUrl: toPortalMediaUrl(row.imageUrl) }
}

function kindOf(value: unknown) {
  return value === "mockup" ? "mockup" : value === "layered" ? "layered" : "preset"
}

export async function GET(request: NextRequest) {
  try {
    const presets = (await listPresets(kindOf(request.nextUrl.searchParams.get("kind")))).map(withMediaUrl)
    return NextResponse.json({ success: true, presets })
  } catch (error) {
    console.error("presets GET:", error)
    return NextResponse.json({ success: false, error: "Could not load presets" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const file = form.get("file")
    const name = String(form.get("name") || "").trim()
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "Image is required" }, { status: 400 })
    }
    if (file.size > 40 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "Image must be under 40MB" }, { status: 400 })
    }
    const preset = await createPreset(
      Buffer.from(await file.arrayBuffer()),
      name || file.name.replace(/\.[^.]+$/, ""),
      kindOf(form.get("kind")),
    )
    return NextResponse.json({ success: true, preset: preset ? withMediaUrl(preset) : null })
  } catch (error) {
    console.error("presets POST:", error)
    return NextResponse.json({ success: false, error: "Could not save preset" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const id = String(body?.id || "")
    if (!id) return NextResponse.json({ success: false, error: "Preset id required" }, { status: 400 })
    const preset = await updatePresetSlot(id, {
      name: body?.name ? String(body.name) : undefined,
      slotX: Number(body?.slotX),
      slotY: Number(body?.slotY),
      slotW: Number(body?.slotW),
      slotH: Number(body?.slotH),
      defaultChildIds: Array.isArray(body?.defaultChildIds) ? body.defaultChildIds.map(String) : undefined,
    })
    if (!preset) return NextResponse.json({ success: false, error: "Preset not found" }, { status: 404 })
    return NextResponse.json({ success: true, preset: withMediaUrl(preset) })
  } catch (error) {
    console.error("presets PATCH:", error)
    return NextResponse.json({ success: false, error: "Could not update preset" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = String(request.nextUrl.searchParams.get("id") || "")
    if (!id) return NextResponse.json({ success: false, error: "Preset id required" }, { status: 400 })
    const ok = await deletePreset(id)
    if (!ok) return NextResponse.json({ success: false, error: "Preset not found" }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("presets DELETE:", error)
    return NextResponse.json({ success: false, error: "Could not delete preset" }, { status: 500 })
  }
}
