import type { ReportReasonCategory } from "@/lib/report-reason-categories"

/** Shared types for report delivery status (safe for client components). */

export type ReportEmailStatusKind =
  | "sent"
  | "opened"
  | "pending"
  | "queued"
  | "failed"
  | "not_eligible"

export type ReportEmailStatusRow = {
  customerId: string
  companyName: string
  emailTo: string | null
  status: ReportEmailStatusKind
  emailStatus: string | null
  reason: string | null
  reasonCategory: ReportReasonCategory
  reasonCategoryLabel: string
  sentAt: string | null
  openedAt: string | null
  openedCount: number
}

export type ReportEmailStatusSummary = {
  total: number
  sent: number
  opened: number
  pending: number
  queued: number
  failed: number
  not_eligible: number
}

export type ReportReasonSummary = Record<ReportReasonCategory, number>
