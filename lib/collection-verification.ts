import { sql } from "@/lib/db"

export const PENDING_VERIFICATION_STATUS = "Pending verification"

let columnsReady: Promise<void> | null = null

export async function ensureCollectionVerificationColumns() {
  if (!columnsReady) {
    columnsReady = (async () => {
      await sql.query(`ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "verificationStatus" TEXT`)
      await sql.query(`ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "verifiedBy" TEXT`)
      await sql.query(`ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3)`)
      await sql.query(`
        UPDATE "Collection"
        SET "verificationStatus" = CASE
          WHEN LOWER(COALESCE(status, 'completed')) = 'completed' THEN 'verified'
          ELSE 'pending'
        END
        WHERE "verificationStatus" IS NULL
      `)
    })().catch((err) => {
      columnsReady = null
      throw err
    })
  }
  await columnsReady
}

/** Customer totals count only verified (completed) collections. */
export async function refreshCustomerWaste(customerId: string) {
  await sql`
    UPDATE "Customer"
    SET "totalWasteCollected" = (
          SELECT COALESCE(SUM(weight), 0) FROM "Collection"
          WHERE "customerId" = ${customerId}
            AND LOWER(COALESCE(status, 'completed')) = 'completed'
        ),
        "cigaretteButtsCollected" = ROUND((
          SELECT COALESCE(SUM(weight), 0) FROM "Collection"
          WHERE "customerId" = ${customerId}
            AND LOWER(COALESCE(status, 'completed')) = 'completed'
        ) * 3000),
        "microplasticsUpcycled" = ROUND(((
          SELECT COALESCE(SUM(weight), 0) FROM "Collection"
          WHERE "customerId" = ${customerId}
            AND LOWER(COALESCE(status, 'completed')) = 'completed'
        ) * 0.8)::numeric, 2),
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE id = ${customerId}
  `
}
