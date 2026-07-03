"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PRODUCT_CATEGORIES, formatInr } from "@/lib/kraftreborn-products"
import { Loader2, Plus, Pencil, Trash2, ShoppingBag, Upload, Search } from "lucide-react"

type ProductRow = {
  id: string
  name: string
  description: string
  price: number
  category: string
  tagline: string | null
  buttsRescued: number
  imageUrl: string | null
  imageGradient: string
  allowsLogo: boolean
  active: boolean
  sortOrder: number
}

const EMPTY_FORM = {
  id: "",
  name: "",
  description: "",
  price: "",
  category: "elegant-combos",
  tagline: "",
  buttsRescued: "40",
  imageGradient: "from-amber-100 via-stone-200 to-emerald-100",
  allowsLogo: false,
  active: true,
  sortOrder: "0",
}

export default function AdminProductsPage() {
  const [rows, setRows] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/products")
      const data = await res.json()
      if (data?.success) setRows(data.products || [])
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
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(s) ||
        r.description.toLowerCase().includes(s) ||
        r.category.toLowerCase().includes(s),
    )
  }, [rows, q])

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setImageFile(null)
    setDialogOpen(true)
  }

  const openEdit = (p: ProductRow) => {
    setForm({
      id: p.id,
      name: p.name,
      description: p.description,
      price: String(p.price),
      category: p.category,
      tagline: p.tagline || "",
      buttsRescued: String(p.buttsRescued),
      imageGradient: p.imageGradient,
      allowsLogo: p.allowsLogo,
      active: p.active,
      sortOrder: String(p.sortOrder),
    })
    setImageFile(null)
    setDialogOpen(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const fd = new FormData()
      if (form.id) fd.set("id", form.id)
      fd.set("name", form.name)
      fd.set("description", form.description)
      fd.set("price", form.price)
      fd.set("category", form.category)
      fd.set("tagline", form.tagline)
      fd.set("buttsRescued", form.buttsRescued)
      fd.set("imageGradient", form.imageGradient)
      fd.set("allowsLogo", String(form.allowsLogo))
      fd.set("active", String(form.active))
      fd.set("sortOrder", form.sortOrder)
      if (imageFile) fd.set("image", imageFile)

      const res = await fetch("/api/admin/products", {
        method: form.id ? "PUT" : "POST",
        body: fd,
      })
      const data = await res.json()
      if (data?.success) {
        setDialogOpen(false)
        await load()
      }
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm("Delete this product?")) return
    await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" })
    await load()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary" />
            Shop Products
          </h1>
          <p className="text-sm text-muted-foreground">Manage Kraft Reborn catalog — images, prices, logo options</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add product
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..." className="pl-9" />
      </div>

      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Product catalog</CardTitle>
          <CardDescription>{filtered.length} products</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((p) => (
                <div key={p.id} className="rounded-2xl border border-border/50 overflow-hidden bg-muted/20">
                  <div className="aspect-video relative bg-muted">
                    {p.imageUrl ? (
                      <Image src={p.imageUrl} alt={p.name} fill className="object-cover" sizes="300px" />
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${p.imageGradient} flex items-center justify-center p-4`}>
                        <p className="font-serif text-sm text-center font-medium">{p.name}</p>
                      </div>
                    )}
                    {!p.active && (
                      <Badge className="absolute top-2 left-2 bg-red-500">Inactive</Badge>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm line-clamp-1">{p.name}</h3>
                      <span className="font-bold text-sm shrink-0">{formatInr(p.price)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[10px]">{p.category}</Badge>
                      {p.allowsLogo && <Badge variant="outline" className="text-[10px]">Logo</Badge>}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(p)}>
                        <Pencil className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(p.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit product" : "Add product"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Price (₹)</Label>
                <Input value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} inputMode="decimal" />
              </div>
              <div className="space-y-2">
                <Label>Butts rescued</Label>
                <Input value={form.buttsRescued} onChange={(e) => setForm((f) => ({ ...f, buttsRescued: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tagline</Label>
              <Input value={form.tagline} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Image gradient (fallback if no image)</Label>
              <Input value={form.imageGradient} onChange={(e) => setForm((f) => ({ ...f, imageGradient: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Product image</Label>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                {imageFile ? imageFile.name : "Upload image"}
              </Button>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={form.allowsLogo} onCheckedChange={(v) => setForm((f) => ({ ...f, allowsLogo: Boolean(v) }))} />
                Allows custom logo
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={form.active} onCheckedChange={(v) => setForm((f) => ({ ...f, active: Boolean(v) }))} />
                Active in shop
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving || !form.name}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
