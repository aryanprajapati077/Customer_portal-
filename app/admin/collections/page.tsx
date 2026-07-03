"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Package, Plus, Search, Filter } from "lucide-react"

type Row = {
  id: string
  customerId: string
  companyName: string
  date: string
  weight: number
  location: string | null
  status: string
}

type CustomerOption = {
  id: string
  companyName: string
}

function monthOptions(count = 18) {
  const opts: { value: string; label: string }[] = []
  const now = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const label = d.toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    opts.push({ value, label })
  }
  return opts
}

export default function AdminCollectionsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [filterClient, setFilterClient] = useState<string>("all")
  const [filterMonth, setFilterMonth] = useState<string>("all")
  const [isAdding, setIsAdding] = useState(false)
  const [monthCollectionMode, setMonthCollectionMode] = useState(false)
  const months = useMemo(() => monthOptions(), [])

  const [draft, setDraft] = useState({
    customerId: "",
    weight: 1,
    location: "",
    status: "Completed",
    date: new Date().toISOString().slice(0, 10),
    collectionMonth: new Date().toISOString().slice(0, 7),
  })

  const loadCustomers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/customers")
      const data = await res.json()
      if (data?.success && data.customers?.length) {
        setCustomers(
          data.customers.map((c: CustomerOption) => ({
            id: c.id,
            companyName: c.companyName,
          })),
        )
        setDraft((d) => ({ ...d, customerId: d.customerId || data.customers[0].id }))
      }
    } catch {
      // ignore
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterClient !== "all") params.set("customerId", filterClient)
      if (filterMonth !== "all") params.set("month", filterMonth)
      const qs = params.toString()
      const res = await fetch(`/api/admin/collections${qs ? `?${qs}` : ""}`)
      const data = await res.json()
      if (data?.success) setRows(data.collections || [])
    } finally {
      setLoading(false)
    }
  }, [filterClient, filterMonth])

  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  useEffect(() => {
    load()
  }, [load])

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

  const resolveCollectionDate = () => {
    if (!monthCollectionMode) return draft.date
    const [y, m] = draft.collectionMonth.split("-").map(Number)
    const lastDay = new Date(y, m, 0).getDate()
    return `${draft.collectionMonth}-${String(lastDay).padStart(2, "0")}`
  }

  const add = async () => {
    if (!draft.customerId) return
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
          date: resolveCollectionDate(),
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
          <p className="text-sm text-muted-foreground">
            Search by customer name, filter by client or month, and add monthly collections
          </p>
        </div>
        <div className="w-full sm:w-[320px] relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search customer name, ID, location..."
            className="pl-9"
          />
        </div>
      </div>

      <Card className="glass border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
          <CardDescription>Filter the list by client or collection month</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Client</Label>
            <Select value={filterClient} onValueChange={setFilterClient}>
              <SelectTrigger>
                <SelectValue placeholder="All clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All clients</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.companyName} ({c.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Month</Label>
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger>
                <SelectValue placeholder="All months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All months</SelectItem>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={load} disabled={loading} className="w-full">
              Apply / Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Add Collection</CardTitle>
          <CardDescription>
            {monthCollectionMode
              ? "Monthly collection — date is set to the last day of the selected month"
              : "Add a collection with a specific date, or switch to monthly mode"}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1 md:col-span-2">
            <Label className="text-xs text-muted-foreground">Customer</Label>
            <Select
              value={draft.customerId}
              onValueChange={(v) => setDraft((d) => ({ ...d, customerId: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.companyName} ({c.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Weight (kg)</Label>
            <Input
              value={draft.weight}
              onChange={(e) => setDraft((d) => ({ ...d, weight: Number(e.target.value) }))}
              inputMode="decimal"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Location</Label>
            <Input
              value={draft.location}
              onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Status</Label>
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
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Entry type</Label>
            <Select
              value={monthCollectionMode ? "month" : "date"}
              onValueChange={(v) => setMonthCollectionMode(v === "month")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Specific date</SelectItem>
                <SelectItem value="month">Month collection</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {monthCollectionMode ? (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Collection month</Label>
              <Input
                type="month"
                value={draft.collectionMonth}
                onChange={(e) => setDraft((d) => ({ ...d, collectionMonth: e.target.value }))}
              />
            </div>
          ) : (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Collection date</Label>
              <Input
                type="date"
                value={draft.date}
                onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
              />
            </div>
          )}
          <div className="md:col-span-4 flex items-center gap-3 flex-wrap">
            <Button onClick={add} disabled={isAdding || !draft.customerId}>
              {isAdding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add collection
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
          <CardDescription>
            {filtered.length} rows
            {filterClient !== "all" || filterMonth !== "all" ? " (filtered)" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No collections match your filters.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((r, idx) => (
                <div
                  key={r.id}
                  className="p-4 rounded-2xl border border-border/50 bg-muted/20 hover:bg-muted/30 hover:shadow-md transition-all duration-300"
                  style={{ animationDelay: `${idx * 15}ms` }}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground truncate">{r.companyName}</p>
                        <Badge variant="outline" className="bg-muted/30">
                          {r.customerId}
                        </Badge>
                        <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/30">
                          {r.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.date).toLocaleString("en-IN")} • {r.location || "N/A"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">{Number(r.weight || 0).toFixed(1)} kg</p>
                      <p className="text-xs text-muted-foreground">
                        Microplastics: {(Number(r.weight || 0) * 0.8).toFixed(1)} kg
                      </p>
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
