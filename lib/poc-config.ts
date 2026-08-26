/** Shared POC email + status settings for primary and collection contacts. */

export type PocStatus = "Active" | "Inactive"

export const POC_STATUS_OPTIONS: PocStatus[] = ["Active", "Inactive"]

export type CollectionPocRecord = {
  name: string
  email: string
  number: string
  designation?: string
  emailEnabled?: boolean
  status?: PocStatus | string
}

export type CollectionPocForm = {
  name: string
  email: string
  number: string
  designation: string
  emailEnabled: boolean
  status: PocStatus
}

export function defaultPocStatus(raw?: string | null): PocStatus {
  return String(raw || "Active").toLowerCase() === "inactive" ? "Inactive" : "Active"
}

export function defaultEmailEnabled(raw?: boolean | null): boolean {
  return raw !== false
}

export function emptyCollectionPocForm(): CollectionPocForm {
  return {
    name: "",
    email: "",
    number: "",
    designation: "",
    emailEnabled: true,
    status: "Active",
  }
}

export function parseCollectionPocForms(raw?: string | null): CollectionPocForm[] {
  if (!raw?.trim()) return [emptyCollectionPocForm()]
  try {
    const parsed = JSON.parse(raw) as CollectionPocRecord[]
    if (!Array.isArray(parsed) || parsed.length === 0) return [emptyCollectionPocForm()]
    return parsed.map((p) => ({
      name: String(p?.name || ""),
      email: String(p?.email || ""),
      number: String(p?.number || ""),
      designation: String(p?.designation || ""),
      emailEnabled: defaultEmailEnabled(p?.emailEnabled),
      status: defaultPocStatus(p?.status),
    }))
  } catch {
    return [emptyCollectionPocForm()]
  }
}

export function normalizeCollectionPocs(raw: unknown): CollectionPocRecord[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((p) => ({
      name: String(p?.name || "").trim(),
      email: String(p?.email || "").trim().toLowerCase(),
      number: String(p?.number || "").trim(),
      designation: String(p?.designation || "").trim() || undefined,
      emailEnabled: defaultEmailEnabled(p?.emailEnabled),
      status: defaultPocStatus(p?.status),
    }))
    .filter((p) => p.name || p.email || p.number)
}

export function isPocEligibleForEmail(poc: {
  email?: string | null
  emailEnabled?: boolean | null
  status?: string | null
}): boolean {
  if (defaultPocStatus(poc.status) === "Inactive") return false
  if (!defaultEmailEnabled(poc.emailEnabled)) return false
  return String(poc.email || "")
    .trim()
    .includes("@")
}
