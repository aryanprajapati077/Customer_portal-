"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertCircle,
  Eye,
  Inbox,
  Loader2,
  Mail,
  MailCheck,
  MailX,
  MousePointerClick,
  RefreshCw,
  Search,
  Send,
} from "lucide-react"
import { AdminPageHeader } from "@/components/admin/admin-list-card"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

type Summary = {
  total: number
  queued: number
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  complained: number
  failed: number
  received: number
  delayed: number
}

type Row = {
  id: string
  customerId: string | null
  email: string
  emailRole: string | null
  kind: string
  status: string
  error: string | null
  resendId: string | null
  period: string | null
  companyName: string | null
  customerCompanyName: string | null
  createdAt: string
  openedCount: number | null
  clickedCount: number | null
  lastEvent: string | null
}

type Payload = {
  summary: Summary
  rates: { delivery: number; open: number; click: number; bounce: number; fail: number }
  daily: {
    date: string
    sent: number
    delivered: number
    opened: number
    clicked: number
    bounced: number
    failed: number
  }[]
  byKind: { kind: string; count: number }[]
  rows: Row[]
  totalRows: number
  kinds: string[]
  take: number
  offset: number
}

const STATUS_OPTIONS = [
  "all",
  "queued",
  "sent",
  "delivered",
  "opened",
  "clicked",
  "bounced",
  "failed",
  "complained",
  "received",
  "delayed",
]

const COLORS = {
  sent: "#94A3B8",
  delivered: "#1B7339",
  opened: "#2563EB",
  clicked: "#7C3AED",
  bounced: "#EA580C",
  failed: "#DC2626",
}

function localIsoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function defaultFrom() {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return localIsoDate(d)
}

function fmt(dt: string | null | undefined) {
  if (!dt) return "—"
  return new Date(dt).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    delivered: "bg-[#E8F5E9] text-[#1B7339]",
    opened: "bg-blue-50 text-blue-700",
    clicked: "bg-violet-50 text-violet-700",
    sent: "bg-slate-100 text-slate-700",
    queued: "bg-amber-50 text-amber-800",
    bounced: "bg-orange-50 text-orange-700",
    failed: "bg-red-50 text-red-700",
    complained: "bg-red-100 text-red-800",
    received: "bg-emerald-50 text-emerald-800",
    delayed: "bg-yellow-50 text-yellow-800",
  }
  return map[status] || "bg-muted text-muted-foreground"
}

