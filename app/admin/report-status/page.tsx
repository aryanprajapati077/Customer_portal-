"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AdminPageHeader } from "@/components/admin/admin-list-card"
import { AdminLoadMore } from "@/components/admin/admin-ui"
import {
  type ReportEmailStatusKind,
  type ReportEmailStatusRow,
  type ReportEmailStatusSummary,
  type ReportReasonSummary,
} from "@/lib/report-email-status"
import { REPORT_REASON_FILTERS, type ReportReasonCategory } from "@/lib/report-reason-categories"
import { cn } from "@/lib/utils"
import {
  AlertCircle,
  Clock,
  FileBarChart,
  Loader2,
  MailCheck,
  MailX,
  Package,
  RefreshCw,
  Search,
  Send,
} from "lucide-react"

const PAGE_SIZE = 75

function defaultPeriod() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function statusBadgeClass(status: ReportEmailStatusKind) {
  if (status === "opened") return "border-blue-200 bg-blue-50 text-blue-800"
  if (status === "sent") return "border-[#C8E6D4] bg-[#E8F5E9] text-[#1B7339]"
  if (status === "pending") return "border-amber-200 bg-amber-50 text-amber-800"
  if (status === "queued") return "border-blue-200 bg-blue-50 text-blue-800"
  if (status === "failed") return "border-red-200 bg-red-50 text-red-800"
  return "border-[#E5E5E5] bg-[#FAFAF8] text-[#6B6B6B]"
}

function statusLabel(status: ReportEmailStatusKind) {
  if (status === "opened") return "Opened"
  if (status === "sent") return "Received"
  if (status === "pending") return "Pending send"
  if (status === "queued") return "Queued"
  if (status === "failed") return "Failed"
  if (status === "not_eligible") return "Not eligible"
  return status
}

function reasonIcon(category: ReportReasonCategory) {
  if (category === "collection_pending") return Package
  if (category === "email_bounce" || category === "email_failed") return MailX
  if (category === "service_blocked" || category === "no_email") return AlertCircle
  if (category === "in_queue") return Clock
  if (category === "awaiting_send") return Send
  return MailCheck
}

function detailText(row: ReportEmailStatusRow) {
  if (row.reason) return row.reason
  if (row.status === "opened") return `Opened ${row.openedCount || 1} time(s)`
  if (row.status === "sent" && row.emailStatus) return `Email ${row.emailStatus}`
  if (row.status === "pending") return "Eligible — waiting for bulk send"
  if (row.status === "queued") return "In background send queue"
  return "—"
}

