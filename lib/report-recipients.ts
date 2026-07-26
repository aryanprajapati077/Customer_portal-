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

export function resolveReportRecipients(row: {
  email?: string | null
  primaryPocEmail?: string | null
  collectionPocs?: string | null
}) {
  const main =
    String(row.primaryPocEmail || "").trim() || String(row.email || "").trim()
  const cc = collectionPocEmails(row.collectionPocs, main)
  return { to: main, cc }
}
