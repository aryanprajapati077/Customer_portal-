"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ClipboardList, Download, Loader2, Table2 } from "lucide-react"
import ExcelJS from "exceljs"

type PendingRow = {
  customerId: string
  companyName: string
  tradeName?: string | null
  city?: string | null
  state?: string | null
  lsuName?: string | null
  lsuTechnicianName?: string | null
  operationsIncharge?: string | null
  collectionFrequency?: string | null
  primaryPocName?: string | null
  primaryPocEmail?: string | null
  primaryPocNumber?: string | null
  noOfKiosk?: number
  month: string
  expected: number
  recorded: number
  remaining: number
  suggestedDate: string
  draftWeight: string
  draftLocation: string
  draftStatus: string
}

function monthOptions(past = 14, future = 3) {
  const opts: { value: string; label: string }[] = []
  const now = new Date()
  for (let i = -future; i <= past; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const label = d.toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    opts.push({ value, label })
  }
  // newest first (future months at top of past list order: reverse chronological)
  return opts.sort((a, b) => b.value.localeCompare(a.value))
}

export default function AdminPendingCollectionsPage() {
  const months = useMemo(() => monthOptions(), [])
  const currentYm = useMemo(() => {
    const n = new Date()
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`
  }, [])
  const [month, setMonth] = useState(currentYm)
  const [lsu, setLsu] = useState("all")
  const [lsuOptions, setLsuOptions] = useState<string[]>([])
  const [rows, setRows] = useState<PendingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [q, setQ] = useState("")

  const monthLabel = useMemo(
    () => months.find((m) => m.value === month)?.label || month,
    [months, month],
  )

  const load = useCallback(async () => {
    if (!month) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ month })
      if (lsu !== "all") params.set("lsu", lsu)
      const res = await fetch(`/api/admin/pending-collections?${params}`)
      const data = await res.json()
      if (data?.success) {
        setRows(data.pending || [])
        setLsuOptions(data.lsuOptions || [])
      }
    } finally {
      setLoading(false)
    }
  }, [month, lsu])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return rows
    return rows.filter(
      (r) =>
        r.customerId.toLowerCase().includes(s) ||
        r.companyName.toLowerCase().includes(s) ||
        (r.lsuName || "").toLowerCase().includes(s) ||
        (r.city || "").toLowerCase().includes(s),
    )
  }, [rows, q])

  const updateDraft = (customerId: string, patch: Partial<PendingRow>) => {
    setRows((prev) => prev.map((r) => (r.customerId === customerId ? { ...r, ...patch } : r)))
  }

  const markCollected = async (row: PendingRow) => {
    const weight = Number(row.draftWeight)
    if (!Number.isFinite(weight) || weight < 0) {
      alert("Enter a valid weight (kg)")
      return
    }
    setSavingId(row.customerId)
    try {
      const res = await fetch("/api/admin/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: row.customerId,
          weight,
          location: row.draftLocation || row.city || row.lsuName || null,
          status: row.draftStatus || "Completed",
          date: row.suggestedDate,
          notes: `Pending list · ${row.month}`,
        }),
      })
      const data = await res.json()
      if (!data?.success) {
        alert(data?.error || "Failed to save collection")
        return
      }
      // Auto-remove from pending (or reduce remaining) by reloading
      await load()
    } finally {
      setSavingId(null)
    }
  }

  const exportExcel = async () => {
    setExporting(true)
    try {
      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet("Pending Collections")
      ws.addRow([
        "Customer ID",
        "Brand Name",
        "Trade Name",
        "LSU",
        "City",
        "State",
        "Frequency",
        "Technician",
        "Ops Incharge",
        "POC Name",
        "POC Email",
        "POC Number",
        "Kiosks",
        "Month",
        "Expected",
        "Recorded",
        "Remaining",
        "Suggested Date",
      ])
      ws.getRow(1).font = { bold: true }
      for (const r of filtered) {
        ws.addRow([
          r.customerId,
          r.companyName,
          r.tradeName || "",
          r.lsuName || "",
          r.city || "",
          r.state || "",
          r.collectionFrequency || "",
          r.lsuTechnicianName || "",
          r.operationsIncharge || "",
          r.primaryPocName || "",
          r.primaryPocEmail || "",
          r.primaryPocNumber || "",
          r.noOfKiosk ?? 0,
          r.month,
          r.expected,
          r.recorded,
          r.remaining,
          r.suggestedDate,
        ])
      }
      const buf = await wb.xlsx.writeBuffer()
      const blob = new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Pending_Collections_${month}${lsu !== "all" ? `_${lsu.replace(/\s+/g, "_")}` : ""}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  const cellInput =
    "h-8 w-full min-w-[72px] rounded border border-[#D8D8D8] bg-white px-1.5 text-[12.5px] outline-none focus:border-[#1B7339]"

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="admin-page-title flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Pending Collections
          </h1>
          <p className="text-sm text-muted-foreground">
            Pick any month to see that month’s pending locations — enter weight and save to clear them
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportExcel} disabled={exporting || filtered.length === 0}>
            {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Export Excel
          </Button>
          <Button variant="outline" onClick={load} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      <Card className="border-amber-200 bg-amber-50/60">
        <CardContent className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-900/70">
              Showing pending locations for
            </p>
            <p className="text-lg font-bold text-amber-950">{monthLabel}</p>
          </div>
          <p className="text-sm text-amber-900/80">
            <span className="font-semibold">{filtered.length}</span> location
            {filtered.length === 1 ? "" : "s"} pending
            {lsu !== "all" ? ` · LSU: ${lsu}` : ""}
          </p>
        </CardContent>
      </Card>

      <Card className="glass border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>
            Change month to load that month’s pending list (new months appear as time moves forward)
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Month</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">LSU</Label>
            <Select value={lsu} onValueChange={setLsu}>
              <SelectTrigger>
                <SelectValue placeholder="All LSU" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All LSU</SelectItem>
                {lsuOptions.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Search</Label>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ID, brand, city…"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-border/50 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Table2 className="h-4 w-4" />
            Pending sheet
          </CardTitle>
          <CardDescription>
            {filtered.length} pending · edit weight / location / status then Save collection
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No pending collections for this month{lsu !== "all" ? ` / ${lsu}` : ""}.
            </p>
          ) : (
            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full min-w-[1100px] border-collapse text-[12.5px]">
                <thead className="sticky top-0 z-10 bg-[#FFF8E1]">
                  <tr>
                    {[
                      "Customer ID",
                      "Brand",
                      "Location (City)",
                      "LSU",
                      "Frequency",
                      "POC",
                      "Due",
                      "Weight (kg)",
                      "Collection location",
                      "Status",
                      "Action",
                    ].map((h) => (
                      <th
                        key={h}
                        className="border-b border-[#FFE082] px-2.5 py-2 text-left font-semibold text-[#8D6E00]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.customerId} className="border-b border-[#F0F0F0] hover:bg-[#FFFDE7]">
                      <td className="px-2.5 py-1.5 font-semibold text-[#1B7339]">{r.customerId}</td>
                      <td className="max-w-[180px] truncate px-2.5 py-1.5" title={r.companyName}>
                        {r.companyName}
                      </td>
                      <td className="px-2.5 py-1.5">{r.city || "—"}</td>
                      <td className="px-2.5 py-1.5">{r.lsuName || "—"}</td>
                      <td className="px-2.5 py-1.5">{r.collectionFrequency || "—"}</td>
                      <td className="max-w-[160px] truncate px-2.5 py-1.5" title={r.primaryPocEmail || ""}>
                        {r.primaryPocName || "—"}
                      </td>
                      <td className="px-2.5 py-1.5">
                        <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-900">
                          {r.remaining}/{r.expected}
                        </Badge>
                      </td>
                      <td className="px-1.5 py-1">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className={cellInput}
                          value={r.draftWeight}
                          onChange={(e) => updateDraft(r.customerId, { draftWeight: e.target.value })}
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-1.5 py-1">
                        <Input
                          className={cellInput}
                          value={r.draftLocation}
                          onChange={(e) => updateDraft(r.customerId, { draftLocation: e.target.value })}
                        />
                      </td>
                      <td className="px-1.5 py-1">
                        <Select
                          value={r.draftStatus}
                          onValueChange={(v) => updateDraft(r.customerId, { draftStatus: v })}
                        >
                          <SelectTrigger className="h-8 text-[12.5px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Scheduled">Scheduled</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-1">
                        <Button
                          size="sm"
                          className="h-8"
                          disabled={savingId === r.customerId}
                          onClick={() => markCollected(r)}
                        >
                          {savingId === r.customerId ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            "Save"
                          )}
                        </Button>
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
