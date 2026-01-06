"use server"

import { sql, type GlobalImpact } from "@/lib/db"
import { revalidateTag } from "next/cache"

export async function getGlobalImpact() {
  try {
    const result = await sql`
      SELECT * FROM "GlobalImpact" 
      WHERE id = 'global-impact' 
      LIMIT 1
    `
    return result[0] as GlobalImpact | null
  } catch (error) {
    console.error("[v0] Error fetching global impact:", error)
    return null
  }
}

export async function updateGlobalImpact(data: {
  wasteCollected?: number
  productsCreated?: number
  treesEquivalent?: number
  co2Prevented?: number
}) {
  try {
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (data.wasteCollected !== undefined) {
      updates.push(`"wasteCollected" = $${paramIndex++}`)
      values.push(data.wasteCollected)
    }
    if (data.productsCreated !== undefined) {
      updates.push(`"productsCreated" = $${paramIndex++}`)
      values.push(data.productsCreated)
    }
    if (data.treesEquivalent !== undefined) {
      updates.push(`"treesEquivalent" = $${paramIndex++}`)
      values.push(data.treesEquivalent)
    }
    if (data.co2Prevented !== undefined) {
      updates.push(`"co2Prevented" = $${paramIndex++}`)
      values.push(data.co2Prevented)
    }

    updates.push(`"updatedAt" = CURRENT_TIMESTAMP`)

    const query = `
      UPDATE "GlobalImpact" 
      SET ${updates.join(", ")}
      WHERE id = 'global-impact'
      RETURNING *
    `

    const result = await sql(query, values)
    revalidateTag("global-impact", "max")
    return { success: true, data: result[0] }
  } catch (error) {
    console.error("[v0] Error updating global impact:", error)
    return { success: false, error: "Failed to update impact metrics" }
  }
}
