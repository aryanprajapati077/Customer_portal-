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
} from "lucide-react"
import {
  buildEsgReportEmailHtml,
  buildEsgReportEmailText,
  DEFAULT_ESG_EMAIL_COPY,
  type EsgEmailCopy,
} from "@/lib/email-templates"

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
  } | null>(null)
  const [genMessage, setGenMessage] = useState<string | null>(null)
  const [emailCopy, setEmailCopy] = useState<EsgEmailCopy>(DEFAULT_ESG_EMAIL_COPY)
  const [savingCopy, setSavingCopy] = useState(false)
  const [copyMessage, setCopyMessage] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [reportsRes, customersRes, templateRes] = await Promise.all([
        fetch("/api/admin/reports"),
        fetch("/api/admin/customers"),
        fetch("/api/admin/email-templates"),
      ])
      const reportsData = await reportsRes.json()
      const customersData = await customersRes.json()
      const templateData = await templateRes.json()
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
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return reports
    return reports.filter(
      (r) =>
        r.companyName.toLowerCase().includes(s) ||
        r.customerId.toLowerCase().includes(s) ||
        r.email.toLowerCase().includes(s) ||
        r.name.toLowerCase().includes(s),
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
        body: JSON.stringify({ action: "generate-monthly", months: 12 }),
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

  const sendReports = async () => {
    const personal = sendCustomerId !== "__all__"
    const confirmMsg = personal
      ? `Send ${period} ESG report (PDF + Excel) to customer ${sendCustomerId}?`
      : `Send ${period} ESG report emails with PDF + Excel to all active clients?`
    if (!confirm(confirmMsg)) return

    setSending(true)
    setLastResult(null)
    try {
      const res = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send-reports",
          period,
          ...(personal ? { customerId: sendCustomerId } : {}),
        }),
      })
      const data = await res.json()
      if (data?.success) {
        setLastResult({
          sent: data.sent,
          failed: data.failed,
          skipped: data.skipped,
          periodLabel: data.periodLabel,
        })
        await load()
      } else {
        alert(data?.error || "Failed to send emails")
      }
    } finally {
      setSending(false)
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
          <h1 className="font-[family-name:var(--font-display)] text-[clamp(1.9rem,3vw,2.6rem)] leading-tight tracking-tight">
            Monthly <em className="italic text-[#1B7339]">ESG Reports</em>
          </h1>
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
              <Select value={genCustomerId || undefined} onValueChange={setGenCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {customerOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.id} — {c.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              Send personally to one customer, or to all active clients. Attachments: PDF + Excel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select value={sendCustomerId} onValueChange={setSendCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer or all" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="__all__">All active clients</SelectItem>
                  {customerOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.id} — {c.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Report month *</Label>
              <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} />
            </div>
            <Button
              onClick={sendReports}
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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

      <Card className="glass border-border/50">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>Latest generated reports across all clients</CardDescription>
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
              {filtered.slice(0, 30).map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col gap-3 rounded-xl border border-border/50 bg-background/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
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
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {new Date(r.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        setSendCustomerId(r.customerId)
                        const match = r.period?.match(/(\w{3})\s+(\d{2})/)
                        if (match) {
                          // keep current month picker; user can adjust
                        }
                        setPeriod(period)
                      }}
                    >
                      <Mail className="mr-1.5 h-3.5 w-3.5" />
                      Email this client
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
