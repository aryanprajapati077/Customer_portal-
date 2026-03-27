import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 })
    }

    // Find customer by email in database
    const customer = await prisma.customer.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    })

    if (!customer) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 401 })
    }

    // Verify password
    if (customer.password !== password) {
      return NextResponse.json({ success: false, error: "Invalid password" }, { status: 401 })
    }

    // Return customer data (exclude password)
    const { password: _, ...customerData } = customer

    return NextResponse.json({
      success: true,
      customer: {
        ...customerData,
        disposalUnitInstalled: customerData.disposalUnitInstalled ?? 0,
        totalWasteCollected: customerData.totalWasteCollected || 0,
        cigaretteButtsCollected: customerData.cigaretteButtsCollected || 0,
        microplasticsUpcycled: customerData.microplasticsUpcycled || 0,
        waterResourcesProtected: customerData.waterResourcesProtected || 0,
        pendingCollection: customerData.pendingCollection || 0,
        certificatesEarned: customerData.certificatesEarned || 0,
        co2Saved: customerData.co2Saved || 0,
        treesEquivalent: customerData.treesEquivalent || 0,
        isGroup: customerData.isGroup ?? false,
        parentCustomerId: customerData.parentCustomerId ?? null,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
