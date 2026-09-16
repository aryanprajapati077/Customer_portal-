import type { ReportEmailStatusKind } from "@/lib/report-email-status"

export type ReportReasonCategory =
  | "received"
  | "opened"
  | "awaiting_send"
  | "in_queue"
  | "email_bounce"
  | "email_failed"
  | "collection_pending"
  | "service_blocked"
  | "no_email"
  | "other"

export const REPORT_REASON_FILTERS: { id: ReportReasonCategory | "all"; label: string }[] = [
  { id: "all", label: "All reasons" },
  { id: "received", label: "Report received" },
  { id: "opened", label: "Opened report" },
  { id: "awaiting_send", label: "Eligible — not sent yet" },
  { id: "in_queue", label: "In send queue" },
  { id: "email_bounce", label: "Email bounced" },
  { id: "email_failed", label: "Email failed" },
  { id: "collection_pending", label: "Collection pending / incomplete" },
  { id: "service_blocked", label: "Service paused / renewal" },
  { id: "no_email", label: "No valid email" },
  { id: "other", label: "Other" },
]

export function reasonCategoryLabel(id: ReportReasonCategory): string {
  return REPORT_REASON_FILTERS.find((f) => f.id === id)?.label || id
}

export function categorizeReportRow(row: {
  status: ReportEmailStatusKind
  reason: string | null
  emailStatus: string | null
}): ReportReasonCategory {
  if (row.status === "opened") return "opened"
  if (row.status === "sent") return "received"
  if (row.status === "pending") return "awaiting_send"
  if (row.status === "queued") return "in_queue"

  if (row.status === "failed") {
    const hay = `${row.emailStatus || ""} ${row.reason || ""}`.toLowerCase()
    if (hay.includes("bounce")) return "email_bounce"
    return "email_failed"
  }

  if (row.status === "not_eligible") {
    const r = (row.reason || "").toLowerCase()
    if (r.includes("no email")) return "no_email"
    if (r.includes("collection") || r.includes("pending collection")) return "collection_pending"
    if (
      r.includes("inactive") ||
      r.includes("paused") ||
      r.includes("renewal") ||
      r.includes("service not active") ||
      r.includes("service paused")
    ) {
      return "service_blocked"
    }
    return "other"
  }

  return "other"
}

export function emptyReasonSummary(): Record<ReportReasonCategory, number> {
  return {
    received: 0,
    opened: 0,
    awaiting_send: 0,
    in_queue: 0,
    email_bounce: 0,
    email_failed: 0,
    collection_pending: 0,
    service_blocked: 0,
    no_email: 0,
    other: 0,
  }
}
