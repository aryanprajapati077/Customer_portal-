"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Mail, RefreshCw, Calculator, FileText } from "lucide-react"

type Ticket = {
  id: string
  name: string
  email: string
  subject: string
  message: string
  category: string
  status: string
  source: string
  createdAt: string
}

function isProposalLead(t: Ticket) {
  return t.category === "proposal" || t.source === "impact-calculator"
}

export default function AdminProposalsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [updating, setUpdating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/support/tickets")
      const data = await res.json()
      if (data.tickets) {
        setTickets((data.tickets as Ticket[]).filter(isProposalLead))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (filter !== "all" && t.status !== filter) return false
      if (sourceFilter === "calculator" && t.source !== "impact-calculator") return false
      if (sourceFilter === "landing" && t.source !== "landing") return false
      return true
    })
  }, [tickets, filter, sourceFilter])

  const openCount = tickets.filter((t) => t.status === "open").length

  const updateStatus = async (id: string, status: string) => {
    setUpdating(true)
    try {
      const res = await fetch("/api/admin/support/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })
      const data = await res.json()
      if (data.ticket) {
        setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
        if (selected?.id === id) setSelected({ ...selected, status })
      }
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
            <Calculator className="w-3.5 h-3.5" />
            Impact Calculator
          </div>
          <h1 className="admin-page-title">Proposal Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Entries from Get detailed proposal and landing proposal forms. {openCount} open.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="calculator">Impact calculator</SelectItem>
              <SelectItem value="landing">Landing form</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Leads</CardTitle>
            <CardDescription>{filtered.length} entr{filtered.length === 1 ? "y" : "ies"}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12 px-4">
                No proposal leads yet.
              </p>
            ) : (
              <ul className="divide-y divide-border/50 max-h-[520px] overflow-y-auto">
                {filtered.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(t)}
                      className={`w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors ${
                        selected?.id === t.id ? "bg-primary/5 border-l-2 border-l-primary" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm truncate">{t.subject}</p>
                        <Badge
                          variant={t.status === "open" ? "default" : "secondary"}
                          className="text-[10px] shrink-0"
                        >
                          {t.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {t.name} · {t.email}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {new Date(t.createdAt).toLocaleString()} · {t.source}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Lead details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <p className="text-sm text-muted-foreground py-12 text-center">
                Select a lead to view calculator inputs and estimate
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{selected.subject}</h2>
                    <p className="text-sm text-muted-foreground">
                      {selected.name} ·{" "}
                      <a href={`mailto:${selected.email}`} className="text-primary hover:underline">
                        {selected.email}
                      </a>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {selected.status === "open" ? (
                      <Button
                        size="sm"
                        disabled={updating}
                        onClick={() => updateStatus(selected.id, "resolved")}
                      >
                        Mark resolved
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updating}
                        onClick={() => updateStatus(selected.id, "open")}
                      >
                        Reopen
                      </Button>
                    )}
                    <Button size="sm" variant="outline" asChild>
                      <a
                        href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}
                      >
                        <Mail className="w-4 h-4 mr-1" />
                        Reply
                      </a>
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline">{selected.category}</Badge>
                  <Badge variant="outline">{selected.source}</Badge>
                  <span className="text-muted-foreground">
                    {new Date(selected.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="rounded-xl bg-muted/40 border border-border/50 p-4 text-sm whitespace-pre-wrap leading-relaxed">
                  {selected.message}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
