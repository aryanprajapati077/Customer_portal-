import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const tickets = await prisma.supportTicket.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    })
    return NextResponse.json({ success: true, tickets })
  } catch (err) {
    console.error("Admin support tickets error:", err)
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const id = String(body.id || "")
    const status = String(body.status || "")

    if (!id || !["open", "resolved"].includes(status)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({ success: true, ticket })
  } catch (err) {
    console.error("Admin support update error:", err)
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 })
  }
}
