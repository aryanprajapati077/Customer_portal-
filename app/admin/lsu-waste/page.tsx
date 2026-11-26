"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download, Loader2, Pencil, Plus, Recycle, Trash2, Truck } from "lucide-react"
import { AdminPageHeader, AdminSearchInput } from "@/components/admin/admin-list-card"
import { AdminEmptyState, AdminRefreshButton } from "@/components/admin/admin-ui"
import { cn } from "@/lib/utils"
import type { LsuWasteReport, LsuWasteRow, PickupStatus, ReversePickup } from "@/lib/lsu-waste"

const STATUSES: PickupStatus[] = ["Scheduled", "Picked Up", "In Transit", "Received", "Cancelled"]
const STATUS_TONE: Record<PickupStatus, string> = {
  Scheduled: "bg-[#eef2ff] text-[#3730a3]",
  "Picked Up": "bg-[#fff4e5] text-[#9a5b00]",
  "In Transit": "bg-[#fff4e5] text-[#9a5b00]",
  Received: "bg-[#e8f5ec] text-[#1b7339]",
  Cancelled: "bg-[#f2f2f4] text-[#6e6e73] line-through",
}
const ALL = "__all__"

const kg = (v: number, digits = 2) => v.toLocaleString("en-IN", { maximumFractionDigits: digits })
const fmtDate = (ymd: string | null) => {
  if (!ymd) return "—"
  const [y, m, d] = ymd.split("-").map(Number)
  return `${String(d).padStart(2, "0")} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1]} ${y}`
}
const fyLabel = (fy: number) => `FY ${fy}-${String((fy + 1) % 100).padStart(2, "0")}`
const todayYmd = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

type Form = {
  id: string | null
  lsuName: string
  pickupDate: string
  weightKg: string
  boxes: string
  courier: string
  awb: string
  status: PickupStatus
  receivedDate: string
  receivedWeightKg: string
  cost: string
  notes: string
}
const emptyForm = (lsuName = ""): Form => ({
  id: null, lsuName, pickupDate: todayYmd(), weightKg: "", boxes: "", courier: "", awb: "",
  status: "Scheduled", receivedDate: "", receivedWeightKg: "", cost: "", notes: "",
})
const formFrom = (p: ReversePickup): Form => ({
  id: p.id, lsuName: p.lsuName, pickupDate: p.pickupDate, weightKg: String(p.weightKg), boxes: p.boxes == null ? "" : String(p.boxes),
  courier: p.courier, awb: p.awb, status: p.status, receivedDate: p.receivedDate || "",
  receivedWeightKg: p.receivedWeightKg == null ? "" : String(p.receivedWeightKg), cost: p.cost == null ? "" : String(p.cost), notes: p.notes,
})

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "green" }) {
  return (
    <div className="rounded-[14px] border border-[#ebe9e4] bg-white px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-[#6B6B6B]">{label}</p>
      <p className={cn("mt-1 text-[22px] font-semibold tabular-nums tracking-[-0.02em]", tone === "green" ? "text-[#1B7339]" : "text-[#141414]")}>{value}</p>
      {sub ? <p className="text-[12px] text-[#6B6B6B]">{sub}</p> : null}
    </div>
  )
}

