import { sql } from "@/lib/db"

export type EmailDeliveryStatus =
  | "queued"
  | "sent"
  | "failed"
  | "bounced"
  | "complained"
  | "delivered"
  | "opened"
  | "clicked"
  | "received"
  | "delayed"

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
  await sql.query(`
    ALTER TABLE "EmailDeliveryLog"
      ADD COLUMN IF NOT EXISTS "openedCount" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "clickedCount" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "openedAt" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "clickedAt" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "subject" TEXT,
      ADD COLUMN IF NOT EXISTS "lastEvent" TEXT
  `)
  await sql.query(`
    CREATE TABLE IF NOT EXISTS "EmailDeliveryEvent" (
      id TEXT PRIMARY KEY,
      "resendId" TEXT,
      email TEXT,
      type TEXT NOT NULL,
      status TEXT,
      error TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await sql.query(`
    CREATE INDEX IF NOT EXISTS "EmailDeliveryEvent_resendId_idx"
    ON "EmailDeliveryEvent" ("resendId")
  `)
  await sql.query(`
    CREATE INDEX IF NOT EXISTS "EmailDeliveryEvent_type_idx"
    ON "EmailDeliveryEvent" (type)
  `)
  await sql.query(`
    CREATE INDEX IF NOT EXISTS "EmailDeliveryEvent_createdAt_idx"
    ON "EmailDeliveryEvent" ("createdAt")
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

function engagementEventName(status: EmailDeliveryStatus) {
  return `email.${status}`
}

const ENGAGEMENT_UPDATE_SQL = `
  UPDATE "EmailDeliveryLog"
  SET
    status = CASE
      WHEN status IN ('bounced', 'failed', 'complained')
        AND $1::text NOT IN ('bounced', 'failed', 'complained') THEN status
      WHEN $1::text IN ('bounced', 'failed', 'complained') THEN $1::text
      WHEN $1::text = 'clicked' THEN 'clicked'
      WHEN $1::text = 'opened' AND status <> 'clicked' THEN 'opened'
      WHEN $1::text = 'delivered' AND status IN ('queued', 'sent', 'delayed', 'received') THEN 'delivered'
      WHEN $1::text = 'sent' AND status IN ('queued') THEN 'sent'
      WHEN $1::text = 'received' THEN 'received'
      WHEN $1::text = 'delayed' AND status IN ('queued', 'sent') THEN 'delayed'
      ELSE status
    END,
    error = COALESCE($2, error),
    "updatedAt" = CURRENT_TIMESTAMP,
    "lastEvent" = $3,
    "deliveredAt" = CASE WHEN $3 = 'email.delivered' THEN COALESCE("deliveredAt", CURRENT_TIMESTAMP) ELSE "deliveredAt" END,
    "openedAt" = CASE WHEN $3 = 'email.opened' THEN COALESCE("openedAt", CURRENT_TIMESTAMP) ELSE "openedAt" END,
    "clickedAt" = CASE WHEN $3 = 'email.clicked' THEN COALESCE("clickedAt", CURRENT_TIMESTAMP) ELSE "clickedAt" END,
    "openedCount" = CASE WHEN $3 = 'email.opened' THEN COALESCE("openedCount", 0) + 1 ELSE "openedCount" END,
    "clickedCount" = CASE WHEN $3 = 'email.clicked' THEN COALESCE("clickedCount", 0) + 1 ELSE "clickedCount" END
`

async function runEngagementUpdate(
  status: EmailDeliveryStatus,
  error: string | null | undefined,
  whereSql: string,
  whereParams: unknown[],
) {
  const eventName = engagementEventName(status)
  const rows = await sql.query<{ id: string }>(
    `${ENGAGEMENT_UPDATE_SQL} WHERE ${whereSql} RETURNING id`,
    [status, error || null, eventName, ...whereParams],
  )
  return rows.length
}

export async function markEmailDeliveryByResendId(
  resendId: string,
  status: EmailDeliveryStatus,
  error?: string | null,
  email?: string | null,
) {
  await ensureEmailDeliveryLogTable()
  if (!resendId) return 0
  const normalized = email ? String(email).toLowerCase().trim() : ""
  if (normalized) {
    const matched = await runEngagementUpdate(
      status,
      error,
      `"resendId" = $4 AND lower(email) = $5`,
      [resendId, normalized],
    )
    if (matched) return matched
  }
  return runEngagementUpdate(status, error, `"resendId" = $4`, [resendId])
}

/** Match the latest outbound log for an address when Resend id matching fails. */
export async function markLatestEngagementByEmail(
  email: string,
  status: EmailDeliveryStatus,
  error?: string | null,
  kind?: string | null,
) {
  await ensureEmailDeliveryLogTable()
  const normalized = String(email || "")
    .toLowerCase()
    .trim()
  if (!normalized) return 0

  if (kind) {
    return runEngagementUpdate(
      status,
      error,
      `id = (
        SELECT id
        FROM "EmailDeliveryLog"
        WHERE lower(email) = $4
          AND status NOT IN ('bounced', 'failed', 'complained')
          AND kind = $5
        ORDER BY "createdAt" DESC
        LIMIT 1
      )`,
      [normalized, kind],
    )
  }

  return runEngagementUpdate(
    status,
    error,
    `id = (
      SELECT id
      FROM "EmailDeliveryLog"
      WHERE lower(email) = $4
        AND status NOT IN ('bounced', 'failed', 'complained')
      ORDER BY "createdAt" DESC
      LIMIT 1
    )`,
    [normalized],
  )
}

export async function markEmailDeliveryForWebhook(input: {
  resendId: string | null
  email: string | null
  status: EmailDeliveryStatus
  error?: string | null
  kind?: string | null
}) {
  const { resendId, email, status, error, kind } = input
  let updated = 0

  if (resendId) {
    updated = await markEmailDeliveryByResendId(resendId, status, error, email)
  }

  const problem = status === "bounced" || status === "failed" || status === "complained"
  const engagement =
    status === "opened" ||
    status === "clicked" ||
    status === "delivered" ||
    status === "sent" ||
    status === "delayed"

  if (!updated && problem && email) {
    updated = await markEmailDeliveryByAddress(email, status, error)
  }

  if (!updated && engagement && email) {
    updated = await markLatestEngagementByEmail(email, status, error, kind)
    if (!updated && kind) {
      updated = await markLatestEngagementByEmail(email, status, error)
    }
  }

  return updated
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
  if (!normalized) return 0
  const rows = await sql`
    UPDATE "EmailDeliveryLog"
    SET status = ${status},
        error = COALESCE(${error || null}, error),
        "updatedAt" = CURRENT_TIMESTAMP,
        "lastEvent" = ${`email.${status}`}
    WHERE id = (
      SELECT id FROM "EmailDeliveryLog"
      WHERE lower(email) = ${normalized}
        AND "resolvedAt" IS NULL
      ORDER BY "createdAt" DESC
      LIMIT 1
    )
    RETURNING id
  `
  return rows.length
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
