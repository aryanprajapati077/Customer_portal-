"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CalendarClock, Loader2, Mail, RefreshCw, Search } from "lucide-react"
import { cn } from "@/lib/utils"

type RenewalRow = {
  id: string
  companyName: string
  email: string
  primaryPocEmail?: string | null
  primaryPocName?: string | null
  contactPerson?: string | null
  lsuName?: string | null
  city?: string | null
  status: string
  serviceStatus?: string | null
  contractEndDate: string
  daysLeft: number
}

export default function AdminRenewalsPage() {
  const [upcoming, setUpcoming] = useState<RenewalRow[]>([])
  const [pending, setPending] = useState<RenewalRow[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"upcoming" | "pending">("upcoming")
  const [q, setQ] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [mailing, setMailing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/renewals")
      const data = await res.json()
      if (data?.success) {
        setUpcoming(data.upcoming || [])
        setPending(data.pending || [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setSelected(new Set())
  }, [tab])

  const list = tab === "pending" ? pending : upcoming
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return list
    return list.filter(
      (r) =>
        r.id.toLowerCase().includes(s) ||
        r.companyName.toLowerCase().includes(s) ||
        (r.lsuName || "").toLowerCase().includes(s) ||
        (r.city || "").toLowerCase().includes(s) ||
        (r.primaryPocEmail || r.email || "").toLowerCase().includes(s),
    )
  }, [list, q])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map((r) => r.id)))
  }

  const mail = async (mode: "selected" | "bucket") => {
    const payload =
      mode === "selected"
        ? { customerIds: [...selected], bucket: "selected" }
        : { customerIds: [], bucket: tab === "pending" ? "pending" : "upcoming" }

    const count = mode === "selected" ? selected.size : filtered.length
    if (!count) {
      alert(mode === "selected" ? "Select at least one client" : "No clients in this list")
      return
    }
    if (
      !confirm(
        mode === "selected"
          ? `Send renewal emails to ${count} selected client(s)?`
          : `Send renewal emails to all ${count} ${tab === "pending" ? "pending" : "upcoming"} client(s)?`,
      )
    ) {
      return
    }

    setMailing(true)
    try {
      const res = await fetch("/api/admin/renewals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data?.success) {
        alert(data.message || `Sent ${data.sent}`)
        setSelected(new Set())
        await load()
      } else {
        alert(data?.error || "Failed to send")
      }
    } catch {
      alert("Network error")
    } finally {
      setMailing(false)
    }
  }

  const daysBadge = (days: number) => {
    if (days < 0) {
      return (
        <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
          Overdue {Math.abs(days)}d
        </Badge>
      )
    }
    if (days <= 7) {
      return (
        <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-800">
          {days}d left
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="border-[#C8E6D4] bg-[#E8F5E9] text-[#1B7339]">
        {days}d left
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="admin-page-title flex items-center gap-2">
            <CalendarClock className="h-6 w-6 text-primary" />
            Renewals
          </h1>
          <p className="text-sm text-muted-foreground">
            Renewal date = service start + 1 year (rolls annually). Upcoming = next 60 days; pending = overdue or flagged.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setTab("upcoming")}
          className={cn(
            "rounded-2xl border p-4 text-left transition",
            tab === "upcoming"
              ? "border-[#1B7339] bg-[#E8F5E9] ring-2 ring-[#1B7339]/15"
              : "border-[#C8E6D4] bg-[#F7FBF7] hover:border-[#1B7339]/40",
          )}
        >
          <p className="text-xs text-[#5A5A5A]">Upcoming (≤ 60 days)</p>
          <p className="mt-1 text-3xl font-bold text-[#1B7339]">{upcoming.length}</p>
        </button>
        <button
          type="button"
          onClick={() => setTab("pending")}
          className={cn(
            "rounded-2xl border p-4 text-left transition",
            tab === "pending"
              ? "border-amber-500 bg-amber-50 ring-2 ring-amber-500/20"
              : "border-amber-200 bg-amber-50/50 hover:border-amber-400",
          )}
        >
          <p className="text-xs text-amber-900/70">Pending / overdue</p>
          <p className="mt-1 text-3xl font-bold text-amber-900">{pending.length}</p>
        </button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by ID, brand, LSU, email…"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={mailing || selected.size === 0} onClick={() => mail("selected")}>
            {mailing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
            Mail selected ({selected.size})
          </Button>
          <Button
            className="bg-[#1B7339] hover:bg-[#145a2c]"
            disabled={mailing || filtered.length === 0}
            onClick={() => mail("bucket")}
          >
            {mailing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
            Mail all in tab
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {tab === "upcoming" ? "Upcoming renewals" : "Pending renewals"}
          </CardTitle>
          <CardDescription>
            {filtered.length} clients
            {tab === "upcoming"
              ? " · contract ends within 60 days"
              : " · overdue or flagged renewal / pause status"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No clients in this list.</p>
          ) : (
            <div className="max-h-[65vh] overflow-auto">
              <table className="w-full min-w-[900px] border-collapse text-[12.5px]">
                <thead className="sticky top-0 z-10 bg-[#F7FBF7]">
                  <tr>
                    <th className="border-b px-3 py-2 text-left">
                      <input
                        type="checkbox"
                        checked={selected.size === filtered.length && filtered.length > 0}
                        onChange={toggleAll}
                      />
                    </th>
                    {["ID", "Brand", "LSU", "Renewal date", "Days", "Email", "Service status"].map((h) => (
                      <th
                        key={h}
                        className="border-b border-[#E2EBE4] px-3 py-2 text-left font-semibold text-[#1B7339]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b border-[#F0F0F0] hover:bg-[#FAFCFA]">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selected.has(r.id)}
                          onChange={() => toggle(r.id)}
                        />
                      </td>
                      <td className="px-3 py-2 font-semibold text-[#1B7339]">{r.id}</td>
                      <td className="max-w-[200px] truncate px-3 py-2" title={r.companyName}>
                        {r.companyName}
                      </td>
                      <td className="px-3 py-2">{r.lsuName || "—"}</td>
                      <td className="px-3 py-2">
                        {new Date(r.contractEndDate).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-3 py-2">{daysBadge(Number(r.daysLeft))}</td>
                      <td className="max-w-[200px] truncate px-3 py-2">
                        {r.primaryPocEmail || r.email}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="outline">{r.serviceStatus || "ACTIVE"}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
