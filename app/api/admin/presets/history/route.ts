import { type NextRequest, NextResponse } from "next/server"
import { addHistory, approveHistory, deleteHistory, listHistory, HISTORY_DAYS, normalizeClientId } from "@/lib/sign-presets"
import { toPortalMediaUrl } from "@/lib/media-url"

export const runtime = "nodejs"
export const maxDuration = 120

function present<T extends { imageUrl: string; thumbUrl: string; createdAt: string; finalUrl: string | null }>(row: T) {
  const expiresAt = new Date(new Date(row.createdAt).getTime() + HISTORY_DAYS * 86400000).toISOString()
  return { ...row, imageUrl: toPortalMediaUrl(row.imageUrl), thumbUrl: toPortalMediaUrl(row.thumbUrl), expiresAt }
}

export async function GET() {
  try {
    return NextResponse.json({ success: true, history: (await listHistory()).map(present) })
  } catch (error) {
    console.error("history GET:", error)
    return NextResponse.json({ success: false, error: "Could not load history" }, { status: 500 })
  }
}

/** Save a rendered 4K PNG. Pass clientId to approve it and file it under that client's R2 folder. */
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const file = form.get("file")
    const title = String(form.get("title") || "").trim()
    const rawClient = String(form.get("clientId") || "").trim()
    if (!(file instanceof File)) return NextResponse.json({ success: false, error: "Image is required" }, { status: 400 })
    if (file.size > 120 * 1024 * 1024) return NextResponse.json({ success: false, error: "Image is too large" }, { status: 400 })
    if (rawClient && !normalizeClientId(rawClient)) {
      return NextResponse.json({ success: false, error: "Enter a valid client ID" }, { status: 400 })
    }
    const entry = await addHistory(Buffer.from(await file.arrayBuffer()), title, rawClient || undefined)
    return NextResponse.json({ success: true, entry: present(entry) })
  } catch (error) {
    console.error("history POST:", error)
    return NextResponse.json({ success: false, error: "Could not save the design" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const id = String(body?.id || "")
    const clientId = String(body?.clientId || "")
    if (!id || !normalizeClientId(clientId)) {
      return NextResponse.json({ success: false, error: "Design and client ID are required" }, { status: 400 })
    }
    const entry = await approveHistory(id, clientId)
    if (!entry) return NextResponse.json({ success: false, error: "Design not found" }, { status: 404 })
    return NextResponse.json({ success: true, entry: present(entry) })
  } catch (error) {
    console.error("history PATCH:", error)
    return NextResponse.json({ success: false, error: "Could not approve the design" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = String(request.nextUrl.searchParams.get("id") || "")
    if (!id || !(await deleteHistory(id))) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("history DELETE:", error)
    return NextResponse.json({ success: false, error: "Could not delete" }, { status: 500 })
  }
}
