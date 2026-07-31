import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { syncServiceCertificate } from "@/lib/sync-certificates"
import { resolveCustomerScope } from "@/lib/customer-api-auth"

function formatCertificate(row: {
  id: string
  name: string
  issueDate: Date
  type: string | null
  description: string | null
  driveFileUrl: string | null
  validUntil: string | null
  issuedBy: string
  certificateNumber: string
}) {
  return {
    id: row.id,
    name: row.name,
    issueDate: row.issueDate.toISOString(),
    type: row.type,
    description: row.description,
    driveFileUrl: row.driveFileUrl,
    validUntil: row.validUntil,
    issuedBy: row.issuedBy,
    certificateNumber: row.certificateNumber,
  }
}

export async function GET(request: NextRequest) {
  try {
    const locationId = request.nextUrl.searchParams.get("locationId")
    const auth = await resolveCustomerScope(
      request.nextUrl.searchParams.get("customerId"),
      locationId,
    )
    if (!auth.ok) return auth.response

    // Sync only when a customer has no certificate yet (avoid blocking every list load)
    const existing = await prisma.certificate.groupBy({
      by: ["customerId"],
      where: { customerId: { in: auth.customerIds } },
      _count: { _all: true },
    })
    const have = new Set(existing.map((e) => e.customerId))
    const missing = auth.customerIds.filter((cid) => !have.has(cid))
    if (missing.length > 0) {
      await Promise.all(missing.map((cid) => syncServiceCertificate(cid)))
    }

    const certificates = await prisma.certificate.findMany({
      where: { customerId: { in: auth.customerIds } },
      orderBy: { issueDate: "desc" },
    })

    return NextResponse.json({
      success: true,
      certificates: certificates.map(formatCertificate),
    })
  } catch (error) {
    console.error("Error fetching certificates:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
