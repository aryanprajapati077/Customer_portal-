/** Extract collection POC emails from Customer.collectionPocs JSON */

import {
  defaultEmailEnabled,
  defaultPocStatus,
  isPocEligibleForEmail,
  parseCollectionPocForms,
  type CollectionPocRecord,
} from "@/lib/poc-config"

export type CollectionPocLike = CollectionPocRecord

export function parseCollectionPocs(raw?: string | null): CollectionPocLike[] {
  return parseCollectionPocForms(raw).map(({ name, email, number, designation, emailEnabled, status }) => ({
    name,
    email,
    number,
    designation,
    emailEnabled,
    status,
  }))
}

export function collectionPocEmails(raw?: string | null, excludeEmail?: string | null): string[] {
  const exclude = (excludeEmail || "").toLowerCase().trim()
  const emails = new Set<string>()
  for (const poc of parseCollectionPocs(raw)) {
    if (!isPocEligibleForEmail(poc)) continue
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
 * - To  = Primary POC email when active + email enabled (falls back to login only when different)
 * - CC  = every eligible Collection POC email (excluding the To address if duplicated)
 */
export function resolveReportRecipients(row: {
  email?: string | null
  primaryPocEmail?: string | null
  primaryPocEmailEnabled?: boolean | null
  primaryPocStatus?: string | null
  collectionPocs?: string | null
}) {
  const primary = String(row.primaryPocEmail || "")
    .toLowerCase()
    .trim()
  const login = String(row.email || "")
    .toLowerCase()
    .trim()

  const primaryEligible =
    primary.includes("@") &&
    isPocEligibleForEmail({
      email: primary,
      emailEnabled: defaultEmailEnabled(row.primaryPocEmailEnabled),
      status: defaultPocStatus(row.primaryPocStatus),
    })

  let to = ""
  if (primaryEligible) {
    to = primary
  } else if (login.includes("@") && login !== primary) {
    to = login
  } else if (login.includes("@") && !primary.includes("@")) {
    to = login
  }

  const cc = collectionPocEmails(row.collectionPocs, to)
  return { to, cc }
}
