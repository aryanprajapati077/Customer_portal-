"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Activity,
  BarChart3,
  Clock,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  Users,
} from "lucide-react"
import {
  AdminListCard,
  AdminListRow,
  AdminPageHeader,
} from "@/components/admin/admin-list-card"
import {
  AdminDetailSheet,
  AdminSheetField,
  AdminSheetSection,
} from "@/components/admin/admin-detail-sheet"

type Analytics = {
  onlineNow: number
  loginsToday: number
  uniqueVisitorsToday: number
  uniqueVisitors7d: number
  uniqueVisitors30d: number
  totalSessions: number
  avgSessionMinutes7d: number
  pageViewsToday: number
  dailyLogins: { date: string; count: number; uniqueCustomers: number }[]
  topPages: { path: string; views: number }[]
  onlineSessions: {
    id: string
    customerId: string
    companyName: string | null
    email: string | null
    loginAt: string
    lastSeenAt: string
    path: string | null
  }[]
  recentSessions: {
    id: string
    customerId: string
    companyName: string | null
    email: string | null
    loginAt: string
    lastSeenAt: string
    logoutAt: string | null
    path: string | null
    endedReason: string | null
    online: boolean
  }[]
}

function fmt(dt: string | null | undefined) {
  if (!dt) return "—"
  return new Date(dt).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function shortDate(isoDate: string) {
  const d = new Date(`${isoDate}T12:00:00`)
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [selected, setSelected] = useState<Analytics["recentSessions"][number] | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/analytics")
      const json = await res.json()
      if (json?.success) setData(json.analytics)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const t = window.setInterval(load, 30_000)
    return () => window.clearInterval(t)
  }, [load])

  const filteredRecent = useMemo(() => {
    const rows = data?.recentSessions || []
    const s = q.trim().toLowerCase()
    if (!s) return rows
    return rows.filter(
      (r) =>
        (r.companyName || "").toLowerCase().includes(s) ||
        (r.email || "").toLowerCase().includes(s) ||
        r.customerId.toLowerCase().includes(s) ||
        (r.path || "").toLowerCase().includes(s),
    )
  }, [data?.recentSessions, q])

  const maxDaily = Math.max(1, ...(data?.dailyLogins.map((d) => d.count) || [1]))

  const stats = [
    {
      label: "Online now",
      value: data?.onlineNow ?? "—",
      icon: Activity,
      desc: "Active in last 5 min",
    },
    {
      label: "Logins today",
      value: data?.loginsToday ?? "—",
      icon: Users,
      desc: `${data?.uniqueVisitorsToday ?? 0} unique clients`,
    },
    {
      label: "Visitors (7d)",
      value: data?.uniqueVisitors7d ?? "—",
      icon: Eye,
      desc: `${data?.uniqueVisitors30d ?? 0} in 30 days`,
    },
    {
      label: "Avg session",
      value: data ? `${data.avgSessionMinutes7d}m` : "—",
      icon: Clock,
      desc: "Last 7 days",
    },
    {
      label: "Page views today",
      value: data?.pageViewsToday ?? "—",
      icon: BarChart3,
      desc: "Dashboard pages",
    },
    {
      label: "Total sessions",
      value: data?.totalSessions ?? "—",
      icon: Users,
      desc: "All recorded logins",
    },
  ]

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={<BarChart3 className="h-6 w-6 text-primary" />}
        title="Portal Analytics"
        description="Live sessions, visits, and client portal activity — auto-refreshes every 30s"
        actions={
          <Button variant="outline" onClick={load} disabled={loading} className="rounded-lg">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label} className="glass border-border/50">
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F5E9] text-[#1B7339]">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground">{s.desc}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Logins — last 14 days</CardTitle>
            <CardDescription>Daily sessions and unique clients</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && !data ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="flex h-44 items-end gap-1.5">
                {(data?.dailyLogins || []).map((d) => (
                  <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-md bg-[#1B7339]/85 transition-all"
                      style={{ height: `${Math.max(6, (d.count / maxDaily) * 100)}%` }}
                      title={`${d.count} logins · ${d.uniqueCustomers} unique`}
                    />
                    <span className="text-[9px] text-muted-foreground">{shortDate(d.date)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top pages (7 days)</CardTitle>
            <CardDescription>Most visited portal paths</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.topPages || []).length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No page views yet — appear after clients browse the portal.
              </p>
            ) : (
              (data?.topPages || []).map((p) => (
                <div
                  key={p.path}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#E2EBE4] px-3 py-2.5"
                >
                  <p className="truncate text-[13px] font-medium">{p.path}</p>
                  <Badge variant="outline" className="shrink-0 border-[#C8E6C9] bg-[#E8F5E9] text-[#1B7339]">
                    {p.views}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <AdminListCard
        title="Online now"
        description="Clients active in the last 5 minutes"
        count={data?.onlineSessions.length || 0}
        loading={loading && !data}
        isEmpty={!data?.onlineSessions.length}
        emptyMessage="Nobody online right now."
      >
        {(data?.onlineSessions || []).map((row) => (
          <AdminListRow key={row.id}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1B7339] opacity-40" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#1B7339]" />
                  </span>
                  <p className="truncate text-sm font-semibold">{row.companyName || row.customerId}</p>
                  <Badge variant="outline" className="bg-muted/30">
                    {row.customerId}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {row.email} · on {row.path || "/dashboard"}
                </p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>Last seen {fmt(row.lastSeenAt)}</p>
                <p>Logged in {fmt(row.loginAt)}</p>
              </div>
            </div>
          </AdminListRow>
        ))}
      </AdminListCard>

      <Card className="glass border-border/50 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-base">Login sessions</CardTitle>
              <CardDescription>
                {filteredRecent.length} recent sessions · click a row for details
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-[280px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search company, email, ID..."
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && !data ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredRecent.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No sessions match.</p>
          ) : (
            <div className="space-y-3">
              {filteredRecent.map((row) => (
                <AdminListRow key={row.id} onClick={() => setSelected(row)}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold">
                          {row.companyName || row.customerId}
                        </p>
                        <Badge variant="outline" className="bg-muted/30">
                          {row.customerId}
                        </Badge>
                        {row.online ? (
                          <Badge className="border-transparent bg-[#E8F5E9] text-[#1B7339]">
                            Online
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            {row.endedReason || "Ended"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {row.email} · {row.path || "—"}
                      </p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p className="font-medium text-foreground">{fmt(row.loginAt)}</p>
                      <p>Last seen {fmt(row.lastSeenAt)}</p>
                    </div>
                  </div>
                </AdminListRow>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AdminDetailSheet
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        title={selected?.companyName || selected?.customerId || "Session"}
        description="Login session sheet"
      >
        {selected && (
          <AdminSheetSection title="Session">
            <AdminSheetField label="Customer ID" value={selected.customerId} />
            <AdminSheetField label="Company" value={selected.companyName || "—"} />
            <AdminSheetField label="Email" value={selected.email || "—"} />
            <AdminSheetField label="Status" value={selected.online ? "Online now" : selected.endedReason || "Ended"} />
            <AdminSheetField label="Login at" value={fmt(selected.loginAt)} />
            <AdminSheetField label="Last seen" value={fmt(selected.lastSeenAt)} />
            <AdminSheetField label="Logout at" value={fmt(selected.logoutAt)} />
            <AdminSheetField label="Last path" value={selected.path || "—"} />
            <AdminSheetField label="Session ID" value={selected.id} />
          </AdminSheetSection>
        )}
      </AdminDetailSheet>
    </div>
  )
}
