import { sql } from "@/lib/db"
import { resend, getResendFrom } from "@/lib/resend"
import { SITE_URL } from "@/lib/site-config"

export type RenewalResponseRow = {
  id: string
  customerId: string
  companyName: string | null
  email: string | null
  renewalDate: string | Date | null
  status: string
  source: string | null
  notes: string | null
  createdAt: string | Date
  updatedAt: string | Date
}

export async function ensureRenewalResponseTable() {
  await sql.query(`
    CREATE TABLE IF NOT EXISTS "RenewalResponse" (
      id TEXT PRIMARY KEY,
      "customerId" TEXT NOT NULL,
      "companyName" TEXT,
      email TEXT,
      "renewalDate" TIMESTAMP(3),
      status TEXT NOT NULL DEFAULT 'new',
      source TEXT DEFAULT 'renew_now_email',
      notes TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await sql.query(`CREATE INDEX IF NOT EXISTS "RenewalResponse_customerId_idx" ON "RenewalResponse" ("customerId")`)
  await sql.query(`CREATE INDEX IF NOT EXISTS "RenewalResponse_status_idx" ON "RenewalResponse" (status)`)
  await sql.query(`CREATE INDEX IF NOT EXISTS "RenewalResponse_createdAt_idx" ON "RenewalResponse" ("createdAt" DESC)`)
}

/** Keep renewal email CTA pointing at public /renew page even if an old template was saved. */
export async function ensureRenewalCtaPointsToPublicPage() {
  try {
    await sql.query(`
      CREATE TABLE IF NOT EXISTS "EmailTemplate" (
        id TEXT PRIMARY KEY,
        subject TEXT NOT NULL,
        payload TEXT NOT NULL,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
    const rows = await sql`
      SELECT id, payload FROM "EmailTemplate" WHERE id = ${"service_renewal"} LIMIT 1
    `
    if (!rows[0]) return
    const payload = JSON.parse(String((rows[0] as { payload: string }).payload || "{}"))
    const nextUrl = "{{portalUrl}}/renew?c={{customerId}}"
    if (payload.ctaUrl === nextUrl) return
    payload.ctaUrl = nextUrl
    const now = new Date().toISOString()
    await sql`
      UPDATE "EmailTemplate"
      SET payload = ${JSON.stringify(payload)}, "updatedAt" = ${now}
      WHERE id = ${"service_renewal"}
    `
  } catch (error) {
    console.warn("ensureRenewalCtaPointsToPublicPage:", error)
  }
}

export async function recordRenewalInterest(options: {
  customerId: string
  source?: string
}) {
  await ensureRenewalResponseTable()
  const customerId = String(options.customerId || "")
    .trim()
    .toUpperCase()
  if (!customerId) {
    throw new Error("Invalid customer")
  }

  const [customer] = (await sql`
    SELECT id, "companyName", email, "primaryPocEmail", "contractEndDate"
    FROM "Customer"
    WHERE id = ${customerId}
    LIMIT 1
  `) as {
    id: string
    companyName: string
    email: string | null
    primaryPocEmail: string | null
    contractEndDate: string | Date | null
  }[]

  if (!customer) throw new Error("Customer not found")

  // Avoid duplicate "new" clicks within 24h for same client
  const recent = await sql`
    SELECT id FROM "RenewalResponse"
    WHERE "customerId" = ${customer.id}
      AND status = 'new'
      AND "createdAt" > NOW() - INTERVAL '24 hours'
    LIMIT 1
  `
  if (recent[0]) {
    return {
      created: false as const,
      id: String((recent[0] as { id: string }).id),
      customer,
    }
  }

  const id = `rr_${customer.id}_${Date.now().toString(36)}`
  const email =
    String(customer.primaryPocEmail || customer.email || "")
      .toLowerCase()
      .trim() || null
  const now = new Date().toISOString()

  await sql`
    INSERT INTO "RenewalResponse" (
      id, "customerId", "companyName", email, "renewalDate", status, source, "createdAt", "updatedAt"
    ) VALUES (
      ${id},
      ${customer.id},
      ${customer.companyName},
      ${email},
      ${customer.contractEndDate ? new Date(customer.contractEndDate).toISOString() : null},
      ${"new"},
      ${options.source || "renew_now_email"},
      ${now},
      ${now}
    )
  `

  await notifyTeamOfRenewalInterest({
    customerId: customer.id,
    companyName: customer.companyName,
    email,
    renewalDate: customer.contractEndDate,
  })

  return { created: true as const, id, customer }
}

async function notifyTeamOfRenewalInterest(options: {
  customerId: string
  companyName: string
  email: string | null
  renewalDate: string | Date | null
}) {
  if (!resend) return
  const to =
    process.env.SALES_EMAIL?.trim() ||
    process.env.ADMIN_EMAIL?.trim() ||
    "aryan@buffindia.com"
  const renewalLabel = options.renewalDate
    ? new Date(options.renewalDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—"
  const adminUrl = `${SITE_URL}/admin/renewal-responses`

  await resend.emails.send({
    from: getResendFrom(),
    to,
    subject: `Renewal interest — ${options.companyName} (${options.customerId})`,
    text: `A client clicked Renew Now.

Customer: ${options.companyName} (${options.customerId})
Email: ${options.email || "—"}
Contract renewal date: ${renewalLabel}

Open admin: ${adminUrl}
`,
    html: `<p>A client clicked <strong>Renew Now</strong>.</p>
<p><strong>Customer:</strong> ${options.companyName} (${options.customerId})<br/>
<strong>Email:</strong> ${options.email || "—"}<br/>
<strong>Contract renewal date:</strong> ${renewalLabel}</p>
<p><a href="${adminUrl}">Open Renewal Responses</a></p>`,
  })
}
