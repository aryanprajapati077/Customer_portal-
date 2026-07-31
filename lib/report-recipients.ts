/** Extract collection POC emails from Customer.collectionPocs JSON */

export type CollectionPocLike = {
  name?: string
  email?: string
  number?: string
  designation?: string
}

export function parseCollectionPocs(raw?: string | null): CollectionPocLike[] {
  if (!raw?.trim()) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function collectionPocEmails(raw?: string | null, excludeEmail?: string | null): string[] {
  const exclude = (excludeEmail || "").toLowerCase().trim()
  const emails = new Set<string>()
  for (const poc of parseCollectionPocs(raw)) {
    const email = String(poc.email || "")
      .toLowerCase()
      .trim()
    if (!email || !email.includes("@")) continue
    if (exclude && email === exclude) continue
    emails.add(email)
  }
  return [...emails]
}

/**
 * ESG report recipients:
 * - To  = Primary POC email (falls back to login email only if primary is missing)
 * - CC  = every Collection POC email (excluding the To address if duplicated)
 */
export function resolveReportRecipients(row: {
  email?: string | null
  primaryPocEmail?: string | null
  collectionPocs?: string | null
}) {
  const primary = String(row.primaryPocEmail || "")
    .toLowerCase()
    .trim()
  const login = String(row.email || "")
    .toLowerCase()
    .trim()
  const to = (primary.includes("@") ? primary : "") || (login.includes("@") ? login : "")
  const cc = collectionPocEmails(row.collectionPocs, to)
  return { to, cc }
}
