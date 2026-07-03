import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ensureVerifiedCertificatesSeeded } from "@/lib/verified-certificates"

export async function GET() {
  try {
    await ensureVerifiedCertificatesSeeded()
    const certs = await prisma.verifiedCertificate.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    })
    return NextResponse.json({ success: true, certificates: certs })
  } catch (error) {
    console.error("Verified certificates GET error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
