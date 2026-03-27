"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Package, Plus, Search } from "lucide-react"

type Row = {
  id: string
  customerId: string
  companyName: string
  date: string
  weight: number
  location: string | null
  status: string
}

export default function AdminCollectionsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [draft, setDraft] = useState({ customerId: "BI01", weight: 1, location: "", status: "Completed" })

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/collections")
      const data = await res.json()
      if (data?.success) setRows(data.collections || [])
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
        r.id.toLowerCase().includes(s) ||
        r.customerId.toLowerCase().includes(s) ||
        r.companyName.toLowerCase().includes(s) ||
        (r.location || "").toLowerCase().includes(s) ||
        r.status.toLowerCase().includes(s)
      )
    })
  }, [rows, q])

  const add = async () => {
    setIsAdding(true)
    try {
      const res = await fetch("/api/admin/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: draft.customerId,
          weight: Number(draft.weight),
          location: draft.location || null,
          status: draft.status,
        }),
      })
      const data = await res.json()
      if (data?.success) {
        await load()
        setDraft((d) => ({ ...d, weight: 1, location: "" }))
      }
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            Collections
          </h1>
          <p className="text-sm text-muted-foreground">View and add collection records</p>
        </div>
        <div className="w-full sm:w-[320px] relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="pl-9" />
        </div>
      </div>

      <Card className="glass border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Add Collection</CardTitle>
          <CardDescription>Create a new record (auto date = now)</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Customer ID</p>
            <Input value={draft.customerId} onChange={(e) => setDraft((d) => ({ ...d, customerId: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Weight (kg)</p>
            <Input
              value={draft.weight}
              onChange={(e) => setDraft((d) => ({ ...d, weight: Number(e.target.value) }))}
              inputMode="decimal"
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Location</p>
            <Input value={draft.location} onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Status</p>
            <Select value={draft.status} onValueChange={(v) => setDraft((d) => ({ ...d, status: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-4 flex items-center gap-3">
            <Button onClick={add} disabled={isAdding}>
              {isAdding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add
            </Button>
            <Button variant="outline" onClick={load} disabled={loading}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-border/50 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Collections</CardTitle>
          <CardDescription>{filtered.length} rows</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((r, idx) => (
                <div
                  key={r.id}
                  className="p-4 rounded-2xl border border-border/50 bg-muted/20 hover:bg-muted/30 hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${idx * 15}ms`, animationFillMode: "both" }}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">{r.companyName}</p>
                        <Badge variant="outline" className="bg-muted/30">
                          {r.customerId}
                        </Badge>
                        <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/30">
                          {r.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.date).toLocaleString()} • {r.location || "N/A"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">{Number(r.weight || 0).toFixed(1)} kg</p>
                      <p className="text-xs text-muted-foreground">Microplastics: {(Number(r.weight || 0) * 0.8).toFixed(1)} kg</p>
                    </div>
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