export default function AdminReportStatusPage() {
  const [period, setPeriod] = useState(defaultPeriod)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [reasonFilter, setReasonFilter] = useState<string>("all")
  const [q, setQ] = useState("")
  const [searchApplied, setSearchApplied] = useState("")

  const [summary, setSummary] = useState<ReportEmailStatusSummary | null>(null)
  const [reasonSummary, setReasonSummary] = useState<ReportReasonSummary | null>(null)
  const [rows, setRows] = useState<ReportEmailStatusRow[]>([])
  const [rowsTotal, setRowsTotal] = useState(0)
  const [offset, setOffset] = useState(0)

  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const load = useCallback(
    async (opts?: { append?: boolean; nextOffset?: number }) => {
      const append = opts?.append ?? false
      const useOffset = opts?.nextOffset ?? 0
      if (append) setLoadingMore(true)
      else setLoading(true)

      try {
        const params = new URLSearchParams({
          period,
          status: statusFilter,
          reason: reasonFilter,
          q: searchApplied,
          limit: String(PAGE_SIZE),
          offset: String(useOffset),
        })
        const res = await fetch(`/api/admin/reports/email-status?${params}`)
        const data = await res.json()
        if (!data?.success) return

        setSummary(data.summary)
        setReasonSummary(data.reasonSummary)
        setRowsTotal(data.rowsTotal || 0)
        setOffset(useOffset + (data.rows?.length || 0))
        setRows((prev) => (append ? [...prev, ...(data.rows || [])] : data.rows || []))
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [period, statusFilter, reasonFilter, searchApplied],
  )

  useEffect(() => {
    void load({ append: false, nextOffset: 0 })
  }, [load])

  const applySearch = () => {
    setSearchApplied(q.trim())
  }

  const reasonChips = useMemo(() => {
    if (!reasonSummary) return []
    return REPORT_REASON_FILTERS.filter((f) => f.id !== "all" && reasonSummary[f.id as ReportReasonCategory] > 0)
      .map((f) => ({
        id: f.id,
        label: f.label,
        count: reasonSummary[f.id as ReportReasonCategory],
      }))
      .sort((a, b) => b.count - a.count)
  }, [reasonSummary])

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Report Status"
        description="See who received the monthly ESG report, who is still pending, and exactly why a client did not get it (collection, email bounce, paused service, no email, etc.)."
        icon={<FileBarChart className="h-5 w-5" />}
      />

      <Card className="overflow-hidden rounded-[14px] border-[#ebe9e4] bg-white shadow-sm">
        <CardHeader className="border-b border-[#ebe9e4] bg-[#fafaf8]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle className="text-base">Filters</CardTitle>
              <CardDescription>Pick a report month, then filter by delivery status or skip reason.</CardDescription>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Report month</Label>
                <Input
                  type="month"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-[170px]"
                />
              </div>
              <Button
                className="bg-[#1B7339] hover:bg-[#145a2c]"
                onClick={() => void load({ append: false, nextOffset: 0 })}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          {summary && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              {(
                [
                  ["all", "All clients", summary.total],
                  ["sent", "Received", summary.sent],
                  ["opened", "Opened", summary.opened],
                  ["pending", "Pending", summary.pending],
                  ["queued", "Queued", summary.queued],
                  ["failed", "Failed", summary.failed],
                  ["not_eligible", "Not eligible", summary.not_eligible],
                ] as const
              ).map(([key, label, count]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition",
                    statusFilter === key ? "border-[#1B7339]/40 bg-[#E8F5E9]" : "border-[#ebe9e4] hover:border-[#1B7339]/25",
                  )}
                >
                  <p className="text-[11px] text-[#6B6B6B]">{label}</p>
                  <p className="text-2xl font-bold text-[#141414]">{count}</p>
                </button>
              ))}
            </div>
          )}

          {reasonChips.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B6B6B]">
                Why not sent / blocked
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setReasonFilter("all")}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[12px] font-medium transition",
                    reasonFilter === "all"
                      ? "border-[#1B7339] bg-[#E8F5E9] text-[#1B7339]"
                      : "border-[#ebe9e4] bg-white text-[#555] hover:border-[#1B7339]/30",
                  )}
                >
                  All reasons
                </button>
                {reasonChips.map((chip) => {
                  const Icon = reasonIcon(chip.id as ReportReasonCategory)
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setReasonFilter(chip.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition",
                        reasonFilter === chip.id
                          ? "border-[#1B7339] bg-[#E8F5E9] text-[#1B7339]"
                          : "border-[#ebe9e4] bg-white text-[#555] hover:border-[#1B7339]/30",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {chip.label}
                      <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[10px]">{chip.count}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applySearch()
                }}
                placeholder="Search ID, brand, email, reason…"
              />
            </div>
            <Button variant="outline" onClick={applySearch}>
              Search
            </Button>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="sent">Received</SelectItem>
                <SelectItem value="opened">Opened</SelectItem>
                <SelectItem value="pending">Pending send</SelectItem>
                <SelectItem value="queued">Queued</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="not_eligible">Not eligible</SelectItem>
              </SelectContent>
            </Select>
            <Select value={reasonFilter} onValueChange={setReasonFilter}>
              <SelectTrigger className="w-full lg:w-[220px]">
                <SelectValue placeholder="Reason" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASON_FILTERS.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-14">
              <Loader2 className="h-7 w-7 animate-spin text-[#1B7339]" />
            </div>
          ) : rows.length === 0 ? (
            <p className="py-12 text-center text-sm text-[#6B6B6B]">
              No clients match these filters for {period}.
            </p>
          ) : (
            <>
              <p className="text-[12px] text-[#6B6B6B]">
                Showing {rows.length} of {rowsTotal} clients
              </p>
              <div className="overflow-x-auto rounded-xl border border-[#ebe9e4]">
                <table className="min-w-[960px] w-full text-sm">
                  <thead className="bg-[#fafaf8] text-left text-[10px] font-bold uppercase tracking-[0.08em] text-[#777]">
                    <tr>
                      <th className="px-4 py-3">Client</th>
                      <th className="px-4 py-3">To email</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Reason</th>
                      <th className="px-4 py-3">Details</th>
                      <th className="px-4 py-3">Sent / updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const Icon = reasonIcon(row.reasonCategory)
                      return (
                        <tr key={row.customerId} className="border-t border-[#f0eeea] hover:bg-[#fafcf9]">
                          <td className="px-4 py-3">
                            <Link
                              href={`/admin/customers?open=${encodeURIComponent(row.customerId)}`}
                              className="font-medium text-[#1B7339] hover:underline"
                            >
                              {row.companyName}
                            </Link>
                            <p className="text-xs text-[#6B6B6B]">{row.customerId}</p>
                          </td>
                          <td className="max-w-[200px] truncate px-4 py-3 text-[#555]" title={row.emailTo || ""}>
                            {row.emailTo || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={statusBadgeClass(row.status)}>
                              {statusLabel(row.status)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 text-[12px] text-[#444]">
                              <Icon className="h-3.5 w-3.5 shrink-0 text-[#1B7339]" />
                              {row.reasonCategoryLabel}
                            </span>
                          </td>
                          <td className="max-w-[280px] px-4 py-3 text-[12px] text-[#555]">{detailText(row)}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#555]">
                            {row.openedAt
                              ? new Date(row.openedAt).toLocaleString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : row.sentAt
                                ? new Date(row.sentAt).toLocaleString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "—"}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {rows.length < rowsTotal ? (
                <AdminLoadMore
                  loading={loadingMore}
                  pageSize={PAGE_SIZE}
                  onClick={() => void load({ append: true, nextOffset: offset })}
                />
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
