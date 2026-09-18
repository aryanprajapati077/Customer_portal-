"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
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
import { AdminPageHeader } from "@/components/admin/admin-list-card"
import { CalendarClock, Loader2, RefreshCw, Search } from "lucide-react"

type Row = {
  id: string
  customerId: string
  companyName: string | null
  email: string | null
  renewalDate: string | null
  status: string
  source: string | null
  notes: string | null
  createdAt: string
}

export default function AdminRenewalResponsesPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [counts, setCounts] = useState({ all: 0, new: 0, contacted: 0, closed: 0 })
  const [status, setStatus] = useState("all")
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status, q, take: "200" })
      const res = await fetch(`/api/admin/renewal-responses?${params}`)
      const data = await res.json()
      if (data?.success) {
        setRows(data.rows || [])
        setCounts(data.counts || { all: 0, new: 0, contacted: 0, closed: 0 })
      }
    } finally {
      setLoading(false)
    }
  }, [status, q])

  useEffect(() => {
    void load()
  }, [load])

  const setRowStatus = async (id: string, next: string) => {
    setUpdatingId(id)
    try {
      const res = await fetch("/api/admin/renewal-responses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: next }),
      })
      const data = await res.json()
      if (data?.success) await load()
    } finally {
      setUpdatingId(null)
    }
  }

  const statusBadge = (s: string) => {
    if (s === "new") return "border-amber-200 bg-amber-50 text-amber-800"
    if (s === "contacted") return "border-blue-200 bg-blue-50 text-blue-800"
    return "border-[#C8E6D4] bg-[#E8F5E9] text-[#1B7339]"
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={<CalendarClock className="h-5 w-5" />}
        title="Renewal Responses"
        description="Clients who clicked Renew Now on the renewal email. Follow up and mark as contacted when your team connects."
        actions={
          <Button variant="outline" className="rounded-full" asChild>
            <Link href="/admin/renewals">Renewals list</Link>
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        {(
          [
            ["all", "All", counts.all],
            ["new", "New", counts.new],
            ["contacted", "Contacted", counts.contacted],
            ["closed", "Closed", counts.closed],
          ] as const
        ).map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatus(key)}
            className={`rounded-xl border p-3 text-left transition ${
              status === key ? "border-[#1B7339]/40 bg-[#E8F5E9]" : "border-[#ebe9e4] bg-white"
            }`}
          >
            <p className="text-[11px] text-[#6B6B6B]">{label}</p>
            <p className="text-2xl font-bold text-[#141414]">{count}</p>
          </button>
        ))}
      </div>

      <Card className="overflow-hidden rounded-[14px] border-[#ebe9e4] bg-white shadow-sm">
        <CardHeader className="border-b border-[#ebe9e4] bg-[#fafaf8]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-base">Interest list</CardTitle>
              <CardDescription>Newest clicks first. Admin team also gets an email alert on each new click.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="w-[220px] pl-9"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search ID, brand, email…"
                />
              </div>
              <Button variant="outline" onClick={() => void load()} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#1B7339]" />
            </div>
          ) : rows.length === 0 ? (
            <p className="py-12 text-center text-sm text-[#6B6B6B]">No renewal responses yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#ebe9e4]">
              <table className="min-w-[860px] w-full text-sm">
                <thead className="bg-[#fafaf8] text-left text-[10px] font-bold uppercase tracking-[0.08em] text-[#777]">
                  <tr>
                    <th className="px-4 py-3">Clicked</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Contract date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-[#f0eeea]">
                      <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#555]">
                        {new Date(row.createdAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/customers?open=${encodeURIComponent(row.customerId)}`}
                          className="font-medium text-[#1B7339] hover:underline"
                        >
                          {row.companyName || row.customerId}
                        </Link>
                        <p className="text-xs text-[#6B6B6B]">{row.customerId}</p>
                      </td>
                      <td className="px-4 py-3 text-[#555]">{row.email || "—"}</td>
                      <td className="px-4 py-3 text-[12px] text-[#555]">
                        {row.renewalDate
                          ? new Date(row.renewalDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={statusBadge(row.status)}>
                          {row.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={row.status}
                          onValueChange={(v) => void setRowStatus(row.id, v)}
                          disabled={updatingId === row.id}
                        >
                          <SelectTrigger className="h-8 w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
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