export default function LsuWastePage() {
  const [fy, setFy] = useState<number | null>(null)
  const [currentFy, setCurrentFy] = useState<number | null>(null)
  const [report, setReport] = useState<LsuWasteReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [view, setView] = useState<"collected" | "reverse">("collected")
  const [search, setSearch] = useState("")
  const [showAll, setShowAll] = useState(false)
  const [pickupLsu, setPickupLsu] = useState(ALL)
  const [pickupStatus, setPickupStatus] = useState(ALL)
  const [form, setForm] = useState<Form | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  const load = useCallback(async (year: number | null) => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/admin/lsu-waste${year ? `?fy=${year}` : ""}`)
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.error || "Could not load LSU waste")
      setReport(data.report)
      setCurrentFy(data.currentFy)
      setFy(data.report.fy)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load LSU waste")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(null)
  }, [load])

  const fyOptions = useMemo(() => {
    if (currentFy == null) return []
    return Array.from({ length: currentFy - 2021 + 1 }, (_, i) => currentFy - i)
  }, [currentFy])

  // Highlight the running month when looking at the current FY
  const nowCol = useMemo(() => {
    if (!report || report.fy !== currentFy) return -1
    const m = new Date().getMonth()
    return (m + 12 - 3) % 12
  }, [report, currentFy])

  const rows = useMemo(() => {
    if (!report) return []
    const q = search.trim().toLowerCase()
    return report.rows.filter((r) => {
      if (q && !r.lsuName.toLowerCase().includes(q) && !r.technician.toLowerCase().includes(q)) return false
      if (showAll) return true
      return r.collectedTotal > 0 || r.pickups > 0 || r.sinceLastPickup != null
    })
  }, [report, search, showAll])

  const pickups = useMemo(
    () =>
      (report?.pickups ?? []).filter(
        (p) => (pickupLsu === ALL || p.lsuName.toLowerCase() === pickupLsu.toLowerCase()) && (pickupStatus === ALL || p.status === pickupStatus),
      ),
    [report, pickupLsu, pickupStatus],
  )

  const waiting = useMemo(() => (report?.rows ?? []).reduce((s, r) => s + (r.sinceLastPickup ?? 0), 0), [report])

  const openNew = (lsuName = "") => {
    setFormError("")
    setForm(emptyForm(lsuName))
  }

  const save = async () => {
    if (!form) return
    setSaving(true)
    setFormError("")
    try {
      const res = await fetch("/api/admin/lsu-waste", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.error || "Could not save pickup")
      setForm(null)
      await load(fy)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not save pickup")
    } finally {
      setSaving(false)
    }
  }

  const remove = async (p: ReversePickup) => {
    if (!window.confirm(`Delete the ${kg(p.weightKg)} kg pickup from ${p.lsuName} on ${fmtDate(p.pickupDate)}?`)) return
    const res = await fetch(`/api/admin/lsu-waste?id=${encodeURIComponent(p.id)}`, { method: "DELETE" })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.success) {
      setError(data?.error || "Could not delete pickup")
      return
    }
    await load(fy)
  }

  const t = report?.totals
  const months = report?.months ?? []
  const cell = (v: number, i: number) => (
    <td key={i} className={cn("px-2 py-2 text-right tabular-nums", i === nowCol && "bg-[#f7fbf8]", v ? "text-[#141414]" : "text-[#c7c7cc]")}>
      {v ? kg(v) : "–"}
    </td>
  )
  const lsuCell = (r: LsuWasteRow) => (
    <td className="sticky left-0 z-10 min-w-[180px] bg-white px-3 py-2">
      <p className="font-medium text-[#141414]">{r.lsuName}</p>
      <p className="text-[11px] text-[#6B6B6B]">{r.technician || (r.lsuName === "Unassigned" ? "Customers with no LSU set" : "No technician")}</p>
    </td>
  )

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={<Recycle />}
        title="LSU's Waste"
        description="Cigarette waste collected by each LSU, month by month, and reverse pickups of that waste to the plant."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={fy ? String(fy) : ""} onValueChange={(v) => load(Number(v))} disabled={!fyOptions.length}>
              <SelectTrigger className="w-[140px] rounded-full bg-white">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {fyOptions.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {fyLabel(y)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <AdminRefreshButton loading={loading} onClick={() => load(fy)} />
            <Button variant="outline" className="rounded-full" disabled={!report} asChild>
              <a href={`/api/admin/lsu-waste?format=xlsx${fy ? `&fy=${fy}` : ""}`}>
                <Download className="mr-2 h-4 w-4" />
                Excel
              </a>
            </Button>
            <Button className="rounded-full bg-[#1B7339] hover:bg-[#145a2c]" onClick={() => openNew()} disabled={!report}>
              <Plus className="mr-2 h-4 w-4" />
              Reverse pickup
            </Button>
          </div>
        }
      />

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      {loading && !report ? (
        <div className="py-16 text-center text-[#6B6B6B]">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        </div>
      ) : report && t ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label={`Waste collected · ${report.label}`} value={`${kg(t.collectedTotal, 1)} kg`} sub={`${t.collections.toLocaleString("en-IN")} collections · ${t.lsusWithWaste} LSUs`} tone="green" />
            <Kpi label="Reverse pickup dispatched" value={`${kg(t.dispatchedTotal, 1)} kg`} sub={`${t.pickups} pickup${t.pickups === 1 ? "" : "s"}`} />
            <Kpi label="Received at plant" value={`${kg(t.receivedTotal, 1)} kg`} sub={t.dispatchedTotal ? `${Math.round((t.receivedTotal / t.dispatchedTotal) * 100)}% of dispatched` : "No pickups yet"} />
            <Kpi label="Waiting at LSUs" value={`${kg(waiting, 1)} kg`} sub={`Collected since each LSU's last pickup · ${t.activeKiosks} active kiosks`} />
          </div>

          <div className="overflow-hidden rounded-[14px] border border-[#ebe9e4] bg-white">
            <div className="flex flex-col gap-3 border-b border-[#ebe9e4] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="inline-flex rounded-full bg-[#f2f2f4] p-1 text-sm">
                {(
                  [
                    ["collected", "Waste collected", Recycle],
                    ["reverse", "Reverse pickup", Truck],
                  ] as const
                ).map(([key, label, Icon]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setView(key)}
                    className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition-colors", view === key ? "bg-white text-[#141414] shadow-sm" : "text-[#6B6B6B]")}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="flex items-center gap-2 text-sm text-[#5A5A5A]">
                  <Checkbox checked={showAll} onCheckedChange={(v) => setShowAll(v === true)} />
                  Show LSUs with no activity
                </label>
                <AdminSearchInput value={search} onChange={setSearch} placeholder="Search LSU or technician" className="sm:w-[240px]" />
              </div>
            </div>

            {rows.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-[#6B6B6B]">No LSUs match.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-[#ebe9e4] bg-[#fafaf8] text-[11px] uppercase tracking-wide text-[#6B6B6B]">
                      <th className="sticky left-0 z-10 bg-[#fafaf8] px-3 py-2 text-left font-medium">LSU</th>
                      {view === "collected" ? (
                        <>
                          <th className="px-2 py-2 text-right font-medium" title="Active customers (Active / Renewal due)">Cust.</th>
                          <th className="px-2 py-2 text-right font-medium" title="Kiosks at active customers">Kiosks</th>
                        </>
                      ) : (
                        <th className="px-2 py-2 text-right font-medium">Pickups</th>
                      )}
                      {months.map((m, i) => (
                        <th key={m} className={cn("whitespace-nowrap px-2 py-2 text-right font-medium", i === nowCol && "bg-[#eef7f0] text-[#1B7339]")}>
                          {m}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-right font-semibold text-[#141414]">{view === "collected" ? "Total kg" : "Dispatched"}</th>
                      {view === "reverse" ? (
                        <>
                          <th className="px-2 py-2 text-right font-medium">Received</th>
                          <th className="whitespace-nowrap px-2 py-2 text-left font-medium">Last pickup</th>
                          <th className="whitespace-nowrap px-2 py-2 text-right font-medium" title="kg collected after the last pickup">Since last</th>
                          <th className="px-2 py-2" />
                        </>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0eee9]">
                    {rows.map((r) => (
                      <tr key={r.lsuName} className="hover:bg-[#fcfcfa]">
                        {lsuCell(r)}
                        {view === "collected" ? (
                          <>
                            <td className="px-2 py-2 text-right tabular-nums text-[#5A5A5A]">{r.activeCustomers || "–"}</td>
                            <td className="px-2 py-2 text-right tabular-nums text-[#5A5A5A]">{r.activeKiosks || "–"}</td>
                            {r.collected.map(cell)}
                            <td className="px-3 py-2 text-right font-semibold tabular-nums text-[#141414]">{kg(r.collectedTotal)}</td>
                          </>
                        ) : (
                          <>
                            <td className="px-2 py-2 text-right tabular-nums text-[#5A5A5A]">{r.pickups || "–"}</td>
                            {r.dispatched.map(cell)}
                            <td className="px-3 py-2 text-right font-semibold tabular-nums text-[#141414]">{kg(r.dispatchedTotal)}</td>
                            <td className="px-2 py-2 text-right tabular-nums text-[#5A5A5A]">{r.receivedTotal ? kg(r.receivedTotal) : "–"}</td>
                            <td className="whitespace-nowrap px-2 py-2 text-[#5A5A5A]">{fmtDate(r.lastPickupDate)}</td>
                            <td className="px-2 py-2 text-right tabular-nums">{r.sinceLastPickup == null ? <span className="text-[#c7c7cc]">No pickup yet</span> : `${kg(r.sinceLastPickup)} kg`}</td>
                            <td className="px-2 py-2 text-right">
                              {r.lsuName !== "Unassigned" ? (
                                <Button size="sm" variant="ghost" className="h-7 rounded-full px-2 text-[#1B7339]" onClick={() => openNew(r.lsuName)}>
                                  <Plus className="h-3.5 w-3.5" />
                                </Button>
                              ) : null}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-[#ebe9e4] bg-[#f4fbf5] font-semibold">
                      <td className="sticky left-0 z-10 bg-[#f4fbf5] px-3 py-2">All LSUs</td>
                      {view === "collected" ? (
                        <>
                          <td className="px-2 py-2 text-right tabular-nums">{t.activeCustomers}</td>
                          <td className="px-2 py-2 text-right tabular-nums">{t.activeKiosks}</td>
                          {t.collected.map(cell)}
                          <td className="px-3 py-2 text-right tabular-nums text-[#1B7339]">{kg(t.collectedTotal)}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-2 py-2 text-right tabular-nums">{t.pickups}</td>
                          {t.dispatched.map(cell)}
                          <td className="px-3 py-2 text-right tabular-nums text-[#1B7339]">{kg(t.dispatchedTotal)}</td>
                          <td className="px-2 py-2 text-right tabular-nums">{t.receivedTotal ? kg(t.receivedTotal) : "–"}</td>
                          <td />
                          <td className="px-2 py-2 text-right tabular-nums">{waiting ? `${kg(waiting)} kg` : "–"}</td>
                          <td />
                        </>
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
            <p className="border-t border-[#ebe9e4] px-4 py-2 text-[11px] text-[#86868b]">
              {view === "collected"
                ? "kg of completed collections from customers on each LSU, by collection month (IST). Totals include paused / inactive customers' past collections."
                : "kg dispatched per pickup month (cancelled pickups excluded). Since last = kg collected from customers after that LSU's latest pickup."}
            </p>
          </div>

          <div className="overflow-hidden rounded-[14px] border border-[#ebe9e4] bg-white">
            <div className="flex flex-col gap-3 border-b border-[#ebe9e4] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[15px] font-semibold text-[#141414]">Reverse pickups · {report.label}</p>
                <p className="text-[12px] text-[#6B6B6B]">{pickups.length} of {report.pickups.length} shown</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={pickupLsu} onValueChange={setPickupLsu}>
                  <SelectTrigger className="w-[180px] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All LSUs</SelectItem>
                    {report.lsuOptions.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={pickupStatus} onValueChange={setPickupStatus}>
                  <SelectTrigger className="w-[150px] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All statuses</SelectItem>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {report.pickups.length === 0 ? (
              <AdminEmptyState
                className="rounded-none shadow-none"
                icon={<Truck />}
                title="No reverse pickups recorded"
                description={`Record each courier pickup of waste from an LSU to the plant. ${report.label} has none yet.`}
                action={
                  <Button className="rounded-full bg-[#1B7339] hover:bg-[#145a2c]" onClick={() => openNew()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add reverse pickup
                  </Button>
                }
              />
            ) : pickups.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-[#6B6B6B]">No pickups match these filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-[#ebe9e4] bg-[#fafaf8] text-left text-[11px] uppercase tracking-wide text-[#6B6B6B]">
                      <th className="px-3 py-2 font-medium">Pickup date</th>
                      <th className="px-3 py-2 font-medium">LSU</th>
                      <th className="px-3 py-2 text-right font-medium">Dispatched</th>
                      <th className="px-3 py-2 text-right font-medium">Boxes</th>
                      <th className="px-3 py-2 font-medium">Courier · AWB</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 text-right font-medium">Received</th>
                      <th className="px-3 py-2 text-right font-medium">Cost</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0eee9]">
                    {pickups.map((p) => (
                      <tr key={p.id} className="align-top hover:bg-[#fcfcfa]">
                        <td className="whitespace-nowrap px-3 py-2">{fmtDate(p.pickupDate)}</td>
                        <td className="px-3 py-2">
                          <p className="font-medium text-[#141414]">{p.lsuName}</p>
                          {p.notes ? <p className="max-w-[260px] text-[11px] text-[#6B6B6B]">{p.notes}</p> : null}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{kg(p.weightKg)} kg</td>
                        <td className="px-3 py-2 text-right tabular-nums">{p.boxes ?? "–"}</td>
                        <td className="px-3 py-2">
                          <p>{p.courier || "—"}</p>
                          {p.awb ? <p className="font-mono text-[11px] text-[#6B6B6B]">{p.awb}</p> : null}
                        </td>
                        <td className="px-3 py-2">
                          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS_TONE[p.status])}>{p.status}</span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                          {p.status === "Received" ? (
                            <>
                              <p>{kg(p.receivedWeightKg ?? p.weightKg)} kg</p>
                              <p className="text-[11px] text-[#6B6B6B]">{fmtDate(p.receivedDate)}</p>
                            </>
                          ) : (
                            "–"
                          )}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{p.cost == null ? "–" : `₹${p.cost.toLocaleString("en-IN")}`}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-right">
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="Edit" onClick={() => { setFormError(""); setForm(formFrom(p)) }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="Delete" onClick={() => remove(p)}>
                            <Trash2 className="h-3.5 w-3.5 text-red-600" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}

      <Dialog open={form != null} onOpenChange={(o) => !o && !saving && setForm(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{form?.id ? "Edit reverse pickup" : "Add reverse pickup"}</DialogTitle>
            <DialogDescription>Courier pickup of collected waste from an LSU to the plant.</DialogDescription>
          </DialogHeader>
          {form ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">LSU</Label>
                <Select value={form.lsuName} onValueChange={(v) => setForm({ ...form, lsuName: v })}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select LSU" />
                  </SelectTrigger>
                  <SelectContent>
                    {(report?.lsuOptions ?? []).map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Pickup date</Label>
                <Input type="date" value={form.pickupDate} onChange={(e) => setForm({ ...form, pickupDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Weight dispatched (kg)</Label>
                <Input type="number" min={0} step="0.01" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Boxes / bags</Label>
                <Input type="number" min={0} value={form.boxes} onChange={(e) => setForm({ ...form, boxes: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as PickupStatus, receivedDate: v === "Received" && !form.receivedDate ? todayYmd() : form.receivedDate })}>
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Courier</Label>
                <Input value={form.courier} onChange={(e) => setForm({ ...form, courier: e.target.value })} placeholder="e.g. Delhivery" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">AWB / tracking no.</Label>
                <Input value={form.awb} onChange={(e) => setForm({ ...form, awb: e.target.value })} />
              </div>
              {form.status === "Received" ? (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Received at plant on</Label>
                    <Input type="date" value={form.receivedDate} onChange={(e) => setForm({ ...form, receivedDate: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Weight received (kg)</Label>
                    <Input type="number" min={0} step="0.01" value={form.receivedWeightKg} onChange={(e) => setForm({ ...form, receivedWeightKg: e.target.value })} placeholder={form.weightKg ? `Same as dispatched (${form.weightKg})` : ""} />
                  </div>
                </>
              ) : null}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Courier cost (₹, optional)</Label>
                <Input type="number" min={0} value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Notes</Label>
                <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              {formError ? <p className="text-sm text-red-600 sm:col-span-2">{formError}</p> : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setForm(null)} disabled={saving}>
              Cancel
            </Button>
            <Button className="rounded-full bg-[#1B7339] hover:bg-[#145a2c]" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {form?.id ? "Save changes" : "Add pickup"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
