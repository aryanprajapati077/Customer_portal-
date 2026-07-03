"use server"

import { sql } from "@/lib/db"
import { getSheetData } from "@/lib/google-sheets"
import { hashPassword } from "@/lib/password"
import { revalidateTag } from "next/cache"

export async function syncGoogleSheetToNeon() {
  try {
    console.log("[v0] Starting Google Sheet to Neon sync...")

    // 1. Sync Customers
    const customersResult = await getSheetData("Customers")
    if (customersResult.success && customersResult.data.length > 0) {
      for (const row of customersResult.data) {
        if (!row.email) continue

        const customerId = String(row.id || `sheet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
        const email = String(row.email)

        // Check if customer exists
        const existing = await sql`
          SELECT id FROM "Customer" WHERE email = ${email} LIMIT 1
        `

        if (existing.length > 0) {
          // Update existing customer
          await sql`
            UPDATE "Customer" SET
              "companyName" = ${String(row.companyName || "")},
              "contactPerson" = ${String(row.contactPerson || "")},
              phone = ${String(row.phone || "")},
              address = ${String(row.address || "")},
              industry = ${String(row.industry || "")},
              "employeeCount" = ${Number(row.employeeCount || 0)},
              "totalWasteCollected" = ${Number(row.totalWasteCollected || 0)},
              "co2Saved" = ${Number(row.co2Saved || 0)},
              "treesEquivalent" = ${Number(row.treesEquivalent || 0)},
              status = ${String(row.status || "Active")},
              "updatedAt" = CURRENT_TIMESTAMP
            WHERE email = ${email}
          `
        } else {
          const pwd = String(row.password || "password123")
          const passwordHash = await hashPassword(pwd)
          // Insert new customer
          await sql`
            INSERT INTO "Customer" (
              id, email, password, "companyName", "contactPerson", phone, address,
              industry, "employeeCount", "totalWasteCollected", "co2Saved",
              "treesEquivalent", status, "pendingCollection", "certificatesEarned", "monthlyTarget"
            ) VALUES (
              ${customerId},
              ${email},
              ${passwordHash},
              ${String(row.companyName || "")},
              ${String(row.contactPerson || "")},
              ${String(row.phone || "")},
              ${String(row.address || "")},
              ${String(row.industry || "")},
              ${Number(row.employeeCount || 0)},
              ${Number(row.totalWasteCollected || 0)},
              ${Number(row.co2Saved || 0)},
              ${Number(row.treesEquivalent || 0)},
              ${String(row.status || "Active")},
              0,
              0,
              0
            )
          `
        }
      }
    }

    // 2. Update Global Impact after customer sync
    const aggregateResult = await sql`
      SELECT 
        COALESCE(SUM("totalWasteCollected"), 0) as total_waste,
        COALESCE(SUM("co2Saved"), 0) as total_co2,
        COALESCE(SUM("treesEquivalent"), 0) as total_trees
      FROM "Customer"
    `

    const aggregate = aggregateResult[0]

    await sql`
      UPDATE "GlobalImpact" SET
        "wasteCollected" = ${Number(aggregate.total_waste || 0)},
        "co2Prevented" = ${Number(aggregate.total_co2 || 0)},
        "treesEquivalent" = ${Number(aggregate.total_trees || 0)},
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = 'global-impact'
    `

    revalidateTag("global-impact", "max")
    console.log("[v0] Sync completed successfully.")
    return { success: true }
  } catch (error) {
    console.error("[v0] Sync error:", error)
    return { success: false, error: "Failed to sync data from Google Sheets" }
  }
}
