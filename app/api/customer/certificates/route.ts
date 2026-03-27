import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get("customerId")

    if (!customerId) {
      return NextResponse.json({ success: false, error: "Customer ID required" }, { status: 400 })
    }

    // Fetch certificates from database
    const certificates = await prisma.certificate.findMany({
      where: {
        customerId: customerId,
      },
      orderBy: {
        issueDate: "desc",
      },
    })

    return NextResponse.json({ success: true, certificates })
  } catch (error) {
    console.error("Error fetching certificates:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
