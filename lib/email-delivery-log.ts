import { sql } from "@/lib/db"

export type EmailDeliveryStatus =
  | "queued"
  | "sent"
  | "failed"
  | "bounced"
  | "complained"
  | "delivered"

export async function ensureEmailDeliveryLogTable() {
  await sql.query(`
    CREATE TABLE IF NOT EXISTS "EmailDeliveryLog" (
      id TEXT PRIMARY KEY,
      "customerId" TEXT,
      email TEXT NOT NULL,
      "emailRole" TEXT DEFAULT 'to',
      kind TEXT NOT NULL DEFAULT 'esg_report',
      status TEXT NOT NULL,
      error TEXT,
      "resendId" TEXT,
      period TEXT,
      "companyName" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "resolvedAt" TIMESTAMP(3)
    )
  `)
  await sql.query(`
    CREATE INDEX IF NOT EXISTS "EmailDeliveryLog_status_idx"
    ON "EmailDeliveryLog" (status)
  `)
  await sql.query(`
    CREATE INDEX IF NOT EXISTS "EmailDeliveryLog_email_idx"
    ON "EmailDeliveryLog" (email)
  `)
  await sql.query(`
    CREATE INDEX IF NOT EXISTS "EmailDeliveryLog_customerId_idx"
    ON "EmailDeliveryLog" ("customerId")
  `)
  await sql.query(`
    CREATE INDEX IF NOT EXISTS "EmailDeliveryLog_resendId_idx"
    ON "EmailDeliveryLog" ("resendId")
  `)
}

export async function logEmailDelivery(input: {
  customerId?: string | null
  email: string
  emailRole?: string
  kind?: string
  status: EmailDeliveryStatus
  error?: string | null
  resendId?: string | null
  period?: string | null
  companyName?: string | null
}) {
  await ensureEmailDeliveryLogTable()
  const id = `edl_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  const email = String(input.email || "")
    .toLowerCase()
    .trim()
  if (!email) return null

  await sql`
    INSERT INTO "EmailDeliveryLog" (
      id, "customerId", email, "emailRole", kind, status, error, "resendId", period, "companyName"
    ) VALUES (
      ${id},
      ${input.customerId || null},
      ${email},
      ${input.emailRole || "to"},
      ${input.kind || "esg_report"},
      ${input.status},
      ${input.error || null},
      ${input.resendId || null},
      ${input.period || null},
      ${input.companyName || null}
    )
  `
  return id
}

export async function markEmailDeliveryByResendId(
  resendId: string,
  status: EmailDeliveryStatus,
  error?: string | null,
) {
  await ensureEmailDeliveryLogTable()
  if (!resendId) return
  await sql`
    UPDATE "EmailDeliveryLog"
    SET status = ${status},
        error = COALESCE(${error || null}, error),
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "resendId" = ${resendId}
  `
}

export async function markEmailDeliveryByAddress(
  email: string,
  status: EmailDeliveryStatus,
  error?: string | null,
) {
  await ensureEmailDeliveryLogTable()
  const normalized = String(email || "")
    .toLowerCase()
    .trim()
  if (!normalized) return
  await sql`
    UPDATE "EmailDeliveryLog"
    SET status = ${status},
        error = COALESCE(${error || null}, error),
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE lower(email) = ${normalized}
      AND "resolvedAt" IS NULL
      AND status IN ('queued', 'sent', 'delivered', 'failed')
  `
}

export async function listProblemEmailDeliveries(options?: {
  status?: string
  q?: string
}) {
  await ensureEmailDeliveryLogTable()
  const status = options?.status || "all"
  const q = (options?.q || "").trim().toLowerCase()

  const rows = await sql`
    SELECT
      l.id,
      l."customerId",
      l.email,
      l."emailRole",
      l.kind,
      l.status,
      l.error,
      l."resendId",
      l.period,
      l."companyName",
      l."createdAt",
      l."updatedAt",
      l."resolvedAt",
      c."companyName" AS "customerCompanyName",
      c.email AS "loginEmail",
      c."primaryPocEmail"
    FROM "EmailDeliveryLog" l
    LEFT JOIN "Customer" c ON c.id = l."customerId"
    WHERE l."resolvedAt" IS NULL
      AND l.status IN ('failed', 'bounced', 'complained')
    ORDER BY l."updatedAt" DESC
    LIMIT 300
  `

  let list = rows as Record<string, unknown>[]
  if (status !== "all") {
    list = list.filter((r) => String(r.status) === status)
  }
  if (q) {
    list = list.filter((r) => {
      const hay = [
        r.email,
        r.companyName,
        r.customerCompanyName,
        r.customerId,
        r.loginEmail,
        r.primaryPocEmail,
        r.error,
      ]
        .map((v) => String(v || "").toLowerCase())
        .join(" ")
      return hay.includes(q)
    })
  }
  return list
}

export async function resolveEmailDeliveryLogsForCustomer(customerId: string, oldEmail?: string) {
  await ensureEmailDeliveryLogTable()
  if (oldEmail) {
    const normalized = oldEmail.toLowerCase().trim()
    await sql`
      UPDATE "EmailDeliveryLog"
      SET "resolvedAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "customerId" = ${customerId}
        AND lower(email) = ${normalized}
        AND "resolvedAt" IS NULL
    `
  } else {
    await sql`
      UPDATE "EmailDeliveryLog"
      SET "resolvedAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "customerId" = ${customerId}
        AND "resolvedAt" IS NULL
        AND status IN ('failed', 'bounced', 'complained')
    `
  }
}

export async function resolveEmailDeliveryLog(id: string) {
  await ensureEmailDeliveryLogTable()
  await sql`
    UPDATE "EmailDeliveryLog"
    SET "resolvedAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP
    WHERE id = ${id}
  `
}
