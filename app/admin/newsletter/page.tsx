"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Mail, Send, Search } from "lucide-react"
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

type CustomerOption = {
  id: string
  companyName: string
  email: string
}

type SendRow = {
  id: string
  email: string
  companyName: string | null
  status: string
  error: string | null
  createdAt: string
}

export default function AdminNewsletterPage() {
  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [sends, setSends] = useState<SendRow[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [clientQ, setClientQ] = useState("")
  const [subject, setSubject] = useState("")
  const [htmlBody, setHtmlBody] = useState("")
  const [sendToAll, setSendToAll] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectedSend, setSelectedSend] = useState<SendRow | null>(null)
  const [lastResult, setLastResult] = useState<{ sent: number; failed: number; total: number } | null>(
    null,
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [custRes, histRes] = await Promise.all([
        fetch("/api/admin/customers?fields=options"),
        fetch("/api/admin/newsletter"),
      ])
      const custData = await custRes.json()
      const histData = await histRes.json()
      if (custData?.success) setCustomers(custData.customers || [])
      if (histData?.success) setSends(histData.sends || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filteredCustomers = useMemo(() => {
    const s = clientQ.trim().toLowerCase()
    if (!s) return customers
    return customers.filter(
      (c) =>
        c.companyName.toLowerCase().includes(s) ||
        c.email.toLowerCase().includes(s) ||
        c.id.toLowerCase().includes(s),
    )
  }, [customers, clientQ])

  const toggleCustomer = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const send = async () => {
    if (!subject.trim() || !htmlBody.trim()) return
    if (!sendToAll && selectedIds.size === 0) return
    setSending(true)
    setLastResult(null)
    try {
      const res = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          htmlBody: htmlBody.trim(),
          sendToAll,
          customerIds: [...selectedIds],
        }),
      })
      const data = await res.json()
      if (data?.success) {
        setLastResult({ sent: data.sent, failed: data.failed, total: data.total })
        await load()
      } else {
        alert(data?.error || "Failed to send newsletter")
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={<Mail className="h-6 w-6 text-primary" />}
        title="Newsletter"
        description="Compose and send updates — click a send row to open the delivery sheet"
      />

      <Card className="glass border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Send className="h-4 w-4" />
            Compose newsletter
          </CardTitle>
          <CardDescription>HTML content is supported in the body field</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Monthly sustainability update"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Body (HTML)</Label>
            <Textarea
              value={htmlBody}
              onChange={(e) => setHtmlBody(e.target.value)}
              rows={8}
              placeholder="<p>Dear partner,</p><p>Your update here...</p>"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[#E2EBE4] bg-[#F7FBF7] px-4 py-3">
            <label className="flex items-center gap-2 text-[13px] font-medium">
              <Checkbox checked={sendToAll} onCheckedChange={(v) => setSendToAll(v === true)} />
              Send to all active clients ({customers.length})
            </label>
            {!sendToAll && (
              <span className="text-[12px] text-muted-foreground">{selectedIds.size} selected</span>
            )}
          </div>

          {!sendToAll && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={clientQ}
                  onChange={(e) => setClientQ(e.target.value)}
                  placeholder="Search clients..."
                  className="pl-9"
                />
              </div>
              <div className="max-h-[220px] divide-y overflow-y-auto rounded-xl border border-border/60">
                {filteredCustomers.map((c) => (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-muted/40"
                  >
                    <Checkbox
                      checked={selectedIds.has(c.id)}
                      onCheckedChange={() => toggleCustomer(c.id)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold">{c.companyName}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{c.email}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={send}
              disabled={sending || !subject.trim() || !htmlBody.trim()}
              className="rounded-lg bg-[#1B7339] hover:bg-[#145a2c]"
            >
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send newsletter
            </Button>
            <Button variant="outline" onClick={load} disabled={loading}>
              Refresh
            </Button>
          </div>

          {lastResult && (
            <p className="text-[13px] text-[#1B7339]">
              Sent {lastResult.sent} of {lastResult.total}
              {lastResult.failed > 0 ? ` · ${lastResult.failed} failed` : ""}
            </p>
          )}
        </CardContent>
      </Card>

      <AdminListCard
        title="Recent sends"
        description="Click any row to open sheet"
        count={sends.length}
        loading={loading}
        isEmpty={sends.length === 0}
        emptyMessage="No newsletters sent yet."
      >
        {sends.map((row) => (
          <AdminListRow key={row.id} onClick={() => setSelectedSend(row)}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {row.companyName || row.email}
                  </p>
                  <Badge
                    variant="outline"
                    className={
                      row.status === "sent"
                        ? "border-secondary/30 bg-secondary/10 text-secondary"
                        : "border-[#FFCDD2] bg-[#FFEBEE] text-[#C62828]"
                    }
                  >
                    {row.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(row.createdAt).toLocaleString("en-IN")} · {row.email}
                </p>
              </div>
            </div>
          </AdminListRow>
        ))}
      </AdminListCard>

      <AdminDetailSheet
        open={!!selectedSend}
        onOpenChange={(open) => !open && setSelectedSend(null)}
        title={selectedSend?.companyName || selectedSend?.email || "Send details"}
        description="Newsletter delivery sheet"
      >
        {selectedSend && (
          <AdminSheetSection title="Delivery">
            <AdminSheetField label="Company" value={selectedSend.companyName || "—"} />
            <AdminSheetField label="Email" value={selectedSend.email} />
            <AdminSheetField
              label="Status"
              value={
                <Badge
                  variant="outline"
                  className={
                    selectedSend.status === "sent"
                      ? "border-[#C8E6C9] bg-[#E8F5E9] text-[#1B7339]"
                      : "border-[#FFCDD2] bg-[#FFEBEE] text-[#C62828]"
                  }
                >
                  {selectedSend.status}
                </Badge>
              }
            />
            <AdminSheetField
              label="Sent at"
              value={new Date(selectedSend.createdAt).toLocaleString("en-IN")}
            />
            {selectedSend.error ? (
              <AdminSheetField
                label="Error"
                value={<span className="text-[#C62828]">{selectedSend.error}</span>}
              />
            ) : null}
          </AdminSheetSection>
        )}
      </AdminDetailSheet>
    </div>
  )
}
