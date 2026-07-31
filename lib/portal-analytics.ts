import { createHash, randomBytes } from "crypto"
import { sql } from "@/lib/db"

const ONLINE_WINDOW_MS = 5 * 60 * 1000

export async function ensurePortalAnalyticsTables() {
  const g = globalThis as typeof globalThis & { __buffPortalAnalytics?: Promise<void> }
  if (!g.__buffPortalAnalytics) {
    g.__buffPortalAnalytics = sql
      .query(
        `
      CREATE TABLE IF NOT EXISTS "PortalSession" (
        id TEXT PRIMARY KEY,
        "customerId" TEXT NOT NULL,
        email TEXT,
        "companyName" TEXT,
        "loginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "logoutAt" TIMESTAMP(3),
        path TEXT,
        "userAgent" TEXT,
        "ipHash" TEXT,
        "endedReason" TEXT
      );
      CREATE INDEX IF NOT EXISTS "PortalSession_customerId_idx" ON "PortalSession" ("customerId");
      CREATE INDEX IF NOT EXISTS "PortalSession_lastSeenAt_idx" ON "PortalSession" ("lastSeenAt");
      CREATE INDEX IF NOT EXISTS "PortalSession_loginAt_idx" ON "PortalSession" ("loginAt");

      CREATE TABLE IF NOT EXISTS "PortalPageView" (
        id TEXT PRIMARY KEY,
        "sessionId" TEXT,
        "customerId" TEXT NOT NULL,
        path TEXT NOT NULL,
        "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "PortalPageView_customerId_idx" ON "PortalPageView" ("customerId");
      CREATE INDEX IF NOT EXISTS "PortalPageView_viewedAt_idx" ON "PortalPageView" ("viewedAt");
      CREATE INDEX IF NOT EXISTS "PortalPageView_path_idx" ON "PortalPageView" (path);
    `,
      )
      .then(() => undefined)
      .catch((err) => {
        g.__buffPortalAnalytics = undefined
        throw err
      })
  }
  await g.__buffPortalAnalytics
}

function newId(prefix: string) {
  return `${prefix}_${Date.now()}_${randomBytes(4).toString("hex")}`
}

export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null
  return createHash("sha256").update(ip.trim()).digest("hex").slice(0, 24)
}

/** Sync id for setting the cookie before awaiting DB (keeps login fast). */
export function createPortalSessionId(): string {
  return newId("ps")
}

export async function startPortalSession(input: {
  customerId: string
  email?: string | null
  companyName?: string | null
  userAgent?: string | null
  ip?: string | null
  path?: string | null
  sessionId?: string
}): Promise<string> {
  await ensurePortalAnalyticsTables()
  const id = input.sessionId || newId("ps")

  // Close any stale open sessions for this customer (single active session tracking)
  await sql`
    UPDATE "PortalSession"
    SET "logoutAt" = CURRENT_TIMESTAMP,
        "endedReason" = COALESCE("endedReason", 'replaced')
    WHERE "customerId" = ${input.customerId}
      AND "logoutAt" IS NULL
  `

  await sql`
    INSERT INTO "PortalSession" (
      id, "customerId", email, "companyName", "loginAt", "lastSeenAt",
      path, "userAgent", "ipHash"
    ) VALUES (
      ${id},
      ${input.customerId},
      ${input.email || null},
      ${input.companyName || null},
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP,
      ${input.path || "/dashboard"},
      ${input.userAgent ? String(input.userAgent).slice(0, 400) : null},
      ${hashIp(input.ip)}
    )
  `

  return id
}

export async function heartbeatPortalSession(input: {
  sessionId: string
  customerId: string
  path?: string | null
}): Promise<boolean> {
  await ensurePortalAnalyticsTables()
  const rows = await sql`
    UPDATE "PortalSession"
    SET "lastSeenAt" = CURRENT_TIMESTAMP,
        path = COALESCE(${input.path || null}, path)
    WHERE id = ${input.sessionId}
      AND "customerId" = ${input.customerId}
      AND "logoutAt" IS NULL
    RETURNING id
  `
  return Boolean(rows[0])
}

