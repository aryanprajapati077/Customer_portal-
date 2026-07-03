"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
} from "lucide-react"
import {
  buildEsgReportEmailHtml,
  buildEsgReportEmailText,
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

function currentMonthInput(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportRow[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [period, setPeriod] = useState(currentMonthInput())
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [lastResult, setLastResult] = useState<{
    sent: number
    failed: number
    skipped: number
    periodLabel?: string
  } | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/reports")
      const data = await res.json()
      if (data?.success) {
        setReports(data.reports || [])
        setStats(data.stats || null)
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

  const generateMonthly = async () => {
    setGenerating(true)
    setLastResult(null)
    try {
      const res = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate-monthly", months: 12 }),
      })
      const data = await res.json()
      if (data?.success) await load()
    } finally {
      setGenerating(false)
    }
  }

  const sendToAll = async () => {
    if (!confirm(`Send ${period} ESG report emails with PDF attachments to all active clients?`)) return
    setSending(true)
    setLastResult(null)
    try {
      const res = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send-reports", period }),
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

  const previewHtml = buildEsgReportEmailHtml({
    companyName: "Prima Bay",
    contactName: "Partner",
    period: "Jun 26",
    customerId: "BI490",
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Reports & Email Hub
          </div>
          <h1 className="text-3xl font-bold text-foreground">Monthly ESG Reports</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Generate monthly reports for all clients, email personalized ESG PDFs, and manage delivery from one place.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} className="bg-transparent">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Active Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.active_customers ?? "—"}</p>
          </CardContent>
        </Card>
        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-secondary" /> Monthly Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.monthly_reports ?? "—"}</p>
          </CardContent>
        </Card>
        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" /> This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.reports_this_month ?? "—"}</p>
          </CardContent>
        </Card>
        <Card className="glass border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" /> Bulk Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Send PDF reports to all active clients</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Generate Reports
            </CardTitle>
            <CardDescription>
              Creates monthly report entries for every active client (last 12 months). Clients see them in Reports & Documents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={generateMonthly} disabled={generating} className="w-full sm:w-auto">
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate All Monthly Reports
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Safe to run anytime — only missing monthly entries are created.
            </p>
          </CardContent>
        </Card>

        <Card className="glass border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              Email Reports to All Clients
            </CardTitle>
            <CardDescription>
              Sends branded email with ESG report PDF attached to every active client.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report month</label>
              <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} />
            </div>
            <Button onClick={sendToAll} disabled={sending} className="w-full sm:w-auto">
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending emails...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send ESG Reports to All Clients
                </>
              )}
            </Button>

            {lastResult && (
              <div className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Delivery summary {lastResult.periodLabel ? `(${lastResult.periodLabel})` : ""}
                </p>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="inline-flex items-center gap-1 text-secondary">
                    <CheckCircle2 className="w-4 h-4" /> {lastResult.sent} sent
                  </span>
                  <span className="inline-flex items-center gap-1 text-destructive">
                    <AlertCircle className="w-4 h-4" /> {lastResult.failed} failed
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
          <CardTitle>Email Template Preview</CardTitle>
          <CardDescription>What clients receive when you send monthly ESG reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            readOnly
            value={buildEsgReportEmailText({
              companyName: "Prima Bay",
              contactName: "Partner",
              period: "Jun 26",
              customerId: "BI490",
            })}
            rows={8}
            className="font-mono text-xs resize-none bg-muted/30"
          />
          <div
            className="rounded-xl border border-border/50 overflow-hidden"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </CardContent>
      </Card>

      <Card className="glass border-border/50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>Latest generated reports across all clients</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              No reports yet. Click &quot;Generate All Monthly Reports&quot; to create them.
            </p>
          ) : (
            <div className="space-y-3">
              {filtered.slice(0, 30).map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-border/50 bg-background/50"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-medium text-foreground truncate">{r.name}</p>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {r.type}
                      </Badge>
                      {r.period && (
                        <Badge variant="outline" className="text-[10px] bg-primary/5">
                          {r.period}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {r.companyName} · {r.customerId} · {r.email}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {new Date(r.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      r.status === "Active"
                        ? "bg-secondary/10 text-secondary border-secondary/30 shrink-0"
                        : "shrink-0"
                    }
                  >
                    {r.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
