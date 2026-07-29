import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveCustomerScope } from "@/lib/customer-api-auth"

export async function GET(request: NextRequest) {
  try {
    const locationId = request.nextUrl.searchParams.get("locationId")
    const auth = await resolveCustomerScope(
      request.nextUrl.searchParams.get("customerId"),
      locationId,
    )
    if (!auth.ok) return auth.response

    const customers = await prisma.customer.findMany({
      where: { id: { in: auth.customerIds } },
      select: { id: true, companyName: true, city: true, serviceStartDate: true, joinDate: true },
    })
    const startByCustomer = new Map<string, Date | null>()
    const customerMap = new Map<string, { companyName: string; city: string | null }>()
    for (const c of customers) {
      customerMap.set(c.id, { companyName: c.companyName, city: c.city })
      startByCustomer.set(c.id, c.serviceStartDate || c.joinDate || null)
    }

    const collections = await prisma.collection.findMany({
      where: { customerId: { in: auth.customerIds } },
      orderBy: { date: "desc" },
    })

    // Only show collections from installation / service start month onward
    const filtered = collections.filter((row) => {
      const start = startByCustomer.get(row.customerId)
      if (!start) return true
      const startMonth = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1)
      const rowMonth = Date.UTC(row.date.getUTCFullYear(), row.date.getUTCMonth(), 1)
      return rowMonth >= startMonth
    })

    return NextResponse.json({
      success: true,
      collections: filtered.map((c) => ({
        ...c,
        locationName: customerMap.get(c.customerId)?.companyName,
        locationCity: customerMap.get(c.customerId)?.city,
      })),
    })
  } catch (error) {
    console.error("Error fetching collections:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
