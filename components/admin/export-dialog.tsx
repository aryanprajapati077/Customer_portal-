"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BadgeCheck, Check, Download, FileImage, FileText, Loader2, Pencil } from "lucide-react"
import { PlacementEditor } from "@/components/admin/placement-editor"
import {
  buildPdf,
  buildZip,
  canvasToBlob,
  renderPage,
  safeName,
  saveBlob,
  type PageSpec,
} from "@/lib/mockup-canvas"

type Format = "png" | "pdf"

const normalizeClientId = (value: string) => {
  const cleaned = value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "")
  if (!cleaned) return ""
  return cleaned.startsWith("BIS") ? cleaned : `BIS${cleaned}`
}

async function saveToHistory(blob: Blob, title: string, clientId?: string) {
  const form = new FormData()
  form.set("file", new File([blob], `${safeName(title)}.png`, { type: "image/png" }))
  form.set("title", title)
  if (clientId) form.set("clientId", clientId)
  const res = await fetch("/api/admin/presets/history", { method: "POST", body: form })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data?.success) throw new Error(data?.error || "Could not save to history")
  return data.entry as { finalUrl: string | null }
}

export function ExportDialog({
  open,
  onClose,
  title,
  pages,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  title: string
  pages: PageSpec[]
  /** Called after something was written to history so the History tab can refresh. */
  onSaved?: () => void
}) {
  const [specs, setSpecs] = useState<PageSpec[]>(pages)
  const [format, setFormat] = useState<Format>("png")
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [skipped, setSkipped] = useState<Set<string>>(new Set())
  const [progress, setProgress] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [editing, setEditing] = useState<PageSpec | null>(null)
  const [approving, setApproving] = useState(false)
  const [clientId, setClientId] = useState("")

  const makePreview = async (page: PageSpec) => {
    try {
      const canvas = await renderPage(page, 1100)
      const blob = await canvasToBlob(canvas, "image/png")
      const url = URL.createObjectURL(blob)
      setPreviews((prev) => {
        if (prev[page.id]) URL.revokeObjectURL(prev[page.id])
        return { ...prev, [page.id]: url }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build a preview")
    }
  }

  useEffect(() => {
    if (!open) return
    setSpecs(pages)
    setPreviews({})
    setSkipped(new Set())
    setError("")
    setNotice("")
    setApproving(false)
    let cancelled = false
    ;(async () => {
      for (const page of pages) {
        if (cancelled) return
        await makePreview(page)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pages])

  useEffect(
    () => () => {
      Object.values(previews).forEach((url) => URL.revokeObjectURL(url))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const chosen = specs.filter((page) => !skipped.has(page.id))
  const busy = Boolean(progress)
  const folder = normalizeClientId(clientId)

  const toggle = (id: string) =>
    setSkipped((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const download = async () => {
    if (!chosen.length) return
    setError("")
    setNotice("")
    try {
      const pdfPages: { jpeg: Uint8Array; width: number; height: number }[] = []
      const files: { name: string; data: Uint8Array }[] = []
      const used = new Set<string>()
      let historyFailed = false
      for (let i = 0; i < chosen.length; i++) {
        const page = chosen[i]
        setProgress(`Rendering 4K ${i + 1} of ${chosen.length}…`)
        const canvas = await renderPage(page, format === "pdf" ? 14000 : undefined)
        const png = await canvasToBlob(canvas, "image/png")
        if (format === "pdf") {
          const jpeg = await canvasToBlob(canvas, "image/jpeg", 0.97)
          pdfPages.push({ jpeg: new Uint8Array(await jpeg.arrayBuffer()), width: canvas.width, height: canvas.height })
        } else {
          let name = safeName(page.label)
          while (used.has(name)) name += "-2"
          used.add(name)
          files.push({ name: `${name}.png`, data: new Uint8Array(await png.arrayBuffer()) })
        }
        setProgress(`Saving to history ${i + 1} of ${chosen.length}…`)
        await saveToHistory(png, page.label).catch(() => {
          historyFailed = true
        })
        canvas.width = 0
        canvas.height = 0
      }
      setProgress("Packaging…")
      const base = safeName(title)
      if (format === "pdf") {
        saveBlob(new Blob([buildPdf(pdfPages) as BlobPart], { type: "application/pdf" }), `${base}.pdf`)
      } else if (files.length === 1) {
        saveBlob(new Blob([files[0].data as BlobPart], { type: "image/png" }), files[0].name)
      } else {
        saveBlob(new Blob([buildZip(files) as BlobPart], { type: "application/zip" }), `${base}.zip`)
      }
      onSaved?.()
      setNotice(historyFailed ? "Downloaded. Some files could not be added to history." : "Downloaded and added to History (kept 7 days).")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed")
    } finally {
      setProgress("")
    }
  }

  const approve = async () => {
    if (!folder || !chosen.length) return
    setError("")
    setNotice("")
    try {
      for (let i = 0; i < chosen.length; i++) {
        setProgress(`Uploading ${i + 1} of ${chosen.length} to ${folder}/…`)
        const canvas = await renderPage(chosen[i])
        const png = await canvasToBlob(canvas, "image/png")
        await saveToHistory(png, chosen[i].label, folder)
        canvas.width = 0
        canvas.height = 0
      }
      onSaved?.()
      setApproving(false)
      setNotice(`Approved. ${chosen.length} design${chosen.length === 1 ? "" : "s"} uploaded to Cloudflare R2 folder ${folder}/`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setProgress("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !busy && onClose()}>
      <DialogContent className="flex h-[94vh] w-[97vw] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
        <DialogHeader className="border-b border-[#ebe9e4] px-5 py-3">
          <DialogTitle className="text-base">Preview, edit &amp; download</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-3 border-b border-[#ebe9e4] bg-white px-5 py-3">
          <div className="inline-flex rounded-full border border-[#ebe9e4] p-0.5">
            {(
              [
                ["png", FileImage, "Images (PNG)"],
                ["pdf", FileText, "PDF"],
              ] as const
            ).map(([value, Icon, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFormat(value)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium ${format === value ? "bg-[#1B7339] text-white" : "text-[#5A5A5A]"}`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
          <span className="text-sm text-[#5A5A5A]">
            {chosen.length} of {specs.length} selected · 4K · {format === "pdf" ? "one PDF, one page each" : chosen.length > 1 ? "zip of PNGs" : "single PNG"}
          </span>
          <div className="ml-auto flex gap-3 text-[13px] font-medium text-[#1B7339]">
            <button type="button" onClick={() => setSkipped(new Set())}>
              Select all
            </button>
            <button type="button" onClick={() => setSkipped(new Set(specs.map((p) => p.id)))}>
              Select none
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#f6f5f2] p-5">
          {error ? <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
          {notice ? <div className="mb-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">{notice}</div> : null}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {specs.map((page, index) => {
              const on = !skipped.has(page.id)
              return (
                <div key={page.id} className={`overflow-hidden rounded-xl border-2 bg-white transition ${on ? "border-[#1B7339]" : "border-transparent opacity-50"}`}>
                  <button type="button" onClick={() => toggle(page.id)} className="relative flex min-h-[160px] w-full items-center justify-center bg-[#1c1c1e]">
                    {previews[page.id] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previews[page.id]} alt="" className="block max-h-[46vh] w-full object-contain" />
                    ) : (
                      <Loader2 className="h-5 w-5 animate-spin text-white/70" />
                    )}
                    <span className={`absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-md border ${on ? "border-[#1B7339] bg-[#1B7339] text-white" : "border-white/70 bg-black/30"}`}>
                      {on ? <Check className="h-4 w-4" /> : null}
                    </span>
                  </button>
                  <div className="flex items-center justify-between gap-2 px-3 py-2">
                    <p className="truncate text-[13px] font-medium">
                      {format === "pdf" ? `Page ${index + 1} · ` : ""}
                      {page.label}
                    </p>
                    <Button size="sm" variant="outline" className="h-7 shrink-0 rounded-full px-3 text-[12px]" onClick={() => setEditing(page)}>
                      <Pencil className="mr-1 h-3 w-3" /> Edit
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {approving ? (
          <div className="flex flex-wrap items-center gap-3 border-t border-[#ebe9e4] bg-[#F4FBF5] px-5 py-3">
            <BadgeCheck className="h-5 w-5 text-[#1B7339]" />
            <span className="text-sm font-medium">Client ID</span>
            <Input autoFocus value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="e.g. BIS1234" className="h-9 w-48 bg-white" />
            <span className="text-[13px] text-[#5A5A5A]">{folder ? `Uploads ${chosen.length} 4K PNG${chosen.length === 1 ? "" : "s"} to R2 folder ${folder}/` : "Enter the client ID to continue"}</span>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" disabled={busy} onClick={() => setApproving(false)}>
                Cancel
              </Button>
              <Button className="bg-[#1B7339] hover:bg-[#145a2c]" disabled={busy || !folder || !chosen.length} onClick={approve}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BadgeCheck className="mr-2 h-4 w-4" />}
                Approve &amp; upload
              </Button>
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3 border-t border-[#ebe9e4] bg-white px-5 py-3">
          <span className="text-sm text-[#6B6B6B]">{progress || "Every export is rendered in 4K (3840px or the original size, whichever is larger)."}</span>
          <div className="flex gap-2">
            <Button variant="outline" disabled={busy} onClick={onClose}>
              Close
            </Button>
            <Button variant="outline" className="border-[#1B7339] text-[#1B7339]" disabled={busy || !chosen.length} onClick={() => setApproving(true)}>
              <BadgeCheck className="mr-2 h-4 w-4" /> Approve
            </Button>
            <Button className="bg-[#1B7339] hover:bg-[#145a2c]" disabled={busy || !chosen.length} onClick={download}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Download {format === "pdf" ? "PDF" : chosen.length > 1 ? "zip" : "PNG"}
            </Button>
          </div>
        </div>
      </DialogContent>

      <PlacementEditor
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={`Edit — ${editing?.label || ""}`}
        baseUrl={editing?.baseUrl || ""}
        layers={editing?.layers.map((l) => ({ ...l, locked: false, previewSrc: l.previewSrc || (l.child ? l.child.baseUrl : undefined) })) || []}
        allowExtra
        saveLabel="Apply to this page"
        onSave={(layers) => {
          if (!editing) return
          const next = { ...editing, layers: layers.map((l) => ({ ...l, previewSrc: undefined })) }
          // Keep the nested preset (mockup child) attached to its layer after editing.
          next.layers = next.layers.map((l) => ({ ...l, child: editing.layers.find((o) => o.id === l.id)?.child }))
          setSpecs((prev) => prev.map((p) => (p.id === editing.id ? next : p)))
          void makePreview(next)
          setEditing(null)
        }}
      />
    </Dialog>
  )
}
