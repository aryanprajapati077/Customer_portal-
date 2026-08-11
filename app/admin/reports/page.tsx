"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Loader2,
  FileText,
  Mail,
  Sparkles,
  Send,
  RefreshCw,
  Users,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Search,
  UserRound,
  Download,
  Trash2,
  FileSpreadsheet,
} from "lucide-react"
import { CustomerSearchSelect } from "@/components/admin/customer-search-select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  buildEsgReportEmailHtml,
  buildEsgReportEmailText,
  DEFAULT_ESG_EMAIL_COPY,
  type EsgEmailCopy,
} from "@/lib/email-templates"
import { parsePeriodToMonthKey } from "@/lib/report-periods"
import { resolveReportRecipients } from "@/lib/report-recipients"

type ReportRow = {
  id: string
  customerId: string
  name: string
  date: string
  type: string
  period: string | null
  companyName: string
  email: string
  status: string
  collectionKg?: number
}

type Stats = {
  active_customers: number
  monthly_reports: number
  reports_this_month: number
}

type CustomerOption = {
  id: string
  companyName: string
  email: string
  status: string
}

type DeliveryIssue = {
  id: string
  customerId: string | null
  email: string
  emailRole: string
  kind: string
  status: string
  error: string | null
  period: string | null
  companyName: string | null
  customerCompanyName?: string | null
  loginEmail?: string | null
  primaryPocEmail?: string | null
  createdAt: string
  updatedAt: string
}

