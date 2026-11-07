import { sql } from "@/lib/db"

/** Ensure KR credit lock columns exist (idempotent). */
export async function ensureKrCreditsLockColumns() {
  const g = globalThis as typeof globalThis & { __buffKrLockCols?: Promise<void> }
  if (!g.__buffKrLockCols) {
    g.__buffKrLockCols = sql
      .query(
        `
      ALTER TABLE "Customer"
        ADD COLUMN IF NOT EXISTS "krCreditsLocked" BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "krCreditsLockedAt" TIMESTAMP(3),
        ADD COLUMN IF NOT EXISTS "krCreditsLockedReason" TEXT
    `,
      )
      .then(() => undefined)
      .catch((err) => {
        g.__buffKrLockCols = undefined
        throw err
      })
  }
  await g.__buffKrLockCols
}

export const KR_CREDITS_LOCKED_MESSAGE =
  "Your service payment is pending. KR credits are locked until payment is cleared."

export const KR_UNLOCK_CATEGORY = "kr_unlock"
export const KR_UNLOCK_SOURCE = "kr-lock-popup"

export async function isCustomerKrCreditsLocked(customerId: string): Promise<boolean> {
  await ensureKrCreditsLockColumns()
  const rows = await sql`
    SELECT "krCreditsLocked"
    FROM "Customer"
    WHERE id = ${customerId}
    LIMIT 1
  `
  return Boolean((rows[0] as { krCreditsLocked?: boolean } | undefined)?.krCreditsLocked)
}
