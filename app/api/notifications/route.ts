import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get("customerId")
    if (!customerId) {
      return NextResponse.json({ success: false, error: "Customer ID required" }, { status: 400 })
    }

    const notifications = await sql`
      SELECT id, title, body, "createdAt", "readAt"
      FROM "Notification"
      WHERE "customerId" = ${customerId}
      ORDER BY "createdAt" DESC
      LIMIT 20
    `

    return NextResponse.json({ success: true, notifications })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