export default function AdminEmailStatusPage() {
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(() => localIsoDate(new Date()))
  const [status, setStatus] = useState("all")
  const [kind, setKind] = useState("all")
  const [q, setQ] = useState("")
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<Payload | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        from,
        to,
        status,
        kind,
        q,
        take: "80",
        offset: String(offset),
      })
      const res = await fetch(`/api/admin/email-status?${params}`, { credentials: "include" })
      const json = await res.json()
      if (json?.success) setData(json)
    } finally {
      setLoading(false)
    }
  }, [from, to, status, kind, q, offset])

  useEffect(() => {
    const t = window.setTimeout(load, 200)
    return () => window.clearTimeout(t)
  }, [load])

  const kpis = useMemo(() => {
    const s = data?.summary
    return [
      { label: "Sent", value: s?.sent ?? "—", icon: Send, desc: "Accepted by Resend" },
      { label: "Delivered", value: s?.delivered ?? "—", icon: MailCheck, desc: `${data?.rates.delivery ?? 0}% delivery` },
      { label: "Opened", value: s?.opened ?? "—", icon: Eye, desc: `${data?.rates.open ?? 0}% of delivered` },
      { label: "Clicked", value: s?.clicked ?? "—", icon: MousePointerClick, desc: `${data?.rates.click ?? 0}% of delivered` },
      { label: "Bounced", value: s?.bounced ?? "—", icon: MailX, desc: `${data?.rates.bounce ?? 0}% bounce` },
      { label: "Failed", value: s?.failed ?? "—", icon: AlertCircle, desc: `${data?.rates.fail ?? 0}% fail` },
      { label: "Complained", value: s?.complained ?? "—", icon: Mail, desc: "Marked as spam" },
      { label: "Received", value: s?.received ?? "—", icon: Inbox, desc: "Inbound to inbox" },
    ]
  }, [data])

  const pieData = useMemo(() => {
    if (!data) return []
    return [
      { name: "Delivered", value: data.summary.delivered, color: COLORS.delivered },
      { name: "Opened", value: Math.max(0, data.summary.opened - data.summary.clicked), color: COLORS.opened },
      { name: "Clicked", value: data.summary.clicked, color: COLORS.clicked },
      { name: "Bounced", value: data.summary.bounced, color: COLORS.bounced },
      { name: "Failed", value: data.summary.failed, color: COLORS.failed },
    ].filter((d) => d.value > 0)
  }, [data])

  const take = data?.take || 80
  const totalRows = data?.totalRows || 0
  const page = Math.floor(offset / take) + 1
  const pages = Math.max(1, Math.ceil(totalRows / take))

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={<MailCheck className="h-6 w-6 text-primary" />}
        title="Email Status"
        description="Live Resend delivery analytics — delivered, opened, clicked, bounced, failed, and inbound"
        actions={
          <Button variant="outline" onClick={load} disabled={loading} className="rounded-lg">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <p className="rounded-xl border border-[#E2EBE4] bg-[#F7FBF7] px-4 py-3 text-sm text-[#3A3A3A]">
        Resend webhook URL:{" "}
        <code className="rounded bg-white px-1.5 py-0.5 text-[12px]">https://impact.buffindia.com/api/webhooks/resend</code>
        {" "}· Enable sent, delivered, opened, clicked, bounced, complained, failed, received.
        Open/click counts need tracking enabled in Resend.
      </p>

      <Card className="glass border-border/50">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-6">
          <label className="space-y-1 text-xs font-semibold text-muted-foreground">
            From
            <Input type="date" value={from} onChange={(e) => { setOffset(0); setFrom(e.target.value) }} />
          </label>
          <label className="space-y-1 text-xs font-semibold text-muted-foreground">
            To
            <Input type="date" value={to} onChange={(e) => { setOffset(0); setTo(e.target.value) }} />
          </label>
          <label className="space-y-1 text-xs font-semibold text-muted-foreground">
            Status
            <Select value={status} onValueChange={(v) => { setOffset(0); setStatus(v) }}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "all" ? "All statuses" : s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="space-y-1 text-xs font-semibold text-muted-foreground">
            Email type
            <Select value={kind} onValueChange={(v) => { setOffset(0); setKind(v) }}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {(data?.kinds || []).map((k) => (
                  <SelectItem key={k} value={k}>
                    {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="space-y-1 text-xs font-semibold text-muted-foreground sm:col-span-2">
            Search
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Email, company, customer ID, Resend ID"
                value={q}
                onChange={(e) => { setOffset(0); setQ(e.target.value) }}
              />
            </div>
          </label>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <Card key={k.label} className="glass border-border/50">
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F5E9] text-[#1B7339]">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{k.label}</p>
                  <p className="text-2xl font-semibold text-foreground">{k.value}</p>
                  <p className="text-xs text-muted-foreground">{k.desc}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass border-border/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Volume by day</CardTitle>
            <CardDescription>Sent, delivered, opened, clicked, bounced, failed</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {loading && !data ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.daily || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="sent" name="Sent" stroke={COLORS.sent} fill={COLORS.sent} fillOpacity={0.12} />
                  <Area type="monotone" dataKey="delivered" name="Delivered" stroke={COLORS.delivered} fill={COLORS.delivered} fillOpacity={0.18} />
                  <Area type="monotone" dataKey="opened" name="Opened" stroke={COLORS.opened} fill={COLORS.opened} fillOpacity={0.12} />
                  <Area type="monotone" dataKey="clicked" name="Clicked" stroke={COLORS.clicked} fill={COLORS.clicked} fillOpacity={0.12} />
                  <Area type="monotone" dataKey="bounced" name="Bounced" stroke={COLORS.bounced} fill={COLORS.bounced} fillOpacity={0.2} />
                  <Area type="monotone" dataKey="failed" name="Failed" stroke={COLORS.failed} fill={COLORS.failed} fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Outcome mix</CardTitle>
            <CardDescription>Share of delivery results</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {pieData.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No events in this range</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={2}>
                    {pieData.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {!!data?.byKind?.length && (
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-base">By email type</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {data.byKind.map((k) => (
              <button
                key={k.kind}
                type="button"
                onClick={() => { setKind(k.kind); setOffset(0) }}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  kind === k.kind ? "border-[#1B7339] bg-[#E8F5E9] text-[#1B7339]" : "border-border bg-white"
                }`}
              >
                {k.kind} · {k.count}
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="glass border-border/50 overflow-hidden">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Email log</CardTitle>
            <CardDescription>{totalRows} matching records · page {page} of {pages}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={offset <= 0} onClick={() => setOffset(Math.max(0, offset - take))}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={offset + take >= totalRows} onClick={() => setOffset(offset + take)}>
              Next
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-[#F7FBF7] text-left text-[11px] uppercase tracking-wide text-[#1B7339]">
              <tr>
                <th className="px-4 py-2">When</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">To</th>
                <th className="px-4 py-2">Client</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Opens / Clicks</th>
                <th className="px-4 py-2">Period</th>
              </tr>
            </thead>
            <tbody>
              {(data?.rows || []).map((r) => (
                <tr key={r.id} className="border-t border-border/50">
                  <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">{fmt(r.createdAt)}</td>
                  <td className="px-4 py-2">
                    <Badge className={statusBadge(r.status)}>{r.status}</Badge>
                  </td>
                  <td className="px-4 py-2">
                    <div className="font-medium">{r.email}</div>
                    {r.error ? <div className="max-w-[280px] truncate text-xs text-destructive">{r.error}</div> : null}
                  </td>
                  <td className="px-4 py-2">
                    <div>{r.customerCompanyName || r.companyName || "—"}</div>
                    <div className="text-xs text-muted-foreground">{r.customerId || ""}</div>
                  </td>
                  <td className="px-4 py-2">{r.kind}</td>
                  <td className="px-4 py-2">{r.openedCount || 0} / {r.clickedCount || 0}</td>
                  <td className="px-4 py-2 text-muted-foreground">{r.period || "—"}</td>
                </tr>
              ))}
              {!loading && !(data?.rows || []).length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    No email events for these filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