function currentMonthInput(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportRow[]>([])
  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")

  const [genCustomerId, setGenCustomerId] = useState("")
  const [genPeriod, setGenPeriod] = useState(currentMonthInput())
  const [generating, setGenerating] = useState(false)

  const [sendCustomerId, setSendCustomerId] = useState("__all__")
  const [period, setPeriod] = useState(currentMonthInput())
  const [sending, setSending] = useState(false)
  const [lastResult, setLastResult] = useState<{
    sent: number
    failed: number
    skipped: number
    periodLabel?: string
    results?: { id: string; email: string; status: string; error?: string }[]
  } | null>(null)
  const [genMessage, setGenMessage] = useState<string | null>(null)
  const [emailCopy, setEmailCopy] = useState<EsgEmailCopy>(DEFAULT_ESG_EMAIL_COPY)
  const [savingCopy, setSavingCopy] = useState(false)
  const [copyMessage, setCopyMessage] = useState<string | null>(null)
  const [renewalPreview, setRenewalPreview] = useState<{
    subject: string
    html: string
    text: string
    trigger?: string
  } | null>(null)

  const [deliveryIssues, setDeliveryIssues] = useState<DeliveryIssue[]>([])
  const [deliveryCounts, setDeliveryCounts] = useState<Record<string, number>>({})
  const [deliveryFilter, setDeliveryFilter] = useState<"all" | "failed" | "bounced" | "complained">(
    "all",
  )
  const [deliveryQ, setDeliveryQ] = useState("")
  const [deliveryLoading, setDeliveryLoading] = useState(false)
  const [editingEmail, setEditingEmail] = useState<Record<string, string>>({})
  const [savingEmailId, setSavingEmailId] = useState<string | null>(null)

  const [sendPreview, setSendPreview] = useState<{
    customerId: string
    period: string
    companyName: string
    to: string
    cc: string[]
  } | null>(null)
  const [loadingSendPreview, setLoadingSendPreview] = useState(false)

  const loadDeliveries = async (status = deliveryFilter, search = deliveryQ) => {
    setDeliveryLoading(true)
    try {
      const params = new URLSearchParams({ status, q: search })
      const res = await fetch(`/api/admin/email-deliveries?${params}`)
      const data = await res.json()
      if (data?.success) {
        setDeliveryIssues(data.deliveries || [])
        setDeliveryCounts(data.counts || {})
      }
    } finally {
      setDeliveryLoading(false)
    }
  }

  const load = async () => {
    setLoading(true)
    try {
      const [reportsRes, customersRes, templateRes, deliveriesRes] = await Promise.all([
        fetch("/api/admin/reports"),
        fetch("/api/admin/customers?fields=options"),
        fetch("/api/admin/email-templates"),
        fetch("/api/admin/email-deliveries"),
      ])
      const reportsData = await reportsRes.json()
      const customersData = await customersRes.json()
      const templateData = await templateRes.json()
      const deliveriesData = await deliveriesRes.json().catch(() => null)
      if (reportsData?.success) {
        setReports(reportsData.reports || [])
        setStats(reportsData.stats || null)
      }
      if (customersData?.success) {
        setCustomers(customersData.customers || [])
      }
      if (templateData?.success && templateData.copy) {
        setEmailCopy(templateData.copy)
      }
      if (templateData?.success && templateData.renewal) {
        setRenewalPreview(templateData.renewal)
      }
      if (deliveriesData?.success) {
        setDeliveryIssues(deliveriesData.deliveries || [])
        setDeliveryCounts(deliveriesData.counts || {})
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    const list = s
      ? reports.filter(
          (r) =>
            r.companyName.toLowerCase().includes(s) ||
            r.customerId.toLowerCase().includes(s) ||
            r.email.toLowerCase().includes(s) ||
            r.name.toLowerCase().includes(s),
        )
      : reports
    return [...list].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
  }, [reports, q])

  const customerOptions = useMemo(
    () =>
      [...customers].sort((a, b) =>
        `${a.companyName} ${a.id}`.localeCompare(`${b.companyName} ${b.id}`),
      ),
    [customers],
  )

  const generateForCustomer = async () => {
    if (!genCustomerId) {
      alert("Select a Customer ID")
      return
    }
    if (!genPeriod) {
      alert("Select a month")
      return
    }
    setGenerating(true)
    setGenMessage(null)
    try {
      const res = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-monthly",
          customerId: genCustomerId,
          period: genPeriod,
        }),
      })
      const data = await res.json()
      if (data?.success) {
        setGenMessage(
          data.created
            ? `Report created for ${genCustomerId} · ${genPeriod}`
            : `Report already exists for ${genCustomerId} · ${genPeriod}`,
        )
        await load()
      } else {
        alert(data?.error || "Failed to generate report")
      }
    } finally {
      setGenerating(false)
    }
  }

  const generateAll = async () => {
    setGenerating(true)
    setGenMessage(null)
    try {
      const res = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate-monthly", months: 120 }),
      })
      const data = await res.json()
      if (data?.success) {
        setGenMessage(
          `Generated missing monthly entries for ${data.customers ?? "all"} active clients (${data.reportsCreated ?? 0} new).`,
        )
        await load()
      } else {
        alert(data?.error || "Failed to generate")
      }
    } finally {
      setGenerating(false)
    }
  }

  const [sendingId, setSendingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null)

  const reportMonthKey = (r: ReportRow): string | null =>
    parsePeriodToMonthKey(r.period, r.date)

  const triggerFileDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadReport = async (r: ReportRow, format: "pdf" | "excel") => {
    const period = reportMonthKey(r)
    if (!period) {
      alert("Could not determine report month for this entry.")
      return
    }
    const key = `${r.id}-${format}`
    setDownloadingKey(key)
    try {
      const url = `/api/admin/reports/download?reportId=${encodeURIComponent(r.id)}&format=${format}`
      const res = await fetch(url, { credentials: "include" })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || "Failed to generate report")
      }
      const blob = await res.blob()
      const disposition = res.headers.get("Content-Disposition")
      const filenameMatch = disposition?.match(/filename="(.+)"/)
      const fallback =
        format === "excel"
          ? `${r.customerId}-Impact-Report.xlsx`
          : `${r.customerId}-ESG-Report.pdf`
      triggerFileDownload(blob, filenameMatch?.[1] || fallback)
    } catch (error) {
      console.error("Report download failed:", error)
      alert(error instanceof Error ? error.message : "Could not download report. Please try again.")
    } finally {
      setDownloadingKey(null)
    }
  }

  const deleteReport = async (r: ReportRow) => {
    if (!confirm(`Delete "${r.name}" for ${r.companyName}?`)) return
    setDeletingId(r.id)
    try {
      const res = await fetch("/api/admin/reports", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: r.id }),
      })
      const data = await res.json()
      if (data?.success) await load()
      else alert(data?.error || "Could not delete report")
    } finally {
      setDeletingId(null)
    }
  }

  const prepareIndividualSend = async (
    customerId: string,
    periodKey: string,
    companyName?: string,
  ) => {
    setLoadingSendPreview(true)
    try {
      const res = await fetch(
        `/api/admin/customers?q=${encodeURIComponent(customerId)}&take=20`,
      )
      const data = await res.json()
      const customer = (data.customers || []).find(
        (c: { id: string }) => c.id === customerId,
      ) as
        | {
            id: string
            companyName: string
            email?: string
            primaryPocEmail?: string | null
            collectionPocs?: string | null
          }
        | undefined
      if (!customer) {
        alert("Customer not found")
        return
      }
      const recipients = resolveReportRecipients(customer)
      if (!recipients.to) {
        alert("No Primary POC email on file for this client.")
        return
      }
      setSendPreview({
        customerId,
        period: periodKey,
        companyName: companyName || customer.companyName || customerId,
        to: recipients.to,
        cc: recipients.cc,
      })
    } catch {
      alert("Could not load recipient emails. Please try again.")
    } finally {
      setLoadingSendPreview(false)
    }
  }

  const sendReports = async (opts?: {
    customerId?: string
    period?: string
    skipConfirm?: boolean
  }) => {
    const targetCustomer = opts?.customerId ?? sendCustomerId
    const targetPeriod = opts?.period ?? period
    const personal = targetCustomer !== "__all__"

    if (personal && !opts?.skipConfirm) {
      const company = customers.find((c) => c.id === targetCustomer)?.companyName
      await prepareIndividualSend(targetCustomer, targetPeriod, company)
      return
    }

    const confirmMsg = `Send ${targetPeriod} ESG report emails to all active clients?\n\nClients with a pending or incomplete collection for this month will be skipped.\n\nTo: each eligible client's Primary POC\nCC: their Collection POCs\nAttachments: PDF + Excel`
    if (!personal && !confirm(confirmMsg)) return

    setSending(true)
    setSendingId(personal ? targetCustomer : "__all__")
    setLastResult(null)
    try {
      const res = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send-reports",
          period: targetPeriod,
          ...(personal ? { customerId: targetCustomer } : {}),
        }),
      })
      const data = await res.json()
      if (data?.success) {
        const queued = Number(data.queued || 0)
        const sent = Number(data.sent || 0) + queued
        setLastResult({
          sent,
          failed: data.failed,
          skipped: data.skipped,
          periodLabel: data.periodLabel,
          results: data.results || [],
        })
        if (personal) {
          alert(data.message || `Report email queued for ${targetCustomer}.`)
        }
        setSendCustomerId(targetCustomer)
        setPeriod(targetPeriod)
        await load()
        await loadDeliveries()
      } else {
        alert(data?.error || "Failed to send emails")
      }
    } finally {
      setSending(false)
      setSendingId(null)
    }
  }

  const saveEmailCopy = async () => {
    setSavingCopy(true)
    setCopyMessage(null)
    try {
      const res = await fetch("/api/admin/email-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ copy: emailCopy }),
      })
      const data = await res.json()
      if (data?.success) {
        setEmailCopy(data.copy)
        setCopyMessage("Email text saved. New sends will use this copy.")
      } else {
        alert(data?.error || "Failed to save")
      }
    } finally {
      setSavingCopy(false)
    }
  }

  const saveCorrectedEmail = async (issue: DeliveryIssue) => {
    if (!issue.customerId) {
      alert("No linked customer for this bounce. Update the client from Customers.")
      return
    }
    const nextEmail = (editingEmail[issue.id] || issue.email).toLowerCase().trim()
    if (!nextEmail.includes("@")) {
      alert("Enter a valid email address")
      return
    }
    setSavingEmailId(issue.id)
    try {
      const res = await fetch("/api/admin/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: issue.customerId,
          primaryPocEmail: nextEmail,
          syncLoginEmail: true,
          resolveEmailIssue: true,
          oldEmail: issue.email,
          emailLogId: issue.id,
        }),
      })
      const data = await res.json()
      if (!data?.success) {
        alert(data?.error || "Could not update email")
        return
      }
      await loadDeliveries()
    } finally {
      setSavingEmailId(null)
    }
  }

  const previewHtml = buildEsgReportEmailHtml(
    {
      companyName: "Prima Bay",
      contactName: "Partner",
      period: "Jul 26",
      customerId: "BI01",
    },
    emailCopy,
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Reports & Email Hub
          </div>
          <h1 className="admin-page-title">Monthly ESG Reports</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Generate by Customer ID + month, email personally or in bulk — each send includes PDF and
            Excel attachments.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} className="bg-transparent">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4 text-primary" /> Active Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.active_customers ?? "—"}</p>
          </CardContent>
        </Card>
        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4 text-secondary" /> Monthly Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.monthly_reports ?? "—"}</p>
          </CardContent>
        </Card>
        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 text-accent" /> This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.reports_this_month ?? "—"}</p>
          </CardContent>
        </Card>
        <Card className="glass border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 text-primary" /> Attachments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Every email includes PDF + Excel</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Generate Report
            </CardTitle>
            <CardDescription>
              Pick a Customer ID and month to create that client’s monthly report entry.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Customer ID *</Label>
              <CustomerSearchSelect
                customers={customerOptions}
                value={genCustomerId}
                onChange={setGenCustomerId}
              />
            </div>
            <div className="space-y-2">
              <Label>Month *</Label>
              <Input
                type="month"
                value={genPeriod}
                onChange={(e) => setGenPeriod(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={generateForCustomer}
                disabled={generating || !genCustomerId}
                className="bg-[#1B7339] hover:bg-[#145a2c]"
              >
                {generating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserRound className="mr-2 h-4 w-4" />
                )}
                Generate for Customer
              </Button>
              <Button variant="outline" onClick={generateAll} disabled={generating}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Generate All (12 months)
              </Button>
            </div>
            {genMessage && (
              <p className="rounded-xl border border-[#C8E6D4] bg-[#E8F5E9] px-3 py-2 text-sm text-[#1B7339]">
                {genMessage}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Email Reports
            </CardTitle>
            <CardDescription>
              To = Primary POC · CC = all Collection POCs. Attachments: PDF + Excel. Send to all skips
              clients with pending or incomplete collections for the selected month.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Customer</Label>
              <CustomerSearchSelect
                customers={customerOptions}
                value={sendCustomerId}
                onChange={setSendCustomerId}
                allValue="__all__"
                allLabel="All active clients"
              />
            </div>
            <div className="space-y-2">
              <Label>Report month *</Label>
              <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} />
            </div>
            <Button
              onClick={() => sendReports()}
              disabled={sending}
              className="bg-[#1B7339] hover:bg-[#145a2c]"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  {sendCustomerId === "__all__"
                    ? "Send ESG Reports to All Clients"
                    : "Send Report to This Customer"}
                </>
              )}
            </Button>

            {lastResult && (
              <div className="space-y-2 rounded-xl border border-border/50 bg-muted/30 p-4">
                <p className="text-sm font-medium text-foreground">
                  Delivery summary {lastResult.periodLabel ? `(${lastResult.periodLabel})` : ""}
                </p>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="inline-flex items-center gap-1 text-secondary">
                    <CheckCircle2 className="h-4 w-4" /> {lastResult.sent} sent
                  </span>
                  <span className="inline-flex items-center gap-1 text-destructive">
                    <AlertCircle className="h-4 w-4" /> {lastResult.failed} failed
                  </span>
                  <span className="text-muted-foreground">{lastResult.skipped} skipped</span>
                </div>
                {!!lastResult.results?.some((r) => r.status === "skipped") && (
                  <div className="mt-2 space-y-1 border-t border-border/40 pt-2">
                    {lastResult.results
                      .filter((r) => r.status === "skipped")
                      .slice(0, 12)
                      .map((r) => (
                        <p key={`${r.id}-${r.email}-skip`} className="text-[12px] text-muted-foreground">
                          {r.id} · {r.email}
                          {r.error ? ` — ${r.error}` : ""}
                        </p>
                      ))}
                    {lastResult.results.filter((r) => r.status === "skipped").length > 12 ? (
                      <p className="text-[11px] text-muted-foreground">
                        + {lastResult.results.filter((r) => r.status === "skipped").length - 12} more skipped
                      </p>
                    ) : null}
                  </div>
                )}
                {!!lastResult.results?.some((r) => r.status === "failed") && (
                  <div className="mt-2 space-y-1 border-t border-border/40 pt-2">
                    {lastResult.results
                      .filter((r) => r.status === "failed")
                      .map((r) => (
                        <p key={`${r.id}-${r.email}`} className="text-[12px] text-destructive">
                          {r.id} · {r.email}
                          {r.error ? ` — ${r.error}` : ""}
                        </p>
                      ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="glass border-border/50">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>
                Latest generated reports, newest first
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search company, ID, email..."
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No reports yet. Generate for a Customer ID + month above.
            </p>
          ) : (
            <div className="space-y-3">
              {filtered.slice(0, 30).map((r) => {
                const kg = Number(r.collectionKg) || 0
                return (
                  <div
                    key={r.id}
                    className="flex flex-col gap-3 rounded-xl border border-border/50 bg-background/50 p-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium text-foreground">{r.name}</p>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {r.type}
                        </Badge>
                        {r.period && (
                          <Badge variant="outline" className="bg-primary/5 text-[10px]">
                            {r.period}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {r.companyName} · {r.customerId} · {r.email}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span>
                          Generated{" "}
                          {new Date(r.date).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="text-[#1B7339] font-semibold">
                          · {kg.toLocaleString("en-IN", { maximumFractionDigits: 1 })} kg collected
                        </span>
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        disabled={downloadingKey === `${r.id}-pdf`}
                        onClick={() => void downloadReport(r, "pdf")}
                      >
                        {downloadingKey === `${r.id}-pdf` ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        PDF
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        disabled={downloadingKey === `${r.id}-excel`}
                        onClick={() => void downloadReport(r, "excel")}
                      >
                        {downloadingKey === `${r.id}-excel` ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Excel
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        disabled={sending || loadingSendPreview}
                        onClick={() => {
                          const periodKey = reportMonthKey(r)
                          if (!periodKey) {
                            alert("Could not determine report month for this entry.")
                            return
                          }
                          void prepareIndividualSend(r.customerId, periodKey, r.companyName)
                        }}
                      >
                        {sending && sendingId === r.customerId ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Mail className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Email
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full border-red-200 text-red-700 hover:bg-red-50"
                        disabled={deletingId === r.id}
                        onClick={() => void deleteReport(r)}
                      >
                        {deletingId === r.id ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Delete
                      </Button>
                      <Badge
                        variant="outline"
                        className={
                          r.status === "Active"
                            ? "shrink-0 border-secondary/30 bg-secondary/10 text-secondary"
                            : "shrink-0"
                        }
                      >
                        {r.status}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass border-destructive/20">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Failed & bounced emails
              </CardTitle>
              <CardDescription>
                Filter clients whose ESG report email failed or bounced. Update the email ID here, then
                resend from Email Reports.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 text-[12px]">
              <Badge variant="outline">Failed: {deliveryCounts.failed || 0}</Badge>
              <Badge variant="outline" className="border-orange-300 text-orange-700">
                Bounced: {deliveryCounts.bounced || 0}
              </Badge>
              <Badge variant="outline">Complaints: {deliveryCounts.complained || 0}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-1.5 sm:w-48">
              <Label>Status filter</Label>
              <Select
                value={deliveryFilter}
                onValueChange={(v) => {
                  const next = v as typeof deliveryFilter
                  setDeliveryFilter(next)
                  loadDeliveries(next, deliveryQ)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All problems</SelectItem>
                  <SelectItem value="failed">Failed sends</SelectItem>
                  <SelectItem value="bounced">Bounced</SelectItem>
                  <SelectItem value="complained">Complaints</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="relative flex-1 space-y-1.5">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={deliveryQ}
                  onChange={(e) => setDeliveryQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") loadDeliveries(deliveryFilter, deliveryQ)
                  }}
                  placeholder="Email, company, customer ID..."
                  className="pl-9"
                />
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => loadDeliveries(deliveryFilter, deliveryQ)}
              disabled={deliveryLoading}
            >
              {deliveryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-2">Refresh</span>
            </Button>
          </div>

          {deliveryLoading && deliveryIssues.length === 0 ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : deliveryIssues.length === 0 ? (
            <p className="rounded-xl border border-border/50 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
              No failed or bounced report emails right now.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/50">
              <table className="w-full min-w-[820px] text-left text-[13px]">
                <thead className="bg-[#EAF6EC] text-[#1B7339]">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">Client</th>
                    <th className="px-3 py-2.5 font-semibold">Bounced / failed email</th>
                    <th className="px-3 py-2.5 font-semibold">Status</th>
                    <th className="px-3 py-2.5 font-semibold">Error</th>
                    <th className="px-3 py-2.5 font-semibold">Update email</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveryIssues.map((issue) => (
                    <tr key={issue.id} className="border-t border-border/40 align-top">
                      <td className="px-3 py-3">
                        <p className="font-semibold text-foreground">
                          {issue.customerCompanyName || issue.companyName || "—"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {issue.customerId || "Unlinked"}
                          {issue.period ? ` · ${issue.period}` : ""}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-destructive">{issue.email}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Role: {issue.emailRole || "to"}
                          {issue.primaryPocEmail ? ` · POC: ${issue.primaryPocEmail}` : ""}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <Badge
                          variant="outline"
                          className={
                            issue.status === "bounced"
                              ? "border-orange-300 bg-orange-50 text-orange-800"
                              : issue.status === "complained"
                                ? "border-purple-300 bg-purple-50 text-purple-800"
                                : "border-red-300 bg-red-50 text-red-800"
                          }
                        >
                          {issue.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 max-w-[220px]">
                        <p className="text-[12px] text-muted-foreground line-clamp-3">
                          {issue.error || "—"}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex min-w-[240px] flex-col gap-2">
                          <Input
                            value={editingEmail[issue.id] ?? issue.email}
                            onChange={(e) =>
                              setEditingEmail((prev) => ({ ...prev, [issue.id]: e.target.value }))
                            }
                            placeholder="Correct email address"
                            className="h-9"
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              className="bg-[#1B7339] hover:bg-[#145a2c]"
                              disabled={!issue.customerId || savingEmailId === issue.id}
                              onClick={() => saveCorrectedEmail(issue)}
                            >
                              {savingEmailId === issue.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                "Save & clear"
                              )}
                            </Button>
                            {issue.customerId && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSendCustomerId(issue.customerId!)
                                  window.scrollTo({ top: 0, behavior: "smooth" })
                                }}
                              >
                                Resend
                              </Button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">
            Tip: Point Resend webhooks to <code className="rounded bg-muted px-1">/api/webhooks/resend</code>{" "}
            for live bounce detection (email.bounced / email.failed / email.complained).
          </p>
        </CardContent>
      </Card>

      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle>Edit Report Email Text</CardTitle>
          <CardDescription>
            Change storytelling copy. Use placeholders: {"{{period}}"}, {"{{company}}"}, {"{{name}}"},{" "}
            {"{{customerId}}"}. Preview updates live.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            {(
              [
                ["subject", "Email subject"],
                ["eyebrow", "Hero eyebrow"],
                ["heroTitleBefore", "Hero title (before accent)"],
                ["heroAccent", "Hero accent (italic)"],
                ["heroIntro", "Hero intro"],
                ["chapter1Label", "Chapter 1 label"],
                ["chapter1Title", "Chapter 1 title"],
                ["chapter1Body", "Chapter 1 body"],
                ["chapter2Label", "Chapter 2 label"],
                ["chapter2Title", "Chapter 2 title"],
                ["chapter2Body", "Chapter 2 body"],
                ["chapter3Label", "Chapter 3 label"],
                ["chapter3Title", "Chapter 3 title"],
                ["chapter3Body", "Chapter 3 body"],
                ["closing", "Closing"],
                ["signOff", "Sign-off name"],
                ["footerLine", "Footer line"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs">{label}</Label>
                {key.includes("Body") || key === "heroIntro" || key === "subject" ? (
                  <Textarea
                    rows={key === "subject" ? 2 : 3}
                    value={emailCopy[key]}
                    onChange={(e) => setEmailCopy((p) => ({ ...p, [key]: e.target.value }))}
                    className="resize-y text-sm"
                  />
                ) : (
                  <Input
                    value={emailCopy[key]}
                    onChange={(e) => setEmailCopy((p) => ({ ...p, [key]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={saveEmailCopy}
              disabled={savingCopy}
              className="rounded-full bg-[#1B7339] hover:bg-[#145a2c]"
            >
              {savingCopy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save email text
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setEmailCopy(DEFAULT_ESG_EMAIL_COPY)}
            >
              Reset to default
            </Button>
          </div>
          {copyMessage && (
            <p className="rounded-xl border border-[#C8E6D4] bg-[#E8F5E9] px-3 py-2 text-sm text-[#1B7339]">
              {copyMessage}
            </p>
          )}
          <div
            className="max-h-[420px] overflow-auto rounded-xl border border-border/50 bg-[#F7F6F2]"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
          <details className="rounded-xl border border-border/50 bg-muted/20 p-3">
            <summary className="cursor-pointer text-sm font-medium">Plain-text version</summary>
            <pre className="mt-3 whitespace-pre-wrap font-mono text-xs text-muted-foreground">
              {buildEsgReportEmailText(
                {
                  companyName: "Prima Bay",
                  contactName: "Partner",
                  period: "Jul 26",
                  customerId: "BI01",
                },
                emailCopy,
              )}
            </pre>
          </details>
        </CardContent>
      </Card>

      {renewalPreview && (
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle>Service Renewal Reminder</CardTitle>
            <CardDescription>
              Trigger: {renewalPreview.trigger || "30 / 15 / 7 days before contract expiry"} · Subject:{" "}
              {renewalPreview.subject}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              className="max-h-[420px] overflow-auto rounded-xl border border-border/50 bg-[#F7F6F2]"
              dangerouslySetInnerHTML={{ __html: renewalPreview.html }}
            />
            <details className="rounded-xl border border-border/50 bg-muted/20 p-3">
              <summary className="cursor-pointer text-sm font-medium">Plain-text version</summary>
              <pre className="mt-3 whitespace-pre-wrap font-mono text-xs text-muted-foreground">
                {renewalPreview.text}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}

      <Dialog open={Boolean(sendPreview)} onOpenChange={(open) => !open && setSendPreview(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm report email</DialogTitle>
            <DialogDescription>
              {sendPreview
                ? `${sendPreview.companyName} · ${sendPreview.period} ESG report`
                : "Review recipients before sending."}
            </DialogDescription>
          </DialogHeader>
          {sendPreview && (
            <div className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">To</p>
                <p className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 font-medium text-foreground">
                  {sendPreview.to}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">CC</p>
                {sendPreview.cc.length > 0 ? (
                  <ul className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                    {sendPreview.cc.map((email) => (
                      <li key={email} className="text-foreground">
                        {email}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-muted-foreground">
                    No Collection POC emails on file
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Attachments: PDF + Excel</p>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setSendPreview(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[#1B7339] hover:bg-[#145a2c]"
              disabled={!sendPreview || sending}
              onClick={() => {
                if (!sendPreview) return
                const { customerId, period } = sendPreview
                setSendPreview(null)
                void sendReports({ customerId, period, skipConfirm: true })
              }}
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
