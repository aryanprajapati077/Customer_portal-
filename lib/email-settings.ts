import { sql } from "@/lib/db"
import { NOTIFICATION_TEMPLATES, type NotificationTemplateId } from "@/lib/notification-email-templates"

/** Extra automated emails not in notification templates */
export const EXTRA_EMAIL_TOGGLES = [
  {
    id: "esg_report",
    name: "ESG Monthly Report",
    description: "Monthly impact report PDF/Excel emailed from Reports & Email.",
  },
  {
    id: "certificate_email",
    name: "Certificate Email",
    description: "Certificate of Services PDF emailed to customers.",
  },
  {
    id: "welcome_email",
    name: "Portal Welcome Email",
    description: "Welcome email with login credentials for new customers.",
  },
  {
    id: "kr_order_confirmation",
    name: "KraftReborn Order Confirmation",
    description: "Order placed confirmation from the customer shop.",
  },
] as const

export type ExtraEmailToggleId = (typeof EXTRA_EMAIL_TOGGLES)[number]["id"]
export type EmailToggleId = NotificationTemplateId | ExtraEmailToggleId

export type EmailToggleRow = {
  id: EmailToggleId
  name: string
  description: string
  enabled: boolean
}

let tableReady: Promise<void> | null = null
let cache: { at: number; map: Map<string, boolean> } | null = null
const CACHE_MS = 30_000

async function ensureTable() {
  if (!tableReady) {
    tableReady = sql
      .query(`
        CREATE TABLE IF NOT EXISTS "EmailToggle" (
          id TEXT PRIMARY KEY,
          enabled BOOLEAN NOT NULL DEFAULT true,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `)
      .then(() => undefined)
      .catch((err) => {
        tableReady = null
        throw err
      })
  }
  await tableReady
}

export function allEmailToggleMeta(): { id: EmailToggleId; name: string; description: string }[] {
  const fromTemplates = NOTIFICATION_TEMPLATES.map((t) => ({
    id: t.id as EmailToggleId,
    name: t.name,
    description: t.description,
  }))
  return [...fromTemplates, ...EXTRA_EMAIL_TOGGLES]
}

async function loadToggleMap(): Promise<Map<string, boolean>> {
  const now = Date.now()
  if (cache && now - cache.at < CACHE_MS) return cache.map

  await ensureTable()
  const rows = await sql`SELECT id, enabled FROM "EmailToggle"`
  const map = new Map<string, boolean>()
  for (const meta of allEmailToggleMeta()) {
    map.set(meta.id, true)
  }
  for (const row of rows as { id: string; enabled: boolean }[]) {
    map.set(row.id, Boolean(row.enabled))
  }
  cache = { at: now, map }
  return map
}

export async function isEmailEnabled(id: EmailToggleId | string): Promise<boolean> {
  const map = await loadToggleMap()
  return map.get(id) !== false
}

export async function listEmailToggles(): Promise<EmailToggleRow[]> {
  const map = await loadToggleMap()
  return allEmailToggleMeta().map((meta) => ({
    ...meta,
    enabled: map.get(meta.id) !== false,
  }))
}

export async function setEmailToggle(id: EmailToggleId, enabled: boolean): Promise<void> {
  await ensureTable()
  const now = new Date().toISOString()
  await sql`
    INSERT INTO "EmailToggle" (id, enabled, "updatedAt")
    VALUES (${id}, ${enabled}, ${now})
    ON CONFLICT (id) DO UPDATE SET
      enabled = EXCLUDED.enabled,
      "updatedAt" = EXCLUDED."updatedAt"
  `
  cache = null
}

export function invalidateEmailToggleCache() {
  cache = null
}
