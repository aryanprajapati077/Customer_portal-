import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ensureVerifiedCertificatesSeeded } from "@/lib/verified-certificates"

export async function GET() {
  try {
    await ensureVerifiedCertificatesSeeded()
    const certs = await prisma.verifiedCertificate.findMany({ orderBy: { sortOrder: "asc" } })
    return NextResponse.json({ success: true, certificates: certs })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const cert = await prisma.verifiedCertificate.create({
      data: {
        title: String(body.title || ""),
        issuer: String(body.issuer || ""),
        validUntil: String(body.validUntil || ""),
        type: String(body.type || ""),
        icon: String(body.icon || "shield"),
        pdfUrl: body.pdfUrl || null,
        sortOrder: Number(body.sortOrder) || 0,
        active: body.active !== false,
      },
    })
    return NextResponse.json({ success: true, certificate: cert })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const id = String(body.id || "")
    if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 })

    const cert = await prisma.verifiedCertificate.update({
      where: { id },
      data: {
        title: body.title,
        issuer: body.issuer,
        validUntil: body.validUntil,
        type: body.type,
        icon: body.icon,
        pdfUrl: body.pdfUrl,
        sortOrder: Number(body.sortOrder),
        active: Boolean(body.active),
      },
    })
    return NextResponse.json({ success: true, certificate: cert })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 })
    await prisma.verifiedCertificate.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