export async function recordPortalPageView(input: {
  sessionId?: string | null
  customerId: string
  path: string
}) {
  await ensurePortalAnalyticsTables()
  const path = String(input.path || "").slice(0, 300)
  if (!path.startsWith("/dashboard")) return

  await sql`
    INSERT INTO "PortalPageView" (id, "sessionId", "customerId", path, "viewedAt")
    VALUES (
      ${newId("pv")},
      ${input.sessionId || null},
      ${input.customerId},
      ${path},
      CURRENT_TIMESTAMP
    )
  `
}

export async function endPortalSession(
  sessionId: string | null | undefined,
  customerId?: string | null,
  reason: string = "logout",
) {
  await ensurePortalAnalyticsTables()
  if (sessionId) {
    await sql`
      UPDATE "PortalSession"
      SET "logoutAt" = CURRENT_TIMESTAMP,
          "lastSeenAt" = CURRENT_TIMESTAMP,
          "endedReason" = ${reason}
      WHERE id = ${sessionId}
        AND "logoutAt" IS NULL
    `
    return
  }
  if (customerId) {
    await sql`
      UPDATE "PortalSession"
      SET "logoutAt" = CURRENT_TIMESTAMP,
          "lastSeenAt" = CURRENT_TIMESTAMP,
          "endedReason" = ${reason}
      WHERE "customerId" = ${customerId}
        AND "logoutAt" IS NULL
    `
  }
}

export type PortalAnalyticsSnapshot = {
  onlineNow: number
  loginsToday: number
  uniqueVisitorsToday: number
  uniqueVisitors7d: number
  uniqueVisitors30d: number
  totalSessions: number
  avgSessionMinutes7d: number
  pageViewsToday: number
  dailyLogins: { date: string; count: number; uniqueCustomers: number }[]
  topPages: { path: string; views: number }[]
  onlineSessions: {
    id: string
    customerId: string
    companyName: string | null
    email: string | null
    loginAt: string
    lastSeenAt: string
    path: string | null
  }[]
  recentSessions: {
    id: string
    customerId: string
    companyName: string | null
    email: string | null
    loginAt: string
    lastSeenAt: string
    logoutAt: string | null
    path: string | null
    endedReason: string | null
    online: boolean
  }[]
}

function isOnline(lastSeenAt: Date | string, logoutAt: Date | string | null) {
  if (logoutAt) return false
  const last = new Date(lastSeenAt).getTime()
  return Date.now() - last <= ONLINE_WINDOW_MS
}

