import { prisma } from "../lib/prisma"

async function seed() {
  console.log("[v0] Seeding database...")

  try {
    // Create Global Impact record (upsert)
    await prisma.globalImpact.upsert({
      where: { id: "global-impact" },
      update: {
        wasteCollected: 2847,
        productsCreated: 1200000,
        treesEquivalent: 45600,
        co2Prevented: 850000,
      },
      create: {
        id: "global-impact",
        wasteCollected: 2847,
        productsCreated: 1200000,
        treesEquivalent: 45600,
        co2Prevented: 850000,
      },
    })
    console.log("[v0] Created/updated global impact record")

    // Create Demo Customer (upsert)
    await prisma.customer.upsert({
      where: { email: "demo@buffindia.com" },
      update: {
        companyName: "Demo Corporation",
        contactPerson: "John Smith",
        phone: "+91 98765 43210",
        address: "123 Green Street, Mumbai, Maharashtra 400001",
        totalWasteCollected: 1250,
        pendingCollection: 45,
        certificatesEarned: 8,
        status: "Active",
        co2Saved: 3125,
        treesEquivalent: 125,
        industry: "Hospitality",
        employeeCount: 500,
        monthlyTarget: 100,
        notes: "Premium partner since 2023",
      },
      create: {
        id: "demo-001",
        email: "demo@buffindia.com",
        password: "demo123",
        companyName: "Demo Corporation",
        contactPerson: "John Smith",
        phone: "+91 98765 43210",
        address: "123 Green Street, Mumbai, Maharashtra 400001",
        totalWasteCollected: 1250,
        pendingCollection: 45,
        certificatesEarned: 8,
        status: "Active",
        co2Saved: 3125,
        treesEquivalent: 125,
        industry: "Hospitality",
        employeeCount: 500,
        monthlyTarget: 100,
        notes: "Premium partner since 2023",
      },
    })
    console.log("[v0] Created/updated demo customer")

    console.log("[v0] Database seeded successfully.")
  } catch (error) {
    console.error("[v0] Seeding failed:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seed().catch((e) => {
  console.error("[v0] Seeding error:", e)
  process.exit(1)
})
