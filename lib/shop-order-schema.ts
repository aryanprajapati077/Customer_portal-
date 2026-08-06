import { sql } from "@/lib/db"

let colorColReady: Promise<void> | null = null

export async function ensureOrderItemColorColumn() {
  if (!colorColReady) {
    colorColReady = sql
      .query(`ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "selectedColor" TEXT`)
      .then(() => undefined)
      .catch((err) => {
        colorColReady = null
        throw err
      })
  }
  await colorColReady
}
