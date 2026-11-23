"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Copy, Download, Eye, Loader2, Pencil, Plus, Save, Trash2, Upload } from "lucide-react"
import {
  PRE_STATUSES, comparisonRecommendation, computeMulti, computePreService, emptySite, preTotal, defaultPreService, fmtKg, fmtWater, inr,
  type PreKiosk, type PreServiceConfig, type PreStatus,
} from "@/lib/preservice"

type Row = { id: string; refNo: string; name: string; city: string | null; kioskType: string | null; totalValue: number; status: PreStatus; createdAt: string }

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

export default function PreServiceProposalsPage() {
  const [tab, setTab] = useState<"form" | "saved">("form")
  const [q, setQ] = useState<PreServiceConfig>(defaultPreService())
  const [id, setId] = useState<string | null>(null)
  const [status, setStatus] = useState<PreStatus>("Draft")
  const [rows, setRows] = useState<Row[]>([])
  const [busy, setBusy] = useState("")
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const prevRef = useRef("")

  const set = <K extends keyof PreServiceConfig>(k: K, v: PreServiceConfig[K]) => setQ((p) => ({ ...p, [k]: v }))
  const numIn = (k: keyof PreServiceConfig) => ({
    type: "number" as const, min: 0,
    value: (q[k] as number | null) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k, (e.target.value === "" ? null : Number(e.target.value)) as never),
  })

  async function loadRows() {
    const d = await (await fetch("/api/admin/preservice-proposals")).json().catch(() => null)
    if (d?.success) setRows(d.proposals)
  }
  async function freshRef() {
    const d = await (await fetch("/api/admin/preservice-proposals?next=1")).json().catch(() => null)
    return d?.success ? (d.refNo as string) : ""
  }
  useEffect(() => {
    loadRows()
    freshRef().then((refNo) => setQ((p) => (p.refNo ? p : { ...p, refNo })))
  }, [])

  const m = computePreService(q)
  const total = preTotal(q)
  const mm = computeMulti(q)
  const multi = q.mode === "multi"
  const autoRec = comparisonRecommendation({ ...q, recBasic: null, recAdvance: null })
  const setSite = (i: number, patch: Partial<(typeof q.sites)[number]>) => set("sites", q.sites.map((x, j) => (j === i ? { ...x, ...patch } : x)))

  async function newOne() {
    setId(null); setStatus("Draft"); setPreviewUrl("")
    setQ({ ...defaultPreService(), mode: q.mode, refNo: await freshRef() })
    setTab("form")
  }

  async function edit(rid: string, duplicate = false) {
    const d = await (await fetch(`/api/admin/preservice-proposals?id=${rid}`)).json()
    if (!d.success) return setMsg({ kind: "err", text: d.error || "Could not load" })
    const cfg = { ...defaultPreService(), ...d.proposal.config } as PreServiceConfig
    if (duplicate) {
      setId(null); setStatus("Draft"); setQ({ ...cfg, refNo: await freshRef() })
    } else {
      setId(d.proposal.id); setStatus(d.proposal.status); setQ(cfg)
    }
    setPreviewUrl(""); setTab("form")
  }

  async function save() {
    setBusy("save"); setMsg(null)
    try {
      const r = await fetch("/api/admin/preservice-proposals", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, config: q }),
      })
      const d = await r.json()
      if (!d.success) throw new Error(d.error || "Save failed")
      setId(d.id); setMsg({ kind: "ok", text: "Saved" }); loadRows()
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "Failed" })
    } finally { setBusy("") }
  }

  async function pdf(cfg: PreServiceConfig, mode: "preview" | "download") {
    const res = await fetch(`/api/admin/preservice-proposals/pdf${mode === "preview" ? "?inline=1" : ""}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cfg),
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
      a.download = `Buffindia-PreService-Proposal-${(cfg.name || "Client").replace(/[^a-zA-Z0-9]+/g, "-")}.pdf`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    }
  }
  async function generate(mode: "preview" | "download") {
    setBusy(mode); setMsg(null)
    try { await pdf(q, mode) } catch (e) { setMsg({ kind: "err", text: e instanceof Error ? e.message : "Failed" }) } finally { setBusy("") }
  }
  async function downloadSaved(rid: string) {
    const d = await (await fetch(`/api/admin/preservice-proposals?id=${rid}`)).json()
    if (d.success) await pdf({ ...defaultPreService(), ...d.proposal.config }, "download").catch((e) => setMsg({ kind: "err", text: String(e.message) }))
  }
  async function setRowStatus(rid: string, s: PreStatus) {
    await fetch("/api/admin/preservice-proposals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: rid, status: s }) })
    loadRows()
  }
  async function remove(r: Row) {
    if (!confirm(`Delete ${r.refNo} (${r.name})?`)) return
    await fetch(`/api/admin/preservice-proposals?id=${r.id}`, { method: "DELETE" })
    if (id === r.id) setId(null)
    loadRows()
  }

  /** Load the logo, drop its white/near-white background (soft edge) and downscale → transparent PNG. */
  function onLogo(file?: File) {
    if (!file) return
    if (file.size > 6_000_000) return setMsg({ kind: "err", text: "Logo must be under 6 MB" })
    const fr = new FileReader()
    fr.onload = () => {
      const im = new window.Image()
      im.onload = () => {
        const k = Math.min(1, 900 / Math.max(im.width, im.height))
        const c = document.createElement("canvas")
        c.width = Math.round(im.width * k); c.height = Math.round(im.height * k)
        const ctx = c.getContext("2d")!
        ctx.drawImage(im, 0, 0, c.width, c.height)
        const d = ctx.getImageData(0, 0, c.width, c.height)
        const px = d.data
        for (let i = 0; i < px.length; i += 4) {
          const min = Math.min(px[i], px[i + 1], px[i + 2])
          if (min >= 245) px[i + 3] = 0
          else if (min > 215) px[i + 3] = Math.round(px[i + 3] * ((245 - min) / 30))
        }
        ctx.putImageData(d, 0, 0)
        set("customerLogo", c.toDataURL("image/png"))
      }
      im.src = String(fr.result)
    }
    fr.readAsDataURL(file)
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Pre-Service Proposal</h1>
          <p className="text-sm text-muted-foreground">Cigarette waste management proposal for a single location or multiple locations. Enter the name, kiosk type and value.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={tab === "form" ? "default" : "outline"} onClick={() => setTab("form")}>{id ? "Edit proposal" : "New proposal"}</Button>
          <Button variant={tab === "saved" ? "default" : "outline"} onClick={() => { setTab("saved"); loadRows() }}>Saved ({rows.length})</Button>
          <Button variant="outline" onClick={newOne}><Plus className="w-4 h-4 mr-1" />New</Button>
        </div>
      </div>

      {msg && <div className={`text-sm rounded-md px-3 py-2 ${msg.kind === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>{msg.text}</div>}

      {tab === "saved" ? (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground border-b">
                <tr><th className="p-3">Ref</th><th>Client / property</th><th>Kiosk</th><th className="text-right">Annual value</th><th className="pl-4">Status</th><th /></tr>
              </thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No saved proposals yet.</td></tr>}
                {rows.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="p-3 font-mono text-xs">{r.refNo}</td>
                    <td>{r.name}<div className="text-xs text-muted-foreground">{r.city}</div></td>
                    <td>{r.kioskType}</td>
                    <td className="text-right">₹{inr(r.totalValue)}</td>
                    <td className="pl-4">
                      <Select value={r.status} onValueChange={(v) => setRowStatus(r.id, v as PreStatus)}>
                        <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>{PRE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="text-right whitespace-nowrap pr-2">
                      <Button size="icon" variant="ghost" title="Edit" onClick={() => edit(r.id)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" title="Duplicate" onClick={() => edit(r.id, true)}><Copy className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" title="Download PDF" onClick={() => downloadSaved(r.id)}><Download className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" title="Delete" onClick={() => remove(r)}><Trash2 className="w-4 h-4 text-red-600" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="lg:col-span-2 inline-flex rounded-lg border p-1 w-fit bg-muted/40">
            {([["single", "Single location"], ["multi", "Multi location"]] as const).map(([k, label]) => (
              <button key={k} type="button" onClick={() => set("mode", k)}
                className={`px-4 py-1.5 text-sm rounded-md transition-colors ${q.mode === k ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="space-y-5">
            <Card>
              <CardHeader><CardTitle className="text-base">Client / property</CardTitle><CardDescription>Used on the cover, survey and commercials pages.</CardDescription></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <Field label={multi ? "Client / group name *" : "Name (client / property) *"} className="sm:col-span-2"><Input value={q.name} onChange={(e) => set("name", e.target.value)} placeholder="Adani Corporate Park" /></Field>
                <Field label="Address"><Input value={q.address} onChange={(e) => set("address", e.target.value)} placeholder="Ahmedabad, Gujarat" /></Field>
                <Field label={multi ? "City (default for sites)" : "City (location)"}><Input value={q.city} onChange={(e) => set("city", e.target.value)} placeholder="Ahmedabad" /></Field>
                <Field label={multi ? "Survey period — from" : "Site survey date"}><Input type="date" value={q.surveyDate} onChange={(e) => set("surveyDate", e.target.value)} /></Field>
                {multi && <Field label="Survey period — to"><Input type="date" value={q.surveyDateTo} onChange={(e) => set("surveyDateTo", e.target.value)} /></Field>}
                <Field label="Proposal date"><Input type="date" value={q.proposalDate} onChange={(e) => set("proposalDate", e.target.value)} /></Field>
                <Field label="Proposal ref. no."><Input value={q.refNo} onChange={(e) => set("refNo", e.target.value)} /></Field>
                {!multi && <Field label="No. of locations"><Input type="number" min={1} value={q.locations} onChange={(e) => set("locations", Math.max(1, Number(e.target.value) || 1))} /></Field>}
                <Field label="Customer logo (optional — white background is removed automatically)" className="sm:col-span-2">
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-sm border rounded-md px-3 py-2 cursor-pointer hover:bg-muted">
                      <Upload className="w-4 h-4" /> Upload
                      <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => onLogo(e.target.files?.[0])} />
                    </label>
                    {q.customerLogo && (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={q.customerLogo} alt="" className="h-12 rounded border p-1" style={{ backgroundImage: "repeating-conic-gradient(#e5e7eb 0% 25%, #fff 0% 50%)", backgroundSize: "12px 12px" }} />
                        <Button size="sm" variant="ghost" onClick={() => set("customerLogo", "")}>Remove</Button>
                      </>
                    )}
                  </div>
                </Field>
              </CardContent>
            </Card>

            {multi ? (
              <>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div><CardTitle className="text-base">Locations ({mm.sites})</CardTitle><CardDescription>Each location: name, occupancy, smoking zones and recommended kiosks. Prices are units × rate.</CardDescription></div>
                  <Button size="sm" variant="outline" onClick={() => set("sites", [...q.sites, { ...emptySite(), city: q.city }])}><Plus className="w-4 h-4 mr-1" />Add location</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2 max-w-md">
                  <Field label="Basic rate / kiosk / yr (₹)"><Input type="number" min={0} value={q.basicRate} onChange={(e) => set("basicRate", Number(e.target.value) || 0)} /></Field>
                  <Field label="Advanced rate / kiosk / yr (₹)"><Input type="number" min={0} value={q.advanceRate} onChange={(e) => set("advanceRate", Number(e.target.value) || 0)} /></Field>
                </div>
                {q.sites.map((x, i) => (
                  <div key={i} className="rounded-lg border p-3 grid gap-3 grid-cols-2 sm:grid-cols-6 items-end">
                    <Field label={`${i + 1}. Location / property`} className="col-span-2 sm:col-span-2"><Input value={x.name} onChange={(e) => setSite(i, { name: e.target.value })} placeholder="Adani Corporate Park - Block A" /></Field>
                    <Field label="City"><Input value={x.city} onChange={(e) => setSite(i, { city: e.target.value })} /></Field>
                    <Field label="Occupancy"><Input type="number" min={0} value={x.occupancy ?? ""} onChange={(e) => setSite(i, { occupancy: e.target.value === "" ? null : Number(e.target.value) })} /></Field>
                    <Field label="Smoking zones"><Input type="number" min={0} value={x.zones ?? ""} onChange={(e) => setSite(i, { zones: e.target.value === "" ? null : Number(e.target.value) })} /></Field>
                    <div className="flex items-end gap-2">
                      <Field label="Basic"><Input type="number" min={0} value={x.basicUnits ?? ""} onChange={(e) => setSite(i, { basicUnits: e.target.value === "" ? null : Number(e.target.value) })} /></Field>
                      <Field label="Adv."><Input type="number" min={0} value={x.advanceUnits ?? ""} onChange={(e) => setSite(i, { advanceUnits: e.target.value === "" ? null : Number(e.target.value) })} /></Field>
                      <Button size="icon" variant="ghost" title="Remove" disabled={q.sites.length === 1} onClick={() => set("sites", q.sites.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4 text-red-600" /></Button>
                    </div>
                    <div className="col-span-2 sm:col-span-6 text-xs text-muted-foreground -mt-1">
                      Smokers {inr(mm.rows[i].smokers)} · Annual price ₹{inr(mm.rows[i].price)} + GST
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
              </>
            ) : (
              <>
            <Card>
              <CardHeader><CardTitle className="text-base">Kiosk type &amp; value</CardTitle><CardDescription>Units and annual service price (ex-GST) for each kiosk option.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <Field label="Kiosk type" className="max-w-xs">
                  <Select value={q.kioskType} onValueChange={(v) => set("kioskType", v as PreKiosk)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Both">Basic or Advanced (both options)</SelectItem>
                      <SelectItem value="Basic">Basic only</SelectItem>
                      <SelectItem value="Advance">Advanced only</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  {m.showBasic && (
                    <div className="rounded-lg border p-3 grid grid-cols-2 gap-3">
                      <div className="col-span-2 text-sm font-medium">Basic Kiosk</div>
                      <Field label="Recommended units"><Input {...numIn("basicUnits")} /></Field>
                      <Field label="Annual service price (₹)"><Input {...numIn("basicPrice")} /></Field>
                    </div>
                  )}
                  {m.showAdvance && (
                    <div className="rounded-lg border p-3 grid grid-cols-2 gap-3">
                      <div className="col-span-2 text-sm font-medium">Advanced Kiosk</div>
                      <Field label="Recommended units"><Input {...numIn("advanceUnits")} /></Field>
                      <Field label="Annual service price (₹)"><Input {...numIn("advancePrice")} /></Field>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Site survey</CardTitle><CardDescription>Estimated smokers default to 12% of occupancy; impact figures are calculated from them.</CardDescription></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                <Field label="Total occupancy"><Input {...numIn("occupancy")} /></Field>
                <Field label={`Estimated smokers (auto: ${m.smokers ?? "—"})`}><Input {...numIn("smokers")} placeholder="Auto" /></Field>
                <Field label="Smoking zones identified"><Input {...numIn("zones")} /></Field>
                <Field label={`Butts per year (auto: ${m.butts != null ? inr(m.butts) : "—"})`} className="sm:col-span-3 max-w-xs"><Input {...numIn("buttsPerYear")} placeholder="Auto" /></Field>
              </CardContent>
            </Card>
              </>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recommendation</CardTitle>
                <CardDescription>Shown on the Basic vs Advance comparison page, e.g. &ldquo;8 Basic Kiosks OR 4 Advance Kiosks&rdquo;. Leave blank to use the kiosk units above; 0 hides that option.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2 max-w-md">
                  <Field label="Basic kiosks"><Input {...numIn("recBasic")} placeholder={`Auto: ${autoRec.basic}`} disabled={!q.showComparison} /></Field>
                  <Field label="Advance kiosks"><Input {...numIn("recAdvance")} placeholder={`Auto: ${autoRec.advance}`} disabled={!q.showComparison} /></Field>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={q.showComparison} onCheckedChange={(v) => set("showComparison", v === true)} />
                  Include Basic vs Advance comparison page
                </label>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5">
            <Card className="lg:sticky lg:top-4">
              <CardHeader><CardTitle className="text-base">Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Ref</span><span className="font-mono">{q.refNo || "—"}</span></div>
                {multi ? (
                  <>
                    <div className="flex justify-between"><span className="text-muted-foreground">Locations</span><span>{mm.sites}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Basic ({mm.basic}) + Advanced ({mm.adv})</span><span>{mm.kiosks} kiosks</span></div>
                    <div className="flex justify-between font-medium"><span>Annual service</span><span>₹{inr(mm.price)} + GST</span></div>
                    <div className="border-t pt-2 text-xs text-muted-foreground space-y-0.5">
                      <div>Smokers {inr(mm.smokers)} · Zones {mm.zones}</div>
                      <div>Butts/yr: {inr(mm.butts)}</div>
                      <div>Waste {fmtKg(mm.wasteKg)} · Microplastics {fmtKg(mm.microKg)}</div>
                      <div>Water protected: {fmtWater(mm.waterL)}</div>
                      {mm.sites > 8 && <div>{Math.ceil(mm.sites / 8)} pages per location table (8 per page)</div>}
                    </div>
                  </>
                ) : (
                  <>
                    {m.showBasic && <div className="flex justify-between"><span className="text-muted-foreground">Basic ({q.basicUnits ?? 0} units)</span><span>₹{inr(q.basicPrice ?? 0)}</span></div>}
                    {m.showAdvance && <div className="flex justify-between"><span className="text-muted-foreground">Advanced ({q.advanceUnits ?? 0} units)</span><span>₹{inr(q.advancePrice ?? 0)}</span></div>}
                    {q.kioskType === "Both" && <p className="text-xs text-muted-foreground">Both are offered as alternatives (&ldquo;OR&rdquo;); the client picks one.</p>}
                    <div className="border-t pt-2 text-xs text-muted-foreground space-y-0.5">
                      <div>Butts/yr: {m.butts != null ? inr(m.butts) : "—"}</div>
                      <div>Waste {fmtKg(m.wasteKg)} · Microplastics {fmtKg(m.microKg)}</div>
                      <div>Water protected: {fmtWater(m.waterL)}</div>
                      {q.kioskType !== "Both" && total > 0 && <div>Annual value ₹{inr(total)} + GST</div>}
                    </div>
                  </>
                )}
                <Field label="Status">
                  <Select value={status} onValueChange={(v) => setStatus(v as PreStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PRE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <div className="grid gap-2">
                  <Button onClick={save} disabled={busy !== ""}>{busy === "save" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}{id ? "Update" : "Save"}</Button>
                  <Button variant="outline" onClick={() => generate("preview")} disabled={busy !== ""}>{busy === "preview" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}Preview PDF</Button>
                  <Button variant="outline" onClick={() => generate("download")} disabled={busy !== ""}>{busy === "download" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}Download PDF</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {previewUrl && (
            <div className="lg:col-span-2">
              <iframe src={previewUrl} title="Proposal preview" className="w-full h-[85vh] rounded-lg border" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