export async function getPortalAnalyticsSnapshot(): Promise<PortalAnalyticsSnapshot> {
  await ensurePortalAnalyticsTables()

  const [stats] = (await sql`
    SELECT
      (SELECT COUNT(*)::int FROM "PortalSession"
        WHERE "logoutAt" IS NULL
          AND "lastSeenAt" >= NOW() - INTERVAL '5 minutes') AS "onlineNow",
      (SELECT COUNT(*)::int FROM "PortalSession"
        WHERE "loginAt"::date = CURRENT_DATE) AS "loginsToday",
      (SELECT COUNT(DISTINCT "customerId")::int FROM "PortalSession"
        WHERE "loginAt"::date = CURRENT_DATE) AS "uniqueVisitorsToday",
      (SELECT COUNT(DISTINCT "customerId")::int FROM "PortalSession"
        WHERE "loginAt" >= NOW() - INTERVAL '7 days') AS "uniqueVisitors7d",
      (SELECT COUNT(DISTINCT "customerId")::int FROM "PortalSession"
        WHERE "loginAt" >= NOW() - INTERVAL '30 days') AS "uniqueVisitors30d",
      (SELECT COUNT(*)::int FROM "PortalSession") AS "totalSessions",
      (SELECT COALESCE(AVG(
          EXTRACT(EPOCH FROM (COALESCE("logoutAt", "lastSeenAt") - "loginAt")) / 60.0
        ), 0)::float
        FROM "PortalSession"
        WHERE "loginAt" >= NOW() - INTERVAL '7 days') AS "avgSessionMinutes7d",
      (SELECT COUNT(*)::int FROM "PortalPageView"
        WHERE "viewedAt"::date = CURRENT_DATE) AS "pageViewsToday"
  `) as {
    onlineNow: number
    loginsToday: number
    uniqueVisitorsToday: number
    uniqueVisitors7d: number
    uniqueVisitors30d: number
    totalSessions: number
    avgSessionMinutes7d: number
    pageViewsToday: number
  }[]

  const dailyLogins = (await sql`
    SELECT
      to_char(d::date, 'YYYY-MM-DD') AS date,
      COALESCE(s.cnt, 0)::int AS count,
      COALESCE(s.uniq, 0)::int AS "uniqueCustomers"
    FROM generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, INTERVAL '1 day') AS d
    LEFT JOIN (
      SELECT
        "loginAt"::date AS day,
        COUNT(*)::int AS cnt,
        COUNT(DISTINCT "customerId")::int AS uniq
      FROM "PortalSession"
      WHERE "loginAt" >= CURRENT_DATE - INTERVAL '13 days'
      GROUP BY 1
    ) s ON s.day = d::date
    ORDER BY d ASC
  `) as { date: string; count: number; uniqueCustomers: number }[]

  const topPages = (await sql`
    SELECT path, COUNT(*)::int AS views
    FROM "PortalPageView"
    WHERE "viewedAt" >= NOW() - INTERVAL '7 days'
    GROUP BY path
    ORDER BY views DESC
    LIMIT 10
  `) as { path: string; views: number }[]

  const onlineSessions = (await sql`
    SELECT id, "customerId", "companyName", email, "loginAt", "lastSeenAt", path
    FROM "PortalSession"
    WHERE "logoutAt" IS NULL
      AND "lastSeenAt" >= NOW() - INTERVAL '5 minutes'
    ORDER BY "lastSeenAt" DESC
    LIMIT 100
  `) as {
    id: string
    customerId: string
    companyName: string | null
    email: string | null
    loginAt: string
    lastSeenAt: string
    path: string | null
  }[]

  const recentRaw = (await sql`
    SELECT id, "customerId", "companyName", email, "loginAt", "lastSeenAt", "logoutAt", path, "endedReason"
    FROM "PortalSession"
    ORDER BY "loginAt" DESC
    LIMIT 100
  `) as {
    id: string
    customerId: string
    companyName: string | null
    email: string | null
    loginAt: string
    lastSeenAt: string
    logoutAt: string | null
    path: string | null
    endedReason: string | null
  }[]

  return {
    onlineNow: stats?.onlineNow ?? 0,
    loginsToday: stats?.loginsToday ?? 0,
    uniqueVisitorsToday: stats?.uniqueVisitorsToday ?? 0,
    uniqueVisitors7d: stats?.uniqueVisitors7d ?? 0,
    uniqueVisitors30d: stats?.uniqueVisitors30d ?? 0,
    totalSessions: stats?.totalSessions ?? 0,
    avgSessionMinutes7d: Math.round(Number(stats?.avgSessionMinutes7d || 0) * 10) / 10,
    pageViewsToday: stats?.pageViewsToday ?? 0,
    dailyLogins,
    topPages,
    onlineSessions: onlineSessions.map((s) => ({
      ...s,
      loginAt: new Date(s.loginAt).toISOString(),
      lastSeenAt: new Date(s.lastSeenAt).toISOString(),
    })),
    recentSessions: recentRaw.map((s) => ({
      ...s,
      loginAt: new Date(s.loginAt).toISOString(),
      lastSeenAt: new Date(s.lastSeenAt).toISOString(),
      logoutAt: s.logoutAt ? new Date(s.logoutAt).toISOString() : null,
      online: isOnline(s.lastSeenAt, s.logoutAt),
    })),
  }
}

export const PORTAL_SESSION_COOKIE = "buffindia_portal_session"
