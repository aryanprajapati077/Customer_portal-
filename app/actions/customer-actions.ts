"use server"

import { sql, type Customer, type Collection, type Certificate, type Report } from "@/lib/db"
import { revalidateTag, updateTag } from "next/cache"

export async function getCustomerDashboardData(email: string) {
  try {
    // Fetch customer
    const customerResult = await sql`
      SELECT * FROM "Customer" 
      WHERE email = ${email} 
      LIMIT 1
    `

    if (!customerResult || customerResult.length === 0) {
      return null
    }

    const customer = customerResult[0] as Customer

    // Fetch collections
    const collections = (await sql`
      SELECT * FROM "Collection" 
      WHERE "customerId" = ${customer.id} 
      ORDER BY date DESC 
      LIMIT 10
    `) as Collection[]

    // Fetch certificates
    const certificates = (await sql`
      SELECT * FROM "Certificate" 
      WHERE "customerId" = ${customer.id} 
      ORDER BY "issueDate" DESC
    `) as Certificate[]

    // Fetch reports
    const reports = (await sql`
      SELECT * FROM "Report" 
      WHERE "customerId" = ${customer.id} 
      ORDER BY date DESC
    `) as Report[]

    return {
      ...customer,
      collections,
      certificates,
      reports,
    }
  } catch (error) {
    console.error("[v0] Error fetching customer data:", error)
    return null
  }
}

export async function logCollection(data: {
  customerId: string
  weight: number
  location?: string
  collectorName?: string
  vehicleNumber?: string
}) {
  try {
    const co2Saved = data.weight * 2.5 // Example conversion factor
    const collectionId = `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create the collection record
    await sql`
      INSERT INTO "Collection" (
        id, "customerId", date, weight, location, status, "collectorName", "vehicleNumber", "co2Saved"
      ) VALUES (
        ${collectionId},
        ${data.customerId},
        CURRENT_TIMESTAMP,
        ${data.weight},
        ${data.location || null},
        'Completed',
        ${data.collectorName || null},
        ${data.vehicleNumber || null},
        ${co2Saved}
      )
    `

    // Update customer aggregate metrics
    const treesIncrement = Math.floor(data.weight / 25)
    await sql`
      UPDATE "Customer" 
      SET 
        "totalWasteCollected" = "totalWasteCollected" + ${data.weight},
        "co2Saved" = "co2Saved" + ${co2Saved},
        "treesEquivalent" = "treesEquivalent" + ${treesIncrement},
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${data.customerId}
    `

    // Update global aggregate metrics
    await sql`
      UPDATE "GlobalImpact" 
      SET 
        "wasteCollected" = "wasteCollected" + ${data.weight},
        "co2Prevented" = "co2Prevented" + ${co2Saved},
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = 'global-impact'
    `

    updateTag(`customer-${data.customerId}`)
    revalidateTag("global-impact", "max")

    return { success: true, data: { id: collectionId } }
  } catch (error) {
    console.error("[v0] Error logging collection:", error)
    return { success: false, error: "Failed to log collection" }
  }
}
