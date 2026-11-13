import { sql } from "@/lib/db"
import { randomUUID } from "crypto"
import { formatPiNo, parsePiNo, validateGstin, type QuotationConfig } from "@/lib/quotation"

export async function ensureQuotationTable() {
  const g = globalThis as typeof globalThis & { __quotationTable?: Promise<void> }
  if (!g.__quotationTable) {
    g.__quotationTable = sql
      .query(
        `CREATE TABLE IF NOT EXISTS "Quotation" (
          "id" TEXT PRIMARY KEY,
          "piNo" TEXT NOT NULL UNIQUE,
          "clientName" TEXT NOT NULL,
          "gstin" TEXT,
          "kioskType" TEXT,
          "sez" BOOLEAN NOT NULL DEFAULT false,
          "grandTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "status" TEXT NOT NULL DEFAULT 'Draft',
          "config" TEXT NOT NULL,
          "createdBy" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
        )`,
      )
      .then(() => undefined)
      .catch((e) => {
        g.__quotationTable = undefined
        throw e
      })
  }
  await g.__quotationTable
}

export async function nextPiNo(): Promise<string> {
  await ensureQuotationTable()
  const rows = await sql.query<{ piNo: string }>(`SELECT "piNo" FROM "Quotation"`)
  const max = rows.reduce((m, r) => Math.max(m, parsePiNo(r.piNo) ?? 0), 0)
  return formatPiNo(Math.max(max + 1, 1990))
}

export async function ensureQuotationClientTable() {
  const g = globalThis as typeof globalThis & { __quotationClientTable?: Promise<void> }
  if (!g.__quotationClientTable) {
    g.__quotationClientTable = (async () => {
      await sql.query(
        `CREATE TABLE IF NOT EXISTS "QuotationClient" (
          "id" TEXT PRIMARY KEY,
          "brandName" TEXT NOT NULL,
          "tradeName" TEXT,
          "gstin" TEXT,
          "data" TEXT NOT NULL,
          "createdBy" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
        )`,
      )
      await sql.query(`ALTER TABLE "QuotationClient" ADD COLUMN IF NOT EXISTS "gstin" TEXT`)
      await sql.query(
        `UPDATE "QuotationClient" SET "gstin" = NULLIF(data::json->'bill'->>'gstin','') WHERE "gstin" IS NULL`,
      ).catch(() => undefined)
      await sql
        .query(`CREATE UNIQUE INDEX IF NOT EXISTS "QuotationClient_gstin_key" ON "QuotationClient" ("gstin") WHERE "gstin" IS NOT NULL`)
        .catch(() => undefined)
    })().catch((e) => {
      g.__quotationClientTable = undefined
      throw e
    })
  }
  await g.__quotationClientTable
}

/** Save/refresh the client for this quotation. GSTIN (billing) is the unique key; everything else is overwritten. */
export async function upsertClientFromConfig(c: QuotationConfig, email: string | null): Promise<string | null> {
  const gstin = c.bill.gstin
  const v = validateGstin(gstin)
  if (!gstin || (!v.valid && !v.checksumOnly)) return null
  const brand = c.brandName || c.clientName
  if (!brand) return null
  await ensureQuotationClientTable()
  const data = JSON.stringify({ clientName: c.clientName, city: c.city, bill: c.bill, ship: c.ship, sez: c.sez })
  const rows = await sql.query<{ id: string }>(
    `INSERT INTO "QuotationClient" ("id","brandName","tradeName","gstin","data","createdBy")
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT ("gstin") WHERE "gstin" IS NOT NULL
     DO UPDATE SET "brandName"=EXCLUDED."brandName","tradeName"=EXCLUDED."tradeName","data"=EXCLUDED."data","updatedAt"=NOW()
     RETURNING "id"`,
    [randomUUID(), brand, c.tradeName || null, gstin, data, email],
  )
  return rows[0]?.id ?? null
}
