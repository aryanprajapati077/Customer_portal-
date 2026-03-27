"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, Bell, Plus, Search, CheckCircle2, Circle } from "lucide-react"
import { Switch } from "@/components/ui/switch"

type Row = {
  id: string
  customerId: string
  title: string
  body: string | null
  createdAt: string
  readAt: string | null
}

export default function AdminNotificationsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [draft, setDraft] = useState({ customerId: "BI01", title: "", body: "", sendEmail: true })

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/notifications")
      const data = await res.json()
      if (data?.success) setRows(data.notifications || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return rows
    return rows.filter((r) => {
      return (
        r.customerId.toLowerCase().includes(s) ||
        r.title.toLowerCase().includes(s) ||
        (r.body || "").toLowerCase().includes(s)
      )
    })
  }, [rows, q])

  const unread = useMemo(() => filtered.filter((r) => !r.readAt).length, [filtered])

  const add = async () => {
    setIsAdding(true)
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: draft.customerId,
          title: draft.title,
          body: draft.body || null,
          sendEmail: draft.sendEmail,
        }),
      })
      const data = await res.json()
      if (data?.success) {
        setDraft((d) => ({ ...d, title: "", body: "" }))
        await load()
      }
    } finally {
      setIsAdding(false)
    }
  }

  const toggleRead = async (row: Row) => {
    const res = await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: row.id, markRead: !row.readAt }),
    })
    const data = await res.json()
    if (data?.success && data.notification) {
      setRows((prev) => prev.map((r) => (r.id === row.id ? data.notification : r)))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground">Create and manage customer notifications</p>
        </div>
        <div className="w-full sm:w-[320px] relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="pl-9" />
        </div>
      </div>

      <Card className="glass border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Create Notification</CardTitle>
          <CardDescription>Send a message to a customer (shows under the bell)</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Customer ID</p>
            <Input value={draft.customerId} onChange={(e) => setDraft((d) => ({ ...d, customerId: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Title</p>
            <Input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
          </div>
          <div className="md:col-span-2 space-y-1">
            <p className="text-xs text-muted-foreground">Body</p>
            <Textarea value={draft.body} onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))} />
          </div>
          <div className="md:col-span-2 flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 px-3 py-2">
            <div>
              <p className="text-sm font-medium text-foreground">Send email</p>
              <p className="text-xs text-muted-foreground">Also email the customer via Resend</p>
            </div>
            <Switch checked={draft.sendEmail} onCheckedChange={(checked) => setDraft((d) => ({ ...d, sendEmail: checked }))} />
          </div>
          <div className="md:col-span-2 flex items-center gap-3">
            <Button onClick={add} disabled={isAdding || !draft.customerId || !draft.title}>
              {isAdding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Send
            </Button>
            <Button variant="outline" onClick={load} disabled={loading}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-border/50 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Inbox</CardTitle>
          <CardDescription>
            {filtered.length} messages • {unread} unread
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((r, idx) => (
                <button
                  key={r.id}
                  onClick={() => toggleRead(r)}
                  className="w-full text-left p-4 rounded-2xl border border-border/50 bg-muted/20 hover:bg-muted/30 hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${idx * 15}ms`, animationFillMode: "both" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-muted/30">
                          {r.customerId}
                        </Badge>
                        <p className="text-sm font-semibold text-foreground truncate">{r.title}</p>
                      </div>
                      {r.body && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.body}</p>}
                      <p className="text-[11px] text-muted-foreground mt-2">{new Date(r.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {r.readAt ? (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-secondary" /> Read
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-foreground">
                          <Circle className="w-2.5 h-2.5 text-primary fill-primary" /> Unread
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          <p className="mt-4 text-xs text-muted-foreground">Tip: click a message to toggle Read/Unread.</p>
        </CardContent>
      </Card>
    </div>
  )
}

