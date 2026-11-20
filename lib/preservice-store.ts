import { sql } from "@/lib/db"
import { formatPreRef, parsePreRef } from "@/lib/preservice"

export async function ensurePreServiceTable() {
  const g = globalThis as typeof globalThis & { __preServiceTable?: Promise<void> }
  if (!g.__preServiceTable) {
    g.__preServiceTable = sql
      .query(
        `CREATE TABLE IF NOT EXISTS "PreServiceProposal" (
          "id" TEXT PRIMARY KEY,
          "refNo" TEXT NOT NULL UNIQUE,
          "name" TEXT NOT NULL,
          "city" TEXT,
          "kioskType" TEXT,
          "totalValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "status" TEXT NOT NULL DEFAULT 'Draft',
          "config" TEXT NOT NULL,
          "createdBy" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
        )`,
      )
      .then(() => undefined)
      .catch((e) => {
        g.__preServiceTable = undefined
        throw e
      })
  }
  await g.__preServiceTable
}

export async function nextPreRef(): Promise<string> {
  await ensurePreServiceTable()
  const rows = await sql.query<{ refNo: string }>(`SELECT "refNo" FROM "PreServiceProposal"`)
  const max = rows.reduce((m, r) => Math.max(m, parsePreRef(r.refNo) ?? 0), 0)
  return formatPreRef(Math.max(max + 1, 1001))
}
