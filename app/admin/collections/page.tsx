"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Package, Plus, Search, Filter, Table2, Sparkles } from "lucide-react"
import {
  AdminDetailSheet,
  AdminSheetSection,
} from "@/components/admin/admin-detail-sheet"
import { CustomerSearchSelect } from "@/components/admin/customer-search-select"
import { SearchableSelect } from "@/components/admin/searchable-select"
import { AdminPrintSlip } from "@/components/admin/admin-print-slip"

type Row = {
  id: string
  customerId: string
  companyName: string
  lsuName?: string | null
  date: string
  weight: number
  location: string | null
  status: string
  notes?: string | null
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

function toDateInput(raw: string) {
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString().slice(0, 10)
}

export default function AdminCollectionsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [filterClient, setFilterClient] = useState<string>("all")
  const [filterMonth, setFilterMonth] = useState<string>("all")
  const [filterLsu, setFilterLsu] = useState<string>("all")
  const [isAdding, setIsAdding] = useState(false)
  const [monthCollectionMode, setMonthCollectionMode] = useState(false)
  const [selectedRow, setSelectedRow] = useState<Row | null>(null)
  const [editDraft, setEditDraft] = useState({
    date: "",
    weight: "",
    location: "",
    status: "Completed",
    notes: "",
  })
  const [savingEdit, setSavingEdit] = useState(false)
  const [savingCell, setSavingCell] = useState<string | null>(null)
  const [slipOpen, setSlipOpen] = useState(false)
  const [slipData, setSlipData] = useState<{
    companyName: string
    weight: number
    date: string
    location: string
  } | null>(null)
  const months = useMemo(() => monthOptions(), [])

  const [draft, setDraft] = useState({
    customerId: "",
    weight: 1,
    location: "",
    status: "Completed",
    date: new Date().toISOString().slice(0, 10),
    collectionMonth: new Date().toISOString().slice(0, 7),
  })

  const lsuOptions = useMemo(() => {
    const set = new Set<string>()
    for (const r of rows) {
      if (r.lsuName?.trim()) set.add(r.lsuName.trim())
    }
    return [...set].sort()
  }, [rows])

  const lsuSelectOptions = useMemo(
    () => lsuOptions.map((name) => ({ value: name, label: name })),
    [lsuOptions],
  )

  const customerFilterOptions = useMemo(
    () =>
      customers.map((c) => ({
        id: c.id,
        companyName: c.companyName,
      })),
    [customers],
  )

  const loadCustomers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/customers?fields=options&take=1000")
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
      params.set("take", "1000")
      if (filterClient !== "all") params.set("customerId", filterClient)
      if (filterMonth !== "all") params.set("month", filterMonth)
      if (filterLsu !== "all") params.set("lsu", filterLsu)
      const res = await fetch(`/api/admin/collections?${params}`)
      const data = await res.json()
      if (data?.success) setRows(data.collections || [])
    } finally {
      setLoading(false)
    }
  }, [filterClient, filterMonth, filterLsu])

  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!selectedRow) return
    setEditDraft({
      date: toDateInput(selectedRow.date),
      weight: String(selectedRow.weight ?? ""),
      location: selectedRow.location || "",
      status: selectedRow.status || "Completed",
      notes: selectedRow.notes || "",
    })
  }, [selectedRow?.id])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return rows
    return rows.filter((r) => {
      return (
        r.id.toLowerCase().includes(s) ||
        r.customerId.toLowerCase().includes(s) ||
        r.companyName.toLowerCase().includes(s) ||
        (r.location || "").toLowerCase().includes(s) ||
        (r.lsuName || "").toLowerCase().includes(s) ||
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

  const patchRow = async (id: string, patch: Record<string, unknown>) => {
    setSavingCell(id)
    try {
      const res = await fetch("/api/admin/collections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      })
      const data = await res.json()
      if (data?.success && data.collection) {
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...data.collection } : r)))
        setSelectedRow((s) => (s?.id === id ? { ...s, ...data.collection } : s))
        return true
      }
      return false
    } finally {
      setSavingCell(null)
    }
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
        const company =
          customers.find((c) => c.id === draft.customerId)?.companyName || draft.customerId
        const collectionDate = resolveCollectionDate()
        setSlipData({
          companyName: company,
          weight: Number(draft.weight),
          date: collectionDate,
          location: draft.location || "—",
        })
        setSlipOpen(true)
        await load()
        setDraft((d) => ({ ...d, weight: 1, location: "" }))
      }
    } finally {
      setIsAdding(false)
    }
  }

  const saveSelected = async () => {
    if (!selectedRow) return
    setSavingEdit(true)
    try {
      await patchRow(selectedRow.id, {
        date: editDraft.date,
        weight: Number(editDraft.weight),
        location: editDraft.location,
        status: editDraft.status,
        notes: editDraft.notes,
      })
    } finally {
      setSavingEdit(false)
    }
  }

  const cellInput =
    "h-8 w-full min-w-[88px] rounded border border-transparent bg-transparent px-1.5 text-[12.5px] outline-none hover:border-[#D0D0D0] focus:border-[#1B7339] focus:bg-white"

  return (
    <div className="space-y-6">
      <AdminPrintSlip
        open={slipOpen}
        variant="collection"
        companyName={slipData?.companyName || ""}
        reference={slipData ? `Logged ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : undefined}
        lines={
          slipData
            ? [
                { label: "Weight collected", value: `${slipData.weight} kg` },
                { label: "Collection date", value: slipData.date },
                { label: "Location", value: slipData.location },
                { label: "Status", value: "Completed" },
              ]
            : []
        }
        successMessage="Collection logged successfully!"
        footerNote="Customer dashboard & ESG reports will sync automatically."
        onComplete={() => {
          setSlipOpen(false)
          setSlipData(null)
        }}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="admin-page-title flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            Collections
          </h1>
          <p className="text-sm text-muted-foreground">
            Sheet view — edit cells inline, or open a row for full edit
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
          <CardDescription>Filter by client, LSU, or collection month</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Client</Label>
            <CustomerSearchSelect
              customers={customerFilterOptions}
              value={filterClient}
              onChange={setFilterClient}
              allValue="all"
              allLabel="All clients"
              placeholder="Search client by name or ID…"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">LSU</Label>
            <SearchableSelect
              options={lsuSelectOptions}
              value={filterLsu}
              onChange={setFilterLsu}
              allValue="all"
              allLabel="All LSU"
              placeholder="All LSU"
              searchPlaceholder="Search LSU…"
            />
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

      <Card className="overflow-hidden border-[#C8E6D4] bg-gradient-to-br from-[#F7FBF7] via-white to-[#FFF8E8] shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base text-[#1B7339]">
                <Sparkles className="h-4 w-4" />
                Add collection
              </CardTitle>
              <CardDescription className="mt-1">
                Search a client, enter weight for the month or a specific date, then save
              </CardDescription>
            </div>
            <div className="inline-flex rounded-full border border-[#D5E5D9] bg-white p-0.5 text-[12px]">
              <button
                type="button"
                onClick={() => setMonthCollectionMode(false)}
                className={`rounded-full px-3 py-1.5 font-medium transition ${
                  !monthCollectionMode ? "bg-[#1B7339] text-white" : "text-[#5A5A5A] hover:bg-[#F3F9F4]"
                }`}
              >
                Specific date
              </button>
              <button
                type="button"
                onClick={() => setMonthCollectionMode(true)}
                className={`rounded-full px-3 py-1.5 font-medium transition ${
                  monthCollectionMode ? "bg-[#1B7339] text-white" : "text-[#5A5A5A] hover:bg-[#F3F9F4]"
                }`}
              >
                Month collection
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-[#1B7339]">
                Customer
              </Label>
              <CustomerSearchSelect
                customers={customers}
                value={draft.customerId}
                onChange={(id) => setDraft((d) => ({ ...d, customerId: id }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-[#1B7339]">
                Weight (kg)
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={draft.weight}
                onChange={(e) => {
                  const raw = e.target.value
                  setDraft((d) => ({
                    ...d,
                    weight: raw === "" ? 0 : Number.parseFloat(raw),
                  }))
                }}
                inputMode="decimal"
                className="h-11 rounded-xl border-[#D5E5D9] bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-[#1B7339]">
                Location
              </Label>
              <Input
                value={draft.location}
                onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
                placeholder="Site / city (optional)"
                className="h-11 rounded-xl border-[#D5E5D9] bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-[#1B7339]">
                Status
              </Label>
              <Select value={draft.status} onValueChange={(v) => setDraft((d) => ({ ...d, status: v }))}>
                <SelectTrigger className="h-11 rounded-xl border-[#D5E5D9] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {monthCollectionMode ? (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-[#1B7339]">
                  Collection month
                </Label>
                <Input
                  type="month"
                  value={draft.collectionMonth}
                  onChange={(e) => setDraft((d) => ({ ...d, collectionMonth: e.target.value }))}
                  className="h-11 rounded-xl border-[#D5E5D9] bg-white"
                />
                <p className="text-[11px] text-[#7A7A7A]">
                  Saved as the last day of {draft.collectionMonth || "the month"}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-[#1B7339]">
                  Collection date
                </Label>
                <Input
                  type="date"
                  value={draft.date}
                  onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
                  className="h-11 rounded-xl border-[#D5E5D9] bg-white"
                />
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-[#E2EBE4] pt-4">
            <Button
              onClick={add}
              disabled={isAdding || !draft.customerId}
              className="h-11 rounded-full bg-[#1B7339] px-6 hover:bg-[#145a2c]"
            >
              {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Add collection
            </Button>
            <Button variant="outline" onClick={load} disabled={loading} className="h-11 rounded-full">
              Refresh list
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-border/50 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Table2 className="h-4 w-4" />
            Collections sheet
          </CardTitle>
          <CardDescription>
            {filtered.length} rows · edit weight / location / status inline · click ID to open full edit
            {savingCell ? " · saving…" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No collections match your filters.</p>
          ) : (
            <div className="overflow-auto max-h-[70vh]">
              <table className="w-full min-w-[980px] border-collapse text-[12.5px]">
                <thead className="sticky top-0 z-10 bg-[#E8F5E9]">
                  <tr>
                    {[
                      "Customer ID",
                      "Brand",
                      "LSU",
                      "Date",
                      "Weight (kg)",
                      "Location",
                      "Status",
                      "Microplastics",
                    ].map((h) => (
                      <th
                        key={h}
                        className="border-b border-[#C8E6D4] px-2.5 py-2 text-left font-semibold text-[#1B7339]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b border-[#F0F0F0] hover:bg-[#F7FBF7]">
                      <td className="px-2.5 py-1.5">
                        <button
                          type="button"
                          className="font-semibold text-[#1B7339] hover:underline"
                          onClick={() => setSelectedRow(r)}
                        >
                          {r.customerId}
                        </button>
                      </td>
                      <td className="max-w-[200px] truncate px-2.5 py-1.5" title={r.companyName}>
                        {r.companyName}
                      </td>
                      <td className="px-2.5 py-1.5">{r.lsuName || "—"}</td>
                      <td className="px-1.5 py-1">
                        <Input
                          type="date"
                          className={cellInput}
                          defaultValue={toDateInput(r.date)}
                          key={`${r.id}-date-${r.date}`}
                          onBlur={(e) => {
                            if (e.target.value && e.target.value !== toDateInput(r.date)) {
                              void patchRow(r.id, { date: e.target.value })
                            }
                          }}
                        />
                      </td>
                      <td className="px-1.5 py-1">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className={cellInput}
                          defaultValue={String(r.weight ?? "")}
                          key={`${r.id}-w-${r.weight}`}
                          onBlur={(e) => {
                            const w = Number(e.target.value)
                            if (Number.isFinite(w) && w !== Number(r.weight)) {
                              void patchRow(r.id, { weight: w })
                            }
                          }}
                        />
                      </td>
                      <td className="px-1.5 py-1">
                        <Input
                          className={cellInput}
                          defaultValue={r.location || ""}
                          key={`${r.id}-loc-${r.location || ""}`}
                          onBlur={(e) => {
                            if (e.target.value !== (r.location || "")) {
                              void patchRow(r.id, { location: e.target.value })
                            }
                          }}
                        />
                      </td>
                      <td className="px-1.5 py-1">
                        <Select
                          value={r.status}
                          onValueChange={(v) => {
                            if (v !== r.status) void patchRow(r.id, { status: v })
                          }}
                        >
                          <SelectTrigger className="h-8 border-transparent bg-transparent text-[12.5px] shadow-none hover:border-[#D0D0D0]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Scheduled">Scheduled</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2.5 py-1.5 text-[#666]">
                        {(Number(r.weight || 0) * 0.8).toFixed(2)} kg
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AdminDetailSheet
        open={!!selectedRow}
        onOpenChange={(open) => !open && setSelectedRow(null)}
        title={selectedRow ? selectedRow.companyName : ""}
        description={selectedRow ? `Edit collection · ${selectedRow.id}` : undefined}
        className="sm:max-w-xl"
      >
        {selectedRow && (
          <AdminSheetSection title="Edit collection">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{selectedRow.customerId}</Badge>
                {selectedRow.lsuName ? <Badge variant="outline">LSU: {selectedRow.lsuName}</Badge> : null}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Date</Label>
                <Input
                  type="date"
                  value={editDraft.date}
                  onChange={(e) => setEditDraft((d) => ({ ...d, date: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Weight (kg)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editDraft.weight}
                  onChange={(e) => setEditDraft((d) => ({ ...d, weight: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Location</Label>
                <Input
                  value={editDraft.location}
                  onChange={(e) => setEditDraft((d) => ({ ...d, location: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select
                  value={editDraft.status}
                  onValueChange={(v) => setEditDraft((d) => ({ ...d, status: v }))}
                >
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
                <Label className="text-xs">Notes</Label>
                <Input
                  value={editDraft.notes}
                  onChange={(e) => setEditDraft((d) => ({ ...d, notes: e.target.value }))}
                />
              </div>
              <Button onClick={saveSelected} disabled={savingEdit} className="w-full">
                {savingEdit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save changes
              </Button>
            </div>
          </AdminSheetSection>
        )}
      </AdminDetailSheet>
    </div>
  )
}
