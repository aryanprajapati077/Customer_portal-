import { sql } from "@/lib/db"
import { ensureEmailDeliveryLogTable } from "@/lib/email-delivery-log"

export type EmailStatusFilters = {
  from?: string
  to?: string
  status?: string
  kind?: string
  q?: string
  take?: number
  offset?: number
}

function addFilters(filters: EmailStatusFilters) {
  const values: unknown[] = []
  const clauses: string[] = ["1=1"]

  if (filters.from && /^\d{4}-\d{2}-\d{2}$/.test(filters.from)) {
    values.push(filters.from)
    clauses.push(`l."createdAt" >= $${values.length}::date`)
  }
  if (filters.to && /^\d{4}-\d{2}-\d{2}$/.test(filters.to)) {
    values.push(filters.to)
    clauses.push(`l."createdAt" < ($${values.length}::date + INTERVAL '1 day')`)
  }
  if (filters.status && filters.status !== "all") {
    values.push(filters.status)
    clauses.push(`l.status = $${values.length}`)
  }
  if (filters.kind && filters.kind !== "all") {
    values.push(filters.kind)
    clauses.push(`l.kind = $${values.length}`)
  }
  if (filters.q?.trim()) {
    values.push(`%${filters.q.trim().toLowerCase()}%`)
    const i = values.length
    clauses.push(`(
      lower(l.email) LIKE $${i}
      OR lower(COALESCE(l."companyName", '')) LIKE $${i}
      OR lower(COALESCE(l."customerId", '')) LIKE $${i}
      OR lower(COALESCE(l."resendId", '')) LIKE $${i}
      OR lower(COALESCE(c."companyName", '')) LIKE $${i}
    )`)
  }

  return { where: clauses.join(" AND "), values }
}

export async function getEmailStatusDashboard(filters: EmailStatusFilters) {
  await ensureEmailDeliveryLogTable()
  const { where, values } = addFilters(filters)
  const take = Math.min(200, Math.max(1, Number(filters.take) || 80))
  const offset = Math.max(0, Number(filters.offset) || 0)

  const summarySql = `
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE l.status = 'queued')::int AS queued,
      COUNT(*) FILTER (WHERE l.status = 'sent')::int AS sent,
      COUNT(*) FILTER (WHERE l.status = 'delivered')::int AS delivered,
      COUNT(*) FILTER (WHERE l.status = 'opened' OR COALESCE(l."openedCount", 0) > 0)::int AS opened,
      COUNT(*) FILTER (WHERE l.status = 'clicked' OR COALESCE(l."clickedCount", 0) > 0)::int AS clicked,
      COUNT(*) FILTER (WHERE l.status = 'bounced')::int AS bounced,
      COUNT(*) FILTER (WHERE l.status = 'complained')::int AS complained,
      COUNT(*) FILTER (WHERE l.status = 'failed')::int AS failed,
      COUNT(*) FILTER (WHERE l.status = 'received')::int AS received,
      COUNT(*) FILTER (WHERE l.status = 'delayed')::int AS delayed
    FROM "EmailDeliveryLog" l
    LEFT JOIN "Customer" c ON c.id = l."customerId"
    WHERE ${where}
  `

  const dailySql = `
    SELECT
      to_char(date_trunc('day', l."createdAt"), 'YYYY-MM-DD') AS date,
      COUNT(*) FILTER (WHERE l.status IN ('sent', 'delivered', 'opened', 'clicked', 'delayed'))::int AS sent,
      COUNT(*) FILTER (WHERE l.status IN ('delivered', 'opened', 'clicked') OR l."deliveredAt" IS NOT NULL)::int AS delivered,
      COUNT(*) FILTER (WHERE COALESCE(l."openedCount", 0) > 0 OR l.status IN ('opened', 'clicked'))::int AS opened,
      COUNT(*) FILTER (WHERE COALESCE(l."clickedCount", 0) > 0 OR l.status = 'clicked')::int AS clicked,
      COUNT(*) FILTER (WHERE l.status = 'bounced')::int AS bounced,
      COUNT(*) FILTER (WHERE l.status = 'failed')::int AS failed
    FROM "EmailDeliveryLog" l
    LEFT JOIN "Customer" c ON c.id = l."customerId"
    WHERE ${where}
    GROUP BY 1
    ORDER BY 1 ASC
  `

  const kindSql = `
    SELECT COALESCE(l.kind, 'unknown') AS kind, COUNT(*)::int AS count
    FROM "EmailDeliveryLog" l
    LEFT JOIN "Customer" c ON c.id = l."customerId"
    WHERE ${where}
    GROUP BY 1
    ORDER BY count DESC
  `

  const listSql = `
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
      l."openedCount",
      l."clickedCount",
      l."openedAt",
      l."clickedAt",
      l."deliveredAt",
      l."lastEvent",
      c."companyName" AS "customerCompanyName"
    FROM "EmailDeliveryLog" l
    LEFT JOIN "Customer" c ON c.id = l."customerId"
    WHERE ${where}
    ORDER BY l."createdAt" DESC
    LIMIT ${take} OFFSET ${offset}
  `

  const countSql = `
    SELECT COUNT(*)::int AS n
    FROM "EmailDeliveryLog" l
    LEFT JOIN "Customer" c ON c.id = l."customerId"
    WHERE ${where}
  `

  const kindsSql = `
    SELECT DISTINCT kind FROM "EmailDeliveryLog" WHERE kind IS NOT NULL ORDER BY kind
  `

  const [summaryRows, daily, byKind, rows, totalRows, kinds] = await Promise.all([
    sql.query(summarySql, values),
    sql.query(dailySql, values),
    sql.query(kindSql, values),
    sql.query(listSql, values),
    sql.query<{ n: number }>(countSql, values),
    sql.query<{ kind: string }>(kindsSql),
  ])

  const summary = (summaryRows[0] || {}) as Record<string, number>
  const sentBase =
    Number(summary.sent || 0) +
    Number(summary.delivered || 0) +
    Number(summary.opened || 0) +
    Number(summary.clicked || 0) +
    Number(summary.delayed || 0)
  const deliveredBase =
    Number(summary.delivered || 0) + Number(summary.opened || 0) + Number(summary.clicked || 0)
  const denom = sentBase + Number(summary.bounced || 0) + Number(summary.failed || 0) || 1

  const pct = (n: number, d: number) => (d <= 0 ? 0 : Math.round((n / d) * 1000) / 10)

  return {
    summary: {
      total: Number(summary.total || 0),
      queued: Number(summary.queued || 0),
      sent: sentBase,
      delivered: deliveredBase,
      opened: Number(summary.opened || 0),
      clicked: Number(summary.clicked || 0),
      bounced: Number(summary.bounced || 0),
      complained: Number(summary.complained || 0),
      failed: Number(summary.failed || 0),
      received: Number(summary.received || 0),
      delayed: Number(summary.delayed || 0),
    },
    rates: {
      delivery: pct(deliveredBase, denom),
      open: pct(Number(summary.opened || 0), deliveredBase || 1),
      click: pct(Number(summary.clicked || 0), deliveredBase || 1),
      bounce: pct(Number(summary.bounced || 0), denom),
      fail: pct(Number(summary.failed || 0), denom),
    },
    daily,
    byKind,
    rows,
    totalRows: totalRows[0]?.n || 0,
    kinds: kinds.map((k) => k.kind).filter(Boolean),
    take,
    offset,
  }
}
