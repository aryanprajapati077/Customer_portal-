import { sql } from "@/lib/db"
import {
  DEFAULT_ESG_EMAIL_COPY,
  mergeEsgEmailCopy,
  type EsgEmailCopy,
} from "@/lib/email-templates"

async function ensureEmailTemplateTable() {
  await sql.query(`
    CREATE TABLE IF NOT EXISTS "EmailTemplate" (
      id TEXT PRIMARY KEY,
      subject TEXT NOT NULL,
      payload TEXT NOT NULL,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

export async function getEsgEmailCopy(): Promise<EsgEmailCopy> {
  try {
    await ensureEmailTemplateTable()
    const rows = await sql`
      SELECT subject, payload FROM "EmailTemplate" WHERE id = ${"esg_report"} LIMIT 1
    `
    if (!rows[0]) return DEFAULT_ESG_EMAIL_COPY
    const payload = JSON.parse(String((rows[0] as { payload: string }).payload || "{}"))
    return mergeEsgEmailCopy({
      ...payload,
      subject: String((rows[0] as { subject: string }).subject || DEFAULT_ESG_EMAIL_COPY.subject),
    })
  } catch {
    return DEFAULT_ESG_EMAIL_COPY
  }
}

export async function saveEsgEmailCopy(copy: EsgEmailCopy): Promise<EsgEmailCopy> {
  await ensureEmailTemplateTable()
  const merged = mergeEsgEmailCopy(copy)
  const { subject, ...rest } = merged
  const payload = JSON.stringify(rest)
  const now = new Date().toISOString()

  await sql`
    INSERT INTO "EmailTemplate" (id, subject, payload, "updatedAt")
    VALUES (${"esg_report"}, ${subject}, ${payload}, ${now})
    ON CONFLICT (id) DO UPDATE SET
      subject = EXCLUDED.subject,
      payload = EXCLUDED.payload,
      "updatedAt" = EXCLUDED."updatedAt"
  `
  return merged
}
