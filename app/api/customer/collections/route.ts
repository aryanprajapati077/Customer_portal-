import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get("customerId")

    if (!customerId) {
      return NextResponse.json({ success: false, error: "Customer ID required" }, { status: 400 })
    }

    // Fetch collections from database
    const collections = await prisma.collection.findMany({
      where: {
        customerId: customerId,
      },
      orderBy: {
        date: "desc",
      },
    })

    return NextResponse.json({ success: true, collections })
  } catch (error) {
    console.error("Error fetching collections:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
