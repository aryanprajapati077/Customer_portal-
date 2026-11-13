"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Copy, Download, UserCheck, ExternalLink, Eye, FileText, Loader2, Pencil, Plus, Save, Search, Trash2 } from "lucide-react"
import {
  GST_STATE_CODES,
  QUOTATION_PRODUCTS,
  emptyParty,
  newItem,
  standardNet,
  type LineType,
  type QuotationItem,
  QUOTATION_STATUSES,
  formatDate,
  type QuotationStatus,
  computeQuotation,
  defaultQuotation,
  formatInrNumber,
  normalizeGstin,
  parseGstPortalText,
  validateGstin,
  type KioskType,
  type PartyDetails,
  type QuotationConfig,
} from "@/lib/quotation"

type SavedRow = {
  id: string
  piNo: string
  clientName: string
  gstin: string | null
  kioskType: string | null
  sez: boolean
  grandTotal: number
  status: QuotationStatus
  createdBy: string | null
  createdAt: string
}

type Lookup = {
  details: { legalName: string; tradeName: string; address: string; city: string; state: string; pincode: string } | null
  derived: { state: string; pan: string }
  warnings: string[]
  source: string
}

type SavedClient = {
  id: string
  gstin?: string
  brandName: string
  tradeName: string
  data: Partial<Pick<QuotationConfig, "clientName" | "city" | "bill" | "ship" | "sez">>
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function GstinHint({ value }: { value: string }) {
  if (!value) return <p className="text-[11px] text-muted-foreground">15 characters, e.g. 36AABCT2223L1ZF</p>
  if (value.length < 15)
    return <p className="text-[11px] text-muted-foreground">{value.length}/15 characters</p>
  const r = validateGstin(value)
  if (r.valid)
    return <p className="text-[11px] text-emerald-600">✓ Valid GSTIN · {GST_STATE_CODES[value.slice(0, 2)]} · PAN {value.slice(2, 12)}</p>
  return <p className={`text-[11px] ${r.checksumOnly ? "text-amber-600" : "text-destructive"}`}>{r.error}{r.checksumOnly ? " — re-check the last character" : ""}</p>
}

const numVal = (v: string) => (v === "" ? 0 : Math.max(0, Number(v) || 0))

function PartyFields({
  p, onChange, onPin, nameLabel,
}: { p: PartyDetails; onChange: (x: Partial<PartyDetails>) => void; onPin: (pin: string) => void; nameLabel: string }) {
  return (
    <>
      <Field label={nameLabel}>
        <Input value={p.name} onChange={(e) => onChange({ name: e.target.value })} />
      </Field>
      <Field label="Address (building, street, area)">
        <Textarea rows={2} value={p.address} onChange={(e) => onChange({ address: e.target.value })} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Pincode">
          <Input
            inputMode="numeric"
            maxLength={6}
            placeholder="6 digits"
            value={p.pincode}
            onChange={(e) => {
              const pin = e.target.value.replace(/\D/g, "").slice(0, 6)
              onChange({ pincode: pin })
              onPin(pin)
            }}
          />
        </Field>
        <Field label="City / District">
          <Input value={p.city} onChange={(e) => onChange({ city: e.target.value })} />
        </Field>
        <Field label="State">
          <Input value={p.state} onChange={(e) => onChange({ state: e.target.value })} />
        </Field>
      </div>
    </>
  )
}

export default function AdminQuotationsPage() {
  const [q, setQ] = useState<QuotationConfig>(() => defaultQuotation())
  const [busy, setBusy] = useState<"" | "billLookup" | "shipLookup" | "preview" | "download">("")
  const [msg, setMsg] = useState<{ kind: "ok" | "err" | "info"; text: string } | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const prevRef = useRef<string | null>(null)
  const [view, setView] = useState<"form" | "list">("form")
  const [editId, setEditId] = useState<string | null>(null)
  const [status, setStatus] = useState<QuotationStatus>("Draft")
  const [rows, setRows] = useState<SavedRow[]>([])
  const [listBusy, setListBusy] = useState(false)
  const [search, setSearch] = useState("")
  const [saving, setSaving] = useState(false)
  const [clients, setClients] = useState<SavedClient[]>([])
  const [shipOpen, setShipOpen] = useState(false)
  const [clientQ, setClientQ] = useState("")
  const [clientOpen, setClientOpen] = useState(false)
  const [savingClient, setSavingClient] = useState(false)

  const k = useMemo(() => computeQuotation(q), [q])
  const set = <K extends keyof QuotationConfig>(key: K, v: QuotationConfig[K]) => setQ((p) => ({ ...p, [key]: v }))
  const setBill = (patch: Partial<PartyDetails>) => setQ((p) => ({ ...p, bill: { ...p.bill, ...patch } }))
  const setShip = (patch: Partial<PartyDetails>) => setQ((p) => ({ ...p, ship: { ...p.ship, ...patch } }))
  const setItem = (i: number, patch: Partial<QuotationItem>) =>
    setQ((p) => ({
      ...p,
      items: p.items.map((x, j) => {
        if (j !== i) return x
        const next = { ...x, ...patch }
        if ("net" in patch) next.auto = false
        else if (next.auto) next.net = standardNet(next)
        return next
      }),
    }))
  const changeType = (i: number, type: LineType) =>
    setQ((p) => ({
      ...p,
      items: p.items.map((x, j) => (j === i ? { ...newItem(type), units: x.units > 0 ? x.units : 1, name: x.name, net: type === "Custom" ? x.net : standardNet({ ...newItem(type), units: x.units > 0 ? x.units : 1 }) } : x)),
    }))
  const addItem = () => setQ((p) => ({ ...p, items: [...p.items, newItem("Basic")] }))
  const removeItem = (i: number) => setQ((p) => ({ ...p, items: p.items.length > 1 ? p.items.filter((_, j) => j !== i) : p.items }))
  const pinLookup = async (which: "bill" | "ship", pin: string) => {
    if (pin.length !== 6) return
    try {
      const d = await (await fetch(`/api/admin/quotations/pincode?pincode=${pin}`)).json()
      if (!d.success) return setMsg({ kind: "info", text: `Pincode ${pin}: ${d.error || "not found"} — enter city and state manually.` })
      const patch = { city: d.city as string, state: d.state as string }
      if (which === "bill") {
        setBill(patch)
        setQ((p) => ({ ...p, city: p.city || [d.city, d.state].filter(Boolean).join(", ") }))
      } else setShip(patch)
    } catch {
      /* manual entry still possible */
    }
  }

  const loadList = async () => {
    setListBusy(true)
    try {
      const r = await fetch("/api/admin/quotations")
      const d = await r.json()
      if (d.success) setRows(d.quotations)
    } finally {
      setListBusy(false)
    }
  }
  const fetchNextPi = async () => {
    try {
      const d = await (await fetch("/api/admin/quotations?next=1")).json()
      return d.success ? (d.piNo as string) : ""
    } catch {
      return ""
    }
  }
  const loadClients = async () => {
    try {
      const d = await (await fetch("/api/admin/quotations/clients")).json()
      if (d.success) setClients(d.clients)
    } catch { /* ignore */ }
  }
  const pickClient = (c: SavedClient) => {
    setQ((p) => ({
      ...p,
      brandName: c.brandName,
      tradeName: c.tradeName,
      clientName: c.data.clientName || c.tradeName || c.brandName,
      city: c.data.city ?? "",
      bill: { ...emptyParty(), ...c.data.bill },
      ship: { ...emptyParty(), ...c.data.ship },
      sez: c.data.sez === true,
    }))
    setShipOpen(!!(c.data.ship?.name || c.data.ship?.address || c.data.ship?.gstin))
    setClientOpen(false)
    setClientQ("")
    setMsg({ kind: "info", text: `Loaded ${c.brandName}. Add kiosk quantity and price.` })
  }
  const saveClient = async () => {
    setSavingClient(true)
    try {
      const r = await fetch("/api/admin/quotations/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: q }),
      })
      const d = await r.json()
      if (!r.ok || !d.success) throw new Error(d.error || "Could not save client")
      setMsg({ kind: "ok", text: "Client saved (matched by GSTIN)." })
      loadClients()
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "Could not save client" })
    } finally {
      setSavingClient(false)
    }
  }
  const removeClient = async (c: SavedClient) => {
    if (!confirm(`Delete saved client ${c.brandName}?`)) return
    await fetch(`/api/admin/quotations/clients?id=${c.id}`, { method: "DELETE" })
    loadClients()
  }
  const filteredClients = useMemo(() => {
    const s = clientQ.trim().toLowerCase()
    const list = s
      ? clients.filter((c) => `${c.brandName} ${c.tradeName} ${c.data.bill?.gstin ?? ""}`.toLowerCase().includes(s))
      : clients
    return list.slice(0, 80)
  }, [clients, clientQ])

  useEffect(() => {
    loadClients()
    fetchNextPi().then((pi) => pi && setQ((p) => (p.piNo ? p : { ...p, piNo: pi })))
    loadList()
  }, [])

  const newQuotation = async () => {
    setQ({ ...defaultQuotation(), piNo: await fetchNextPi() })
    setEditId(null)
    setStatus("Draft")
    setPreviewUrl(null)
    setMsg(null)
    setView("form")
  }
  const openSaved = async (id: string, duplicate = false) => {
    const d = await (await fetch(`/api/admin/quotations?id=${id}`)).json()
    if (!d.success) return setMsg({ kind: "err", text: d.error || "Could not open" })
    const c = { ...defaultQuotation(), ...d.quotation.config } as QuotationConfig
    if (duplicate) {
      c.piNo = await fetchNextPi()
      c.date = defaultQuotation().date
      setEditId(null)
      setStatus("Draft")
    } else {
      setEditId(id)
      setStatus(d.quotation.status)
    }
    setQ(c)
    setPreviewUrl(null)
    setMsg(duplicate ? { kind: "info", text: "Duplicated as a new draft with a fresh PI number." } : null)
    setView("form")
  }
  const saveQuotation = async () => {
    setSaving(true)
    setMsg(null)
    try {
      const r = await fetch("/api/admin/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editId, status, config: payload() }),
      })
      const d = await r.json()
      if (!r.ok || !d.success) throw new Error(d.error || "Save failed")
      setEditId(d.id)
      setMsg({ kind: "ok", text: `Saved ${q.piNo}.${d.clientSaved ? " Client details updated by GSTIN." : ""}` })
      loadList()
      if (d.clientSaved) loadClients()
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "Save failed" })
    } finally {
      setSaving(false)
    }
  }
  const changeStatus = async (id: string, s: QuotationStatus) => {
    setRows((p) => p.map((x) => (x.id === id ? { ...x, status: s } : x)))
    await fetch("/api/admin/quotations", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: s }) })
  }
  const removeSaved = async (r: SavedRow) => {
    if (!confirm(`Delete ${r.piNo} (${r.clientName})?`)) return
    await fetch(`/api/admin/quotations?id=${r.id}`, { method: "DELETE" })
    if (editId === r.id) setEditId(null)
    loadList()
  }
  const downloadSaved = async (id: string) => {
    const d = await (await fetch(`/api/admin/quotations?id=${id}`)).json()
    if (!d.success) return
    const res = await fetch("/api/admin/quotations/pdf", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d.quotation.config) })
    if (!res.ok) return setMsg({ kind: "err", text: "Could not generate PDF" })
    const url = URL.createObjectURL(await res.blob())
    const a = document.createElement("a")
    a.href = url
    a.download = `Buffindia-Proposal-${(d.quotation.config.clientName || "Client").replace(/[^a-zA-Z0-9]+/g, "-")}.pdf`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }
  const filteredRows = rows.filter((r) => `${r.piNo} ${r.clientName} ${r.gstin ?? ""}`.toLowerCase().includes(search.toLowerCase()))

  useEffect(() => () => { if (prevRef.current) URL.revokeObjectURL(prevRef.current) }, [])

  async function lookup(which: "bill" | "ship") {
    const party = which === "bill" ? q.bill : q.ship
    const g = normalizeGstin(party.gstin)
    const v = validateGstin(g)
    if (!v.valid && !v.checksumOnly) return setMsg({ kind: "err", text: v.error || "Invalid GSTIN" })
    setBusy(which === "bill" ? "billLookup" : "shipLookup")
    setMsg(null)
    try {
      const res = await fetch(`/api/admin/quotations/gstin?gstin=${g}`)
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Lookup failed")
      const l = data as Lookup
      const patch: Partial<PartyDetails> = { gstin: g, state: l.derived.state }
      if (l.details) {
        const d = l.details
        Object.assign(patch, { name: d.tradeName || d.legalName, address: d.address, city: d.city, state: d.state || l.derived.state, pincode: d.pincode })
        if (which === "bill") {
          setQ((p) => ({
            ...p,
            clientName: d.tradeName || d.legalName || p.clientName,
            city: [d.city, d.state || l.derived.state].filter(Boolean).join(", ") || p.city,
          }))
        }
      } else if (which === "bill") {
        setQ((p) => ({ ...p, city: p.city || l.derived.state }))
      }
      if (which === "bill") setBill(patch)
      else setShip(patch)
      setMsg({
        kind: l.details ? "ok" : "info",
        text: l.details
          ? `Fetched from ${l.source === "portal" ? "Buffindia portal customers" : "GST records"}: ${l.details.legalName}`
          : `GSTIN is valid (${l.derived.state}, PAN ${l.derived.pan}). Address could not be fetched automatically — use “Paste from GST portal” below or type it, then enter the pincode to fill city and state.`,
      })
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "Lookup failed" })
    } finally {
      setBusy("")
    }
  }

  const payload = (): QuotationConfig => q

  async function generate(mode: "preview" | "download") {
    setBusy(mode)
    setMsg(null)
    try {
      const res = await fetch(`/api/admin/quotations/pdf${mode === "preview" ? "?inline=1" : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload()),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Could not generate PDF")
      const url = URL.createObjectURL(await res.blob())
      if (mode === "preview") {
        if (prevRef.current) URL.revokeObjectURL(prevRef.current)
        prevRef.current = url
        setPreviewUrl(url)
      } else {
        const a = document.createElement("a")
        a.href = url
        a.download = `Buffindia-Proposal-${(q.clientName || "Client").replace(/[^a-zA-Z0-9]+/g, "-")}.pdf`
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 5000)
      }
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "Failed" })
    } finally {
      setBusy("")
    }
  }

  const gstinRow = (which: "bill" | "ship", p: PartyDetails, onChange: (x: Partial<PartyDetails>) => void) => (
    <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
      <Field label="GSTIN">
        <Input
          value={p.gstin}
          maxLength={15}
          placeholder="e.g. 36AABCT2223L1ZF"
          onChange={(e) => onChange({ gstin: normalizeGstin(e.target.value) })}
        />
        <GstinHint value={p.gstin} />
      </Field>
      <Button type="button" variant="outline" onClick={() => lookup(which)} disabled={!!busy || !(validateGstin(p.gstin).valid || validateGstin(p.gstin).checksumOnly)}>
        {busy === `${which}Lookup` ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
        Fetch details
      </Button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
          <FileText className="w-3.5 h-3.5" />
          Quotation generator
        </div>
        <h1 className="admin-page-title">Quotations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pick or add a client, set kiosks and price, then download the proposal PDF.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant={view === "form" ? "default" : "outline"} size="sm" onClick={() => setView("form")}>
          {editId ? "Edit quotation" : "New quotation"}
        </Button>
        <Button type="button" variant={view === "list" ? "default" : "outline"} size="sm" onClick={() => { setView("list"); loadList() }}>
          Saved quotations ({rows.length})
        </Button>
        {view === "form" && (editId || q.clientName) && (
          <Button type="button" variant="ghost" size="sm" onClick={newQuotation}><Plus className="w-4 h-4 mr-1" />Start new</Button>
        )}
      </div>

      {msg && (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            msg.kind === "err" ? "border-destructive/40 text-destructive" : msg.kind === "ok" ? "border-emerald-500/40 text-emerald-700" : "text-muted-foreground"
          }`}
        >
          {msg.text}
        </div>
      )}

      {view === "list" && (
        <Card>
          <CardHeader>
            <CardTitle>Saved quotations</CardTitle>
            <div className="relative max-w-sm">
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input className="pl-8" placeholder="Search PI no, client or GSTIN" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {listBusy ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : filteredRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No saved quotations yet. Create one and press Save.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b">
                    <th className="py-2 pr-3">PI No.</th><th className="pr-3">Client</th><th className="pr-3">Kiosk</th>
                    <th className="pr-3 text-right">Total (₹)</th><th className="pr-3">Status</th><th className="pr-3">Created</th><th />
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium whitespace-nowrap">{r.piNo}</td>
                      <td className="pr-3">
                        {r.clientName}
                        {r.sez && <span className="ml-2 rounded bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5">SEZ</span>}
                        <div className="text-xs text-muted-foreground">{r.gstin}</div>
                      </td>
                      <td className="pr-3">{r.kioskType}</td>
                      <td className="pr-3 text-right whitespace-nowrap">{formatInrNumber(Number(r.grandTotal))}</td>
                      <td className="pr-3">
                        <Select value={r.status} onValueChange={(v) => changeStatus(r.id, v as QuotationStatus)}>
                          <SelectTrigger className="h-8 w-[110px]"><SelectValue /></SelectTrigger>
                          <SelectContent>{QUOTATION_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </td>
                      <td className="pr-3 whitespace-nowrap text-xs">{formatDate(String(r.createdAt).slice(0, 10))}</td>
                      <td className="whitespace-nowrap text-right">
                        <Button size="icon" variant="ghost" title="Edit" onClick={() => openSaved(r.id)}><Pencil className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" title="Duplicate" onClick={() => openSaved(r.id, true)}><Copy className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" title="Download PDF" onClick={() => downloadSaved(r.id)}><Download className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" title="Delete" onClick={() => removeSaved(r)}><Trash2 className="w-4 h-4" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      <div className={`grid gap-6 xl:grid-cols-2 ${view === "list" ? "hidden" : ""}`}>
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle>1 · Client</CardTitle>
                  <CardDescription>Pick a saved client, or enter the GSTIN. Clients are saved automatically by GSTIN when you save the quotation.</CardDescription>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={saveClient} disabled={savingClient}>
                  {savingClient ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <UserCheck className="w-4 h-4 mr-1" />}
                  Save client
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Search saved clients by brand or trade name…"
                  value={clientQ}
                  onFocus={() => setClientOpen(true)}
                  onChange={(e) => { setClientQ(e.target.value); setClientOpen(true) }}
                />
                {clientOpen && (
                  <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border bg-popover shadow-lg">
                    {filteredClients.length === 0 ? (
                      <p className="px-3 py-3 text-xs text-muted-foreground">{clients.length ? "No client found" : "No saved clients yet."}</p>
                    ) : (
                      filteredClients.map((c) => (
                        <div key={c.id} className="flex items-center hover:bg-muted">
                          <button type="button" className="flex-1 min-w-0 px-3 py-2 text-left" onClick={() => pickClient(c)}>
                            <div className="text-sm font-semibold truncate">{c.brandName}</div>
                            <div className="text-xs text-muted-foreground truncate">{[c.tradeName, c.gstin].filter(Boolean).join(" · ")}</div>
                          </button>
                          <Button type="button" size="icon" variant="ghost" className="h-7 w-7 mr-1" title="Delete saved client" onClick={() => removeClient(c)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))
                    )}
                    <button type="button" className="w-full border-t px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted" onClick={() => setClientOpen(false)}>Close</button>
                  </div>
                )}
              </div>

              {gstinRow("bill", q.bill, setBill)}
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground">Address not fetching? Paste from GST portal</summary>
                <div className="mt-2 space-y-2">
                  <a href="https://services.gst.gov.in/services/searchtp" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline">
                    <ExternalLink className="w-3 h-3" /> Open GST portal search
                  </a>
                  <Textarea
                    rows={2}
                    placeholder="Legal Name of Business … Principal Place of Business …"
                    onChange={(e) => {
                      const r = parseGstPortalText(e.target.value)
                      if (!r) return
                      const nm = r.tradeName || r.legalName
                      setBill({ name: nm, address: r.address, pincode: r.pincode })
                      setQ((p) => ({ ...p, clientName: nm, brandName: p.brandName || nm, tradeName: p.tradeName || r.tradeName }))
                      if (r.pincode) pinLookup("bill", r.pincode)
                      setMsg({ kind: "ok", text: `Filled from pasted GST portal text: ${r.legalName}` })
                    }}
                  />
                </div>
              </details>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Brand name">
                  <Input value={q.brandName} onChange={(e) => set("brandName", e.target.value)} />
                </Field>
                <Field label="Trade name">
                  <Input value={q.tradeName} onChange={(e) => set("tradeName", e.target.value)} />
                </Field>
              </div>

              <div className="space-y-3 border-t pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Billing address</p>
                <PartyFields p={q.bill} onChange={setBill} onPin={(pin) => pinLookup("bill", pin)} nameLabel="Billing name" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Client name on cover letter">
                    <Input value={q.clientName} onChange={(e) => set("clientName", e.target.value)} />
                  </Field>
                  <Field label="Location (City, State)">
                    <Input value={q.city} onChange={(e) => set("city", e.target.value)} placeholder="Hyderabad, Telangana" />
                  </Field>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Shipping address</p>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setShipOpen((o) => !o)}>
                    {shipOpen ? "Same as billing" : "Different shipping address"}
                  </Button>
                </div>
                {!shipOpen && <p className="text-xs text-muted-foreground mt-1">Billing address will be used on the proforma.</p>}
                {shipOpen && (
                  <div className="space-y-3 mt-3">
                    <div className="flex gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => setShip({ ...q.bill })}>
                        <Copy className="w-4 h-4 mr-1" /> Copy from billing
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => { set("ship", emptyParty()); setShipOpen(false) }}>
                        Clear
                      </Button>
                    </div>
                    {gstinRow("ship", q.ship, setShip)}
                    <PartyFields p={q.ship} onChange={setShip} onPin={(pin) => pinLookup("ship", pin)} nameLabel="Shipping name" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2 · Kiosks & price</CardTitle>
              <CardDescription>Kiosk type, quantity and net value (before GST).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {q.items.map((it, i) => (
                <div key={i} className="rounded-lg border p-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Item {i + 1}</span>
                    {q.items.length > 1 && (
                      <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeItem(i)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-4">
                    <Field label="Kiosk type">
                      <Select value={it.type} onValueChange={(v) => changeType(i, v as LineType)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Basic">Basic</SelectItem>
                          <SelectItem value="Advance">Advance</SelectItem>
                          <SelectItem value="Combo">Combo (Basic + Advance)</SelectItem>
                          <SelectItem value="Custom">Other item</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    {it.type === "Custom" && (
                      <Field label="Item name" className="sm:col-span-2">
                        <Input value={it.name} onChange={(e) => setItem(i, { name: e.target.value })} />
                      </Field>
                    )}
                    <Field label={it.type === "Combo" ? "Basic kiosks" : it.type === "Custom" ? "Quantity" : "No. of kiosks"}>
                      <Input type="number" min={1} value={it.units} onChange={(e) => setItem(i, { units: Math.floor(numVal(e.target.value)) })} />
                    </Field>
                    {it.type === "Combo" && (
                      <Field label="Advance kiosks">
                        <Input type="number" min={0} value={it.advanceUnits} onChange={(e) => setItem(i, { advanceUnits: Math.floor(numVal(e.target.value)) })} />
                      </Field>
                    )}
                    <Field label={it.type === "Custom" ? "Rate per unit (₹)" : "Net value (₹)"}>
                      <Input type="number" min={0} value={it.net} onChange={(e) => setItem(i, { net: numVal(e.target.value) })} />
                    </Field>
                    {it.type === "Custom" && (
                      <Field label="HSN / SAC">
                        <Input value={it.sac} onChange={(e) => setItem(i, { sac: e.target.value })} />
                      </Field>
                    )}
                  </div>
                  {it.type !== "Custom" && it.auto && (
                    <p className="text-[11px] text-muted-foreground">Standard rate filled in — edit the net value to change it.</p>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" /> Add more
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3 · Quotation details</CardTitle>
              <CardDescription>GST is automatic from the client’s GSTIN.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="PI number">
                  <Input value={q.piNo} onChange={(e) => set("piNo", e.target.value)} placeholder="BIP00001990" />
                </Field>
                <Field label="Date">
                  <Input type="date" value={q.date} onChange={(e) => set("date", e.target.value)} />
                </Field>
                <Field label="Service duration">
                  <Input value={q.duration} onChange={(e) => set("duration", e.target.value)} />
                </Field>
              </div>
              <details className="rounded-md border p-3">
              <summary className="cursor-pointer text-sm font-medium">More options (surcharge, conditions, SEZ, complimentary products)</summary>
              <div className="space-y-4 mt-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Surcharge (₹)">
                  <Input type="number" min={0} value={q.surcharge} onChange={(e) => set("surcharge", numVal(e.target.value))} />
                </Field>
                <Field label="Complimentary value (₹)">
                  <Input type="number" min={0} placeholder="= taxable total" value={q.complimentary ?? ""} onChange={(e) => set("complimentary", e.target.value === "" ? null : numVal(e.target.value))} />
                </Field>
              </div>
              <Field label="Special conditions">
                <Textarea rows={2} value={q.specialConditions} onChange={(e) => set("specialConditions", e.target.value)} placeholder="e.g. No complimentary products as part of negotiations" />
              </Field>
              <label className="flex items-start gap-2 rounded-md border p-3 text-sm cursor-pointer">
                <Checkbox checked={q.sez} onCheckedChange={(v) => set("sez", v === true)} className="mt-0.5" />
                <span>
                  <span className="font-medium">SEZ supply (zero-rated)</span>
                  <span className="block text-xs text-muted-foreground">GST becomes 0% and the proforma shows it as a supply to a Special Economic Zone.</span>
                </span>
              </label>

              <div className="space-y-2 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label>Complimentary products page</Label>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="ghost" onClick={() => set("complimentaryProducts", QUOTATION_PRODUCTS.map((p) => p.slug))}>All</Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => set("complimentaryProducts", [])}>None (hide page)</Button>
                  </div>
                </div>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {QUOTATION_PRODUCTS.map((p) => (
                    <label key={p.slug} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={q.complimentaryProducts.includes(p.slug)}
                        onCheckedChange={(v) =>
                          set("complimentaryProducts", v === true ? [...q.complimentaryProducts, p.slug] : q.complimentaryProducts.filter((s) => s !== p.slug))
                        }
                      />
                      {p.name}
                    </label>
                  ))}
                </div>
              </div>
              </div>
              </details>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 xl:sticky xl:top-4 self-start">
          <Card>
            <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              {k.lines.map((l) => (
                <div key={l.no} className="flex justify-between text-xs">
                  <span className="text-muted-foreground truncate pr-2">{l.no}. {l.name.startsWith("Buffindia") ? `${q.items[l.no - 1]?.type} kiosk${q.items[l.no - 1]?.type === "Combo" ? "s" : q.items[l.no - 1]?.units > 1 ? "s" : ""}` : l.name}</span>
                  <span>₹{formatInrNumber(l.qty * l.rate)}</span>
                </div>
              ))}
              <div className="border-t my-1" />
              {(([["Total cost", k.totalCost], ["Surcharge", k.surcharge],
                ...(k.taxType === "CGST_SGST" ? [["CGST 9%", k.cgst], ["SGST 9%", k.sgst]] : [[k.taxType === "SEZ" ? "IGST (SEZ 0%)" : "IGST 18%", k.igst]]),
              ]) as [string, number][]).map(([l, v]) => (
                <div key={l} className="flex justify-between"><span className="text-muted-foreground">{l}</span><span>₹{formatInrNumber(v)}</span></div>
              ))}
              <div className="flex justify-between font-semibold border-t pt-2"><span>Grand total</span><span>₹{formatInrNumber(k.grandTotal)}</span></div>
              <p className="text-xs rounded bg-muted px-2 py-1">
                {k.taxType === "SEZ" ? "SEZ supply: GST 0%" : k.taxType === "CGST_SGST" ? "Gujarat client (intra-state): CGST 9% + SGST 9%" : "Other state (inter-state): IGST 18%"}
              </p>
              <p className="text-xs text-muted-foreground pt-1">{k.words}</p>
              <p className="text-xs text-muted-foreground">Valid till {k.validTill}</p>
              <div className="flex items-center gap-2 pt-3">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as QuotationStatus)}>
                  <SelectTrigger className="h-8 w-[120px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{QUOTATION_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
                <Button type="button" size="sm" onClick={saveQuotation} disabled={saving || !!busy}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {editId ? "Update" : "Save"}
                </Button>
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => generate("preview")} disabled={!!busy}>
                  {busy === "preview" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
                  Preview
                </Button>
                <Button type="button" onClick={() => generate("download")} disabled={!!busy}>
                  {busy === "download" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  Download PDF
                </Button>
              </div>
            </CardContent>
          </Card>
          {previewUrl && <iframe title="Quotation preview" src={previewUrl} className="w-full h-[78vh] rounded-lg border bg-white" />}
        </div>
      </div>
    </div>
  )
}
