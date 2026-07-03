import { NextResponse } from "next/server"
import { syncGoogleSheetToNeon } from "@/app/actions/sync-actions"

export async function POST() {
  try {
    const result = await syncGoogleSheetToNeon()
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || "Sync failed" }, { status: 500 })
    }
    return NextResponse.json({ success: true, message: "Google Sheets data imported successfully" })
  } catch (error) {
    console.error("Import error:", error)
    return NextResponse.json({ success: false, error: "Import failed" }, { status: 500 })
  }
}
