import { sql } from "@/lib/db"
import {
  NOTIFICATION_TEMPLATES,
  buildNotificationEmail,
  getTemplateMeta,
  mergeNotificationCopy,
  type NotificationTemplateCopy,
  type NotificationTemplateId,
} from "@/lib/notification-email-templates"
import { resend, getResendFrom } from "@/lib/resend"
import { SITE_URL } from "@/lib/site-config"
import { queueEmail } from "@/lib/email-queue"

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

export async function getNotificationTemplate(
  id: NotificationTemplateId,
): Promise<NotificationTemplateCopy> {
  const meta = getTemplateMeta(id)
  if (!meta) throw new Error(`Unknown template: ${id}`)

  try {
    await ensureEmailTemplateTable()
    const rows = await sql`
      SELECT subject, payload FROM "EmailTemplate" WHERE id = ${id} LIMIT 1
    `
    if (!rows[0]) return meta.defaults
    const payload = JSON.parse(String((rows[0] as { payload: string }).payload || "{}"))
    return mergeNotificationCopy(meta.defaults, {
      ...payload,
      subject: String((rows[0] as { subject: string }).subject || meta.defaults.subject),
    })
  } catch {
    return meta.defaults
  }
}

export async function saveNotificationTemplate(
  id: NotificationTemplateId,
  copy: Partial<NotificationTemplateCopy>,
): Promise<NotificationTemplateCopy> {
  const meta = getTemplateMeta(id)
  if (!meta) throw new Error(`Unknown template: ${id}`)
  await ensureEmailTemplateTable()
  const merged = mergeNotificationCopy(meta.defaults, copy)
  const { subject, ...rest } = merged
  const payload = JSON.stringify(rest)
  const now = new Date().toISOString()

  await sql`
    INSERT INTO "EmailTemplate" (id, subject, payload, "updatedAt")
    VALUES (${id}, ${subject}, ${payload}, ${now})
    ON CONFLICT (id) DO UPDATE SET
      subject = EXCLUDED.subject,
      payload = EXCLUDED.payload,
      "updatedAt" = EXCLUDED."updatedAt"
  `
  return merged
}

export async function listNotificationTemplates() {
  await ensureEmailTemplateTable()
  const results = []
  for (const meta of NOTIFICATION_TEMPLATES) {
    const copy = await getNotificationTemplate(meta.id)
    results.push({
      id: meta.id,
      name: meta.name,
      description: meta.description,
      placeholders: meta.placeholders,
      trigger: copy.trigger || meta.defaults.trigger,
      subject: copy.subject,
      copy,
      defaults: meta.defaults,
    })
  }
  return results
}

export async function seedNotificationTemplates() {
  for (const meta of NOTIFICATION_TEMPLATES) {
    const rows = await sql`
      SELECT id FROM "EmailTemplate" WHERE id = ${meta.id} LIMIT 1
    `
    if (!rows[0]) {
      await saveNotificationTemplate(meta.id, meta.defaults)
    }
  }
}

/** Build + optionally queue/send a notification email using saved template copy */
export async function sendNotificationEmail(options: {
  templateId: NotificationTemplateId
  to: string
  vars: Record<string, string>
  otpHighlight?: string
  queue?: boolean
  label?: string
  attachments?: { filename: string; content: Buffer | string }[]
  replyTo?: string
}) {
  const to = String(options.to || "")
    .toLowerCase()
    .trim()
  if (!to.includes("@")) return { sent: false, reason: "no_email" as const }

  const copy = await getNotificationTemplate(options.templateId)
  const built = buildNotificationEmail(
    copy,
    { portalUrl: SITE_URL, ...options.vars },
    { otpHighlight: options.otpHighlight },
  )

  const send = async () => {
    if (!resend) {
      console.warn(`[notify:${options.templateId}] RESEND_API_KEY missing — would send to`, to)
      return { sent: false as const, reason: "no_resend" as const, ...built }
    }
    await resend.emails.send({
      from: getResendFrom(),
      to,
      replyTo: options.replyTo,
      subject: built.subject,
      html: built.html,
      text: built.text,
      attachments: options.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
      })),
    })
    return { sent: true as const, ...built }
  }

  if (options.queue !== false) {
    queueEmail(options.label || options.templateId, send)
    return { queued: true as const, ...built }
  }

  return send()
}
