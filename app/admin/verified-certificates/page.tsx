"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Award, Loader2, Plus, Pencil, Trash2 } from "lucide-react"

type Cert = {
  id: string
  title: string
  issuer: string
  validUntil: string
  type: string
  icon: string
  pdfUrl: string | null
  sortOrder: number
  active: boolean
}

const EMPTY = { id: "", title: "", issuer: "", validUntil: "", type: "", icon: "shield", pdfUrl: "", sortOrder: "0", active: true }

export default function AdminVerifiedCertificatesPage() {
  const [rows, setRows] = useState<Cert[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetch("/api/admin/verified-certificates")
    const data = await res.json()
    if (data?.success) setRows(data.certificates || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    const payload = {
      ...form,
      sortOrder: Number(form.sortOrder),
      pdfUrl: form.pdfUrl || null,
    }
    await fetch("/api/admin/verified-certificates", {
      method: form.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    setOpen(false)
    setForm(EMPTY)
    await load()
    setSaving(false)
  }

  const remove = async (id: string) => {
    if (!confirm("Delete?")) return
    await fetch(`/api/admin/verified-certificates?id=${id}`, { method: "DELETE" })
    await load()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Award className="w-6 h-6 text-primary" />Verified Certificates</h1>
          <p className="text-sm text-muted-foreground">Manage public homepage certificates (Reports section)</p>
        </div>
        <Button onClick={() => { setForm(EMPTY); setOpen(true) }}><Plus className="w-4 h-4 mr-2" />Add</Button>
      </div>

      <Card className="glass border-border/50">
        <CardHeader><CardTitle className="text-base">{rows.length} certificates</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {loading ? <Loader2 className="animate-spin mx-auto" /> : rows.map((c) => (
            <div key={c.id} className="p-4 rounded-xl border border-border/50 flex justify-between gap-4">
              <div>
                <p className="font-semibold">{c.title}</p>
                <p className="text-xs text-muted-foreground">{c.issuer} · Valid until {c.validUntil}</p>
                {c.pdfUrl && <p className="text-xs text-primary mt-1">{c.pdfUrl}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => { setForm({ ...c, pdfUrl: c.pdfUrl || "", sortOrder: String(c.sortOrder) }); setOpen(true) }}><Pencil className="w-3 h-3" /></Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(c.id)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form.id ? "Edit" : "Add"} certificate</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Issuer</Label><Input value={form.issuer} onChange={(e) => setForm({ ...form, issuer: e.target.value })} /></div>
            <div><Label>Valid until</Label><Input value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} /></div>
            <div><Label>Type</Label><Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} /></div>
            <div><Label>PDF URL (optional)</Label><Input value={form.pdfUrl} onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })} placeholder="/uploads/... or https://..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
