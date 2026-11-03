"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BadgeCheck, Download, Eye, ImagePlus, Layers, Loader2, Pencil, Trash2 } from "lucide-react"
import { PlacementEditor } from "@/components/admin/placement-editor"
import { ExportDialog } from "@/components/admin/export-dialog"
import type { Layer, PageSpec } from "@/lib/mockup-canvas"

type Template = {
  id: string
  name: string
  imageUrl: string
  slotX: number
  slotY: number
  slotW: number
  slotH: number
  kind: "preset" | "mockup" | "layered"
  defaultChildIds: string[]
}

type Logo = { id: string; name: string; imageUrl: string }

type Background = { id: string; name: string; url: string }

type HistoryEntry = {
  id: string
  title: string
  imageUrl: string
  thumbUrl: string
  status: "draft" | "approved"
  clientId: string | null
  finalUrl: string | null
  createdAt: string
  expiresAt: string
}

type Tab = "presets" | "mockups" | "displays" | "overlay" | "history"

const MAX_PAGES = 80

const CHECKER =
  "bg-[linear-gradient(45deg,#eee_25%,transparent_25%),linear-gradient(-45deg,#eee_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#eee_75%),linear-gradient(-45deg,transparent_75%,#eee_75%)] bg-[length:12px_12px] bg-[position:0_0,0_6px,6px_-6px,-6px_0]"

function slotLayer(template: Template, label: string, src?: string, previewSrc?: string): Layer {
  const mockup = template.kind === "mockup"
  return {
    // Mockups stretch the preset to the box so it matches the sign exactly; displays paint white under the logo to hide the old one.
    fit: mockup ? "fill" : "contain",
    fill: template.kind === "layered" ? "#ffffff" : undefined,
    id: "slot",
    label,
    kind: "image",
    src,
    previewSrc,
    opacity: 1,
    x: Number(template.slotX),
    y: Number(template.slotY),
    w: Number(template.slotW),
    h: Number(template.slotH),
  }
}

function Card({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[14px] border border-[#ebe9e4] bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-[#ebe9e4] px-4 py-2.5">
        <h2 className="text-[13px] font-semibold text-[#141414]">{title}</h2>
        {action}
      </div>
      <div className="max-h-[360px] overflow-auto">{children}</div>
    </section>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-[#6B6B6B]">{text}</p>
}

const th = "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#6B6B6B]"
const td = "px-3 py-2 align-middle"

export default function AdminPresetsPage() {
  const [tab, setTab] = useState<Tab>("presets")
  const [presets, setPresets] = useState<Template[]>([])
  const [mockups, setMockups] = useState<Template[]>([])
  const [displays, setDisplays] = useState<Template[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [approveId, setApproveId] = useState("")
  const [approveClient, setApproveClient] = useState("")
  const [logos, setLogos] = useState<Logo[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState("")
  const [error, setError] = useState("")

  const [pickedPresets, setPickedPresets] = useState<string[]>([])
  const [pickedMockups, setPickedMockups] = useState<string[]>([])
  const [pickedDisplays, setPickedDisplays] = useState<string[]>([])
  const [pickedLogos, setPickedLogos] = useState<string[]>([])

  const [backgrounds, setBackgrounds] = useState<Background[]>([])
  const [overlayLayers, setOverlayLayers] = useState<Layer[]>([
    { id: "ov1", kind: "text", label: "Text", text: "Your text", color: "#ffffff", bold: true, opacity: 0.5, x: 0.25, y: 0.44, w: 0.5, h: 0.12 },
  ])

  const [editor, setEditor] = useState<{ mode: "preset" | "mockup" | "layered" | "overlay"; target?: Template } | null>(null)
  const [editorName, setEditorName] = useState("")
  const [editorDefaults, setEditorDefaults] = useState<string[]>([])
  const [exportPages, setExportPages] = useState<PageSpec[] | null>(null)

  const presetInput = useRef<HTMLInputElement>(null)
  const mockupInput = useRef<HTMLInputElement>(null)
  const displayInput = useRef<HTMLInputElement>(null)
  const logoInput = useRef<HTMLInputElement>(null)
  const backgroundInput = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [presetRes, mockupRes, displayRes, logoRes] = await Promise.all([
        fetch("/api/admin/presets?kind=preset"),
        fetch("/api/admin/presets?kind=mockup"),
        fetch("/api/admin/presets?kind=layered"),
        fetch("/api/admin/presets/logos"),
      ])
      const [presetData, mockupData, displayData, logoData] = await Promise.all([
        presetRes.json(),
        mockupRes.json(),
        displayRes.json(),
        logoRes.json(),
      ])
      if (!displayData?.success) throw new Error(displayData?.error || "Could not load displays")
      setDisplays(displayData.presets || [])
      if (!presetData?.success) throw new Error(presetData?.error || "Could not load presets")
      if (!mockupData?.success) throw new Error(mockupData?.error || "Could not load mockups")
      if (!logoData?.success) throw new Error(logoData?.error || "Could not load logos")
      setPresets(presetData.presets || [])
      setMockups(mockupData.presets || [])
      setLogos(logoData.logos || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load")
    } finally {
      setLoading(false)
    }
  }, [])

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/presets/history")
      const data = await res.json()
      if (!data?.success) throw new Error(data?.error || "Could not load history")
      setHistory(data.history || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load history")
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (tab === "history") void loadHistory()
  }, [tab, loadHistory])

  const approveEntry = async (id: string) => {
    setBusy(`approve-${id}`)
    setError("")
    try {
      const res = await fetch("/api/admin/presets/history", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, clientId: approveClient }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.error || "Could not approve")
      setHistory((prev) => prev.map((e) => (e.id === id ? data.entry : e)))
      setApproveId("")
      setApproveClient("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not approve")
    } finally {
      setBusy("")
    }
  }

  const removeEntry = async (id: string) => {
    if (!confirm("Remove this from history?")) return
    await fetch(`/api/admin/presets/history?id=${encodeURIComponent(id)}`, { method: "DELETE" })
    setHistory((prev) => prev.filter((e) => e.id !== id))
  }

  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, id: string) =>
    setter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const union = (prev: string[], add: string[]) => [...prev, ...add.filter((id) => !prev.includes(id))]

  /** Ticking a preset also ticks the logos that were set as its defaults. */
  const pickPreset = (preset: Template) => {
    const on = !pickedPresets.includes(preset.id)
    setPickedPresets((prev) => (on ? [...prev, preset.id] : prev.filter((id) => id !== preset.id)))
    if (on) setPickedLogos((prev) => union(prev, preset.defaultChildIds.filter((id) => logos.some((l) => l.id === id))))
  }

  /** Ticking a mockup also ticks its default presets (and those presets' default logos). */
  const pickMockup = (mockup: Template) => {
    const on = !pickedMockups.includes(mockup.id)
    setPickedMockups((prev) => (on ? [...prev, mockup.id] : prev.filter((id) => id !== mockup.id)))
    if (!on) return
    const children = presets.filter((p) => mockup.defaultChildIds.includes(p.id))
    setPickedPresets((prev) => union(prev, children.map((p) => p.id)))
    setPickedLogos((prev) => union(prev, children.flatMap((p) => p.defaultChildIds).filter((id) => logos.some((l) => l.id === id))))
  }

  const uploadTemplate = async (file: File, kind: "preset" | "mockup" | "layered") => {
    setBusy(kind)
    setError("")
    try {
      const form = new FormData()
      form.set("file", file)
      form.set("kind", kind)
      form.set("name", file.name.replace(/\.[^.]+$/, ""))
      const res = await fetch("/api/admin/presets", { method: "POST", body: form })
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.error || "Upload failed")
      const created = data.preset as Template
      if (kind === "mockup") setMockups((prev) => [created, ...prev])
      else if (kind === "layered") setDisplays((prev) => [created, ...prev])
      else setPresets((prev) => [created, ...prev])
      openEditor(created)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setBusy("")
    }
  }

  const pickDisplay = (display: Template) => {
    const on = !pickedDisplays.includes(display.id)
    setPickedDisplays((prev) => (on ? [...prev, display.id] : prev.filter((id) => id !== display.id)))
    if (on) setPickedLogos((prev) => union(prev, display.defaultChildIds.filter((id) => logos.some((l) => l.id === id))))
  }

  const uploadLogos = async (files: File[]) => {
    setBusy("logos")
    setError("")
    try {
      const created: Logo[] = []
      for (const file of files) {
        const form = new FormData()
        form.append("files", file)
        const res = await fetch("/api/admin/presets/logos", { method: "POST", body: form })
        const data = await res.json()
        if (!res.ok || !data?.success) throw new Error(data?.error || "Upload failed")
        created.push(...(data.logos || []))
      }
      setLogos((prev) => [...created, ...prev])
      setPickedLogos((prev) => union(prev, created.map((logo) => logo.id)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setBusy("")
    }
  }

  const removeTemplate = async (template: Template) => {
    if (!confirm(`Delete "${template.name}"?`)) return
    await fetch(`/api/admin/presets?id=${encodeURIComponent(template.id)}`, { method: "DELETE" })
    if (template.kind === "mockup") {
      setMockups((prev) => prev.filter((t) => t.id !== template.id))
      setPickedMockups((prev) => prev.filter((id) => id !== template.id))
    } else if (template.kind === "layered") {
      setDisplays((prev) => prev.filter((t) => t.id !== template.id))
      setPickedDisplays((prev) => prev.filter((id) => id !== template.id))
    } else {
      setPresets((prev) => prev.filter((t) => t.id !== template.id))
      setPickedPresets((prev) => prev.filter((id) => id !== template.id))
    }
  }

  const removeLogo = async (id: string) => {
    if (!confirm("Delete this logo?")) return
    await fetch(`/api/admin/presets/logos?id=${encodeURIComponent(id)}`, { method: "DELETE" })
    setLogos((prev) => prev.filter((item) => item.id !== id))
    setPickedLogos((prev) => prev.filter((item) => item !== id))
  }

  const openEditor = (template: Template) => {
    setEditor({ mode: template.kind, target: template })
    setEditorName(template.name)
    setEditorDefaults(template.defaultChildIds || [])
  }

  const saveTemplate = async (layers: Layer[]) => {
    const target = editor?.target
    const slot = layers.find((l) => l.id === "slot")
    if (!target || !slot) return
    setBusy("save")
    setError("")
    try {
      const res = await fetch("/api/admin/presets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: target.id,
          name: editorName,
          slotX: slot.x,
          slotY: slot.y,
          slotW: slot.w,
          slotH: slot.h,
          defaultChildIds: editorDefaults,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.error || "Could not save placement")
      const saved = data.preset as Template
      const apply = (list: Template[]) => list.map((item) => (item.id === saved.id ? saved : item))
      if (saved.kind === "mockup") setMockups(apply)
      else if (saved.kind === "layered") setDisplays(apply)
      else setPresets(apply)
      setEditor(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save placement")
    } finally {
      setBusy("")
    }
  }

  const addBackgrounds = (files: File[]) => {
    const added = files.map((file, i) => ({
      id: `bg${Date.now().toString(36)}${i}`,
      name: file.name.replace(/\.[^.]+$/, ""),
      url: URL.createObjectURL(file),
    }))
    setBackgrounds((prev) => [...prev, ...added])
  }

  const presetSpec = (preset: Template, logo?: Logo): PageSpec => ({
    id: `${preset.id}:${logo?.id || "none"}`,
    label: logo ? `${preset.name} - ${logo.name}` : preset.name,
    baseUrl: preset.imageUrl,
    layers: logo ? [slotLayer(preset, logo.name, logo.imageUrl)] : [],
  })

  const chosenLogos = logos.filter((l) => pickedLogos.includes(l.id))
  const chosenPresets = presets.filter((p) => pickedPresets.includes(p.id))
  const chosenMockups = mockups.filter((m) => pickedMockups.includes(m.id))
  const chosenDisplays = displays.filter((d) => pickedDisplays.includes(d.id))

  const buildPages = (): PageSpec[] => {
    if (tab === "presets") {
      return chosenPresets.flatMap((preset) => chosenLogos.map((logo) => presetSpec(preset, logo)))
    }
    if (tab === "mockups") {
      return chosenMockups.flatMap((mockup) =>
        chosenPresets.flatMap((preset) =>
          (chosenLogos.length ? chosenLogos : [undefined]).map((logo) => {
            const child = presetSpec(preset, logo)
            return {
              id: `${mockup.id}:${child.id}`,
              label: `${mockup.name} - ${child.label}`,
              baseUrl: mockup.imageUrl,
              layers: [{ ...slotLayer(mockup, preset.name), child, opacity: 1 }],
            }
          }),
        ),
      )
    }
    if (tab === "displays") {
      return chosenDisplays.flatMap((display) =>
        backgrounds.flatMap((bg) =>
          (chosenLogos.length ? chosenLogos : [undefined]).map((logo) => ({
            id: `${display.id}:${bg.id}:${logo?.id || "none"}`,
            label: `${display.name} - ${bg.name}${logo ? ` - ${logo.name}` : ""}`,
            baseUrl: display.imageUrl,
            layers: [
              { id: "bg", label: "Location photo", kind: "image" as const, src: bg.url, behind: true, fit: "cover" as const, opacity: 1, x: 0, y: 0, w: 1, h: 1 },
              ...(logo ? [slotLayer(display, logo.name, logo.imageUrl)] : []),
            ],
          })),
        ),
      )
    }
    return backgrounds.map((bg) => ({ id: bg.id, label: bg.name, baseUrl: bg.url, layers: overlayLayers }))
  }

  const pageCount =
    tab === "presets"
      ? chosenPresets.length * chosenLogos.length
      : tab === "mockups"
        ? chosenMockups.length * chosenPresets.length * Math.max(1, chosenLogos.length)
        : tab === "displays"
          ? chosenDisplays.length * backgrounds.length * Math.max(1, chosenLogos.length)
          : backgrounds.length

  const openPreview = () => {
    if (pageCount > MAX_PAGES) {
      setError(`That is ${pageCount} pages — keep it to ${MAX_PAGES} or fewer at a time.`)
      return
    }
    setError("")
    setExportPages(buildPages())
  }

  const summary =
    tab === "presets"
      ? `${chosenPresets.length} preset${chosenPresets.length === 1 ? "" : "s"} × ${chosenLogos.length} logo${chosenLogos.length === 1 ? "" : "s"}`
      : tab === "displays"
        ? `${chosenDisplays.length} display${chosenDisplays.length === 1 ? "" : "s"} × ${backgrounds.length} location photo${backgrounds.length === 1 ? "" : "s"} × ${Math.max(1, chosenLogos.length)} logo${chosenLogos.length === 1 ? "" : "s"}`
        : tab === "mockups"
        ? `${chosenMockups.length} mockup${chosenMockups.length === 1 ? "" : "s"} × ${chosenPresets.length} preset${chosenPresets.length === 1 ? "" : "s"} × ${Math.max(1, chosenLogos.length)} logo${chosenLogos.length === 1 ? "" : "s"}`
        : `${backgrounds.length} background${backgrounds.length === 1 ? "" : "s"} × ${overlayLayers.length} layer${overlayLayers.length === 1 ? "" : "s"}`

  // Editor wiring ------------------------------------------------------------
  const editorChildren =
    editor?.mode === "mockup"
      ? presets.map((p) => ({ id: p.id, name: p.name, url: p.imageUrl }))
      : logos.map((l) => ({ id: l.id, name: l.name, url: l.imageUrl }))

  const editorLayers: Layer[] = (() => {
    if (!editor) return []
    if (editor.mode === "overlay") return overlayLayers
    const target = editor.target!
    if (editor.mode === "mockup") {
      const sample = presets.find((p) => editorDefaults.includes(p.id)) || presets[0]
      return [slotLayer(target, "Preset", undefined, sample?.imageUrl)]
    }
    const sample = logos.find((l) => editorDefaults.includes(l.id)) || chosenLogos[0] || logos[0]
    if (editor.mode === "layered") {
      const photo = backgrounds[0]
      return [
        ...(photo
          ? [{ id: "bg", label: "Location photo", kind: "image" as const, src: photo.url, behind: true, fit: "cover" as const, locked: true, opacity: 1, x: 0, y: 0, w: 1, h: 1 }]
          : []),
        slotLayer(target, "Logo", sample?.imageUrl),
      ]
    }
    return [slotLayer(target, "Logo", sample?.imageUrl)]
  })()

  const editorBase = editor?.mode === "overlay" ? backgrounds[0]?.url || "" : editor?.target?.imageUrl || ""

  const tabButton = (value: Tab, label: string) => (
    <button
      key={value}
      type="button"
      onClick={() => setTab(value)}
      className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === value ? "bg-[#1B7339] text-white" : "text-[#5A5A5A] hover:bg-[#f0efe9]"}`}
    >
      {label}
    </button>
  )

  const addButton = (label: string, onClick: () => void, working: boolean, primary = false) => (
    <Button
      variant={primary ? "default" : "outline"}
      className={`rounded-full ${primary ? "bg-[#1B7339] hover:bg-[#145a2c]" : ""}`}
      disabled={working}
      onClick={onClick}
    >
      {working ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
      {label}
    </Button>
  )

  const templateTable = (
    list: Template[],
    picked: string[],
    onPick: (t: Template) => void,
    childName: (id: string) => string | undefined,
    emptyText: string,
  ) =>
    list.length === 0 ? (
      <Empty text={emptyText} />
    ) : (
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-[#faf9f6]">
          <tr>
            <th className={`${th} w-10`} />
            <th className={th}>Preview</th>
            <th className={th}>Name</th>
            <th className={th}>Selected by default</th>
            <th className={`${th} text-right`}>Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f1efe9]">
          {list.map((t) => {
            const defaults = t.defaultChildIds.map(childName).filter(Boolean) as string[]
            return (
              <tr key={t.id} className={picked.includes(t.id) ? "bg-[#F4FBF5]" : ""}>
                <td className={td}>
                  <input type="checkbox" checked={picked.includes(t.id)} onChange={() => onPick(t)} className="h-4 w-4 accent-[#1B7339]" />
                </td>
                <td className={td}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.imageUrl} alt="" className="h-12 w-16 rounded-md border border-[#ebe9e4] object-cover" />
                </td>
                <td className={`${td} font-medium`}>{t.name}</td>
                <td className={`${td} text-[12px] text-[#5A5A5A]`}>
                  {defaults.length ? defaults.slice(0, 3).join(", ") + (defaults.length > 3 ? ` +${defaults.length - 3}` : "") : "—"}
                </td>
                <td className={`${td} text-right`}>
                  <Button size="sm" variant="outline" className="h-8 rounded-full" onClick={() => openEditor(t)}>
                    <Pencil className="mr-1.5 h-3.5 w-3.5" /> Place
                  </Button>
                  <Button size="sm" variant="ghost" className="ml-1 h-8 w-8 text-[#c62828]" onClick={() => removeTemplate(t)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )

  const presetsCard = (title: string) => (
    <Card title={title}>
      {templateTable(
        presets,
        pickedPresets,
        pickPreset,
        (id) => logos.find((l) => l.id === id)?.name,
        "No presets yet.",
      )}
    </Card>
  )

  const backgroundsCard = (title: string) => (
    <Card title={`${title} (${backgrounds.length})`}>
      {backgrounds.length === 0 ? (
        <Empty text="Add the images that change — everything else stays the same." />
      ) : (
        <table className="w-full text-sm">
          <tbody className="divide-y divide-[#f1efe9]">
            {backgrounds.map((bg) => (
              <tr key={bg.id}>
                <td className={`${td} w-20`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bg.url} alt="" className="h-12 w-16 rounded-md border border-[#ebe9e4] object-cover" />
                </td>
                <td className={`${td} font-medium`}>{bg.name}</td>
                <td className={`${td} text-right`}>
                  <Button size="sm" variant="ghost" className="h-8 w-8 text-[#c62828]" onClick={() => setBackgrounds((prev) => prev.filter((b) => b.id !== bg.id))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  )

  const logosCard = (
    <Card
      title={`Logos (${pickedLogos.length}/${logos.length})`}
      action={
        logos.length ? (
          <button
            type="button"
            className="text-[12px] font-medium text-[#1B7339]"
            onClick={() => setPickedLogos((prev) => (prev.length === logos.length ? [] : logos.map((l) => l.id)))}
          >
            {pickedLogos.length === logos.length ? "Clear" : "Select all"}
          </button>
        ) : null
      }
    >
      {logos.length === 0 ? (
        <Empty text="No logos yet." />
      ) : (
        <table className="w-full text-sm">
          <tbody className="divide-y divide-[#f1efe9]">
            {logos.map((logo) => (
              <tr key={logo.id} className={pickedLogos.includes(logo.id) ? "bg-[#F4FBF5]" : ""}>
                <td className={`${td} w-10`}>
                  <input type="checkbox" checked={pickedLogos.includes(logo.id)} onChange={() => toggle(setPickedLogos, logo.id)} className="h-4 w-4 accent-[#1B7339]" />
                </td>
                <td className={`${td} w-20`}>
                  <div className={`flex h-12 w-16 items-center justify-center rounded-md border border-[#ebe9e4] ${CHECKER}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logo.imageUrl} alt="" className="max-h-10 max-w-[56px] object-contain" />
                  </div>
                </td>
                <td className={`${td} font-medium`}>{logo.name}</td>
                <td className={`${td} text-right`}>
                  <Button size="sm" variant="ghost" className="h-8 w-8 text-[#c62828]" onClick={() => removeLogo(logo.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-[#ebe9e4] bg-white p-1">
          {tabButton("presets", "Presets")}
          {tabButton("mockups", "Mockups")}
          {tabButton("displays", "Displays")}
          {tabButton("overlay", "Overlay")}
          {tabButton("history", "History")}
        </div>
        <div className="flex flex-wrap gap-2">
          {tab === "presets" ? addButton("Add preset", () => presetInput.current?.click(), busy === "preset", true) : null}
          {tab === "mockups" ? addButton("Add mockup", () => mockupInput.current?.click(), busy === "mockup", true) : null}
          {tab === "displays" ? addButton("Add display (transparent PNG)", () => displayInput.current?.click(), busy === "layered", true) : null}
          {tab === "displays" ? addButton("Add location photos", () => backgroundInput.current?.click(), false) : null}
          {tab === "overlay" ? addButton("Add backgrounds", () => backgroundInput.current?.click(), false, true) : null}
          {tab !== "overlay" && tab !== "history" ? addButton("Add logos", () => logoInput.current?.click(), busy === "logos") : null}
        </div>
      </div>

      <input ref={presetInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void uploadTemplate(f, "preset") }} />
      <input ref={mockupInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void uploadTemplate(f, "mockup") }} />
      <input ref={displayInput} type="file" accept="image/png,image/webp" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void uploadTemplate(f, "layered") }} />
      <input ref={logoInput} type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden"
        onChange={(e) => { const f = [...(e.target.files || [])]; e.target.value = ""; if (f.length) void uploadLogos(f) }} />
      <input ref={backgroundInput} type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden"
        onChange={(e) => { const f = [...(e.target.files || [])]; e.target.value = ""; if (f.length) addBackgrounds(f) }} />

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      {loading ? (
        <div className="py-16 text-center text-[#6B6B6B]">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        </div>
      ) : tab === "presets" ? (
        <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          {presetsCard(`Presets (${pickedPresets.length}/${presets.length})`)}
          {logosCard}
        </div>
      ) : tab === "history" ? (
        history.length === 0 ? (
          <div className="rounded-[14px] border border-[#ebe9e4] bg-white py-16 text-center text-sm text-[#6B6B6B]">
            Nothing yet. Designs you download appear here for 7 days.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
            {history.map((entry) => {
              const days = Math.max(0, Math.ceil((new Date(entry.expiresAt).getTime() - Date.now()) / 86400000))
              return (
                <div key={entry.id} className="overflow-hidden rounded-[14px] border border-[#ebe9e4] bg-white">
                  <div className={`relative flex h-44 items-center justify-center bg-[#1c1c1e]`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={entry.thumbUrl} alt="" loading="lazy" className="h-full w-full object-contain" />
                    <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold ${entry.status === "approved" ? "bg-[#1B7339] text-white" : "bg-white/90 text-[#5A5A5A]"}`}>
                      {entry.status === "approved" ? `Approved · ${entry.clientId}` : "Draft"}
                    </span>
                  </div>
                  <div className="space-y-2 p-3">
                    <p className="truncate text-sm font-medium" title={entry.title}>{entry.title}</p>
                    <p className="text-[12px] text-[#6B6B6B]">
                      {new Date(entry.createdAt).toLocaleString()} · expires in {days} day{days === 1 ? "" : "s"}
                    </p>
                    {approveId === entry.id ? (
                      <div className="flex gap-1.5">
                        <Input autoFocus value={approveClient} onChange={(e) => setApproveClient(e.target.value)} placeholder="Client ID e.g. BIS1234" className="h-8 text-[12px]" />
                        <Button size="sm" className="h-8 bg-[#1B7339] hover:bg-[#145a2c]" disabled={busy === `approve-${entry.id}` || !approveClient.trim()} onClick={() => approveEntry(entry.id)}>
                          {busy === `approve-${entry.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : "OK"}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-1.5">
                        <Button asChild size="sm" variant="outline" className="h-8 flex-1 rounded-full">
                          <a href={entry.imageUrl} download={`${entry.title}.png`}>
                            <Download className="mr-1.5 h-3.5 w-3.5" /> 4K PNG
                          </a>
                        </Button>
                        {entry.status !== "approved" ? (
                          <Button size="sm" variant="outline" className="h-8 rounded-full border-[#1B7339] text-[#1B7339]" onClick={() => { setApproveId(entry.id); setApproveClient("") }}>
                            <BadgeCheck className="mr-1 h-3.5 w-3.5" /> Approve
                          </Button>
                        ) : null}
                        <Button size="sm" variant="ghost" className="h-8 w-8 text-[#c62828]" onClick={() => removeEntry(entry.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {entry.finalUrl ? (
                      <a href={entry.finalUrl} target="_blank" rel="noreferrer" className="block truncate text-[12px] text-[#1B7339] underline">
                        R2: {entry.clientId}/
                      </a>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : tab === "displays" ? (
        <div className="space-y-4">
          <p className="rounded-xl border border-[#ebe9e4] bg-white px-4 py-3 text-[13px] text-[#5A5A5A]">
            A display is a <b>transparent PNG</b> design (foreground) with the location-photo area left see-through. Each location photo is placed <b>behind</b> it and the logo goes on top.
          </p>
          <Card title={`Displays (${pickedDisplays.length}/${displays.length})`}>
            {templateTable(displays, pickedDisplays, pickDisplay, (id) => logos.find((l) => l.id === id)?.name, "No displays yet.")}
          </Card>
          <div className="grid gap-4 xl:grid-cols-2">
            {backgroundsCard("Location photos")}
            {logosCard}
          </div>
        </div>
      ) : tab === "mockups" ? (
        <div className="space-y-4">
          <Card title={`Mockups (${pickedMockups.length}/${mockups.length})`}>
            {templateTable(mockups, pickedMockups, pickMockup, (id) => presets.find((p) => p.id === id)?.name, "No mockups yet.")}
          </Card>
          <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
            {presetsCard(`Presets placed inside mockups (${pickedPresets.length}/${presets.length})`)}
            {logosCard}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {backgroundsCard("Backgrounds")}
          <Card
            title={`Foreground layers (${overlayLayers.length})`}
            action={
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-full"
                disabled={!backgrounds.length}
                onClick={() => setEditor({ mode: "overlay" })}
              >
                <Layers className="mr-1.5 h-3.5 w-3.5" /> Place &amp; edit
              </Button>
            }
          >
            <table className="w-full text-sm">
              <thead className="bg-[#faf9f6]">
                <tr>
                  <th className={th}>Layer</th>
                  <th className={th}>Type</th>
                  <th className={th}>Opacity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1efe9]">
                {overlayLayers.map((layer) => (
                  <tr key={layer.id}>
                    <td className={`${td} font-medium`}>{layer.kind === "text" ? layer.text : layer.label}</td>
                    <td className={td}>{layer.kind === "text" ? "Text" : "Image"}</td>
                    <td className={td}>{Math.round(layer.opacity * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!backgrounds.length ? <p className="px-4 pb-4 text-[12px] text-[#6B6B6B]">Add a background first, then place the foreground on it.</p> : null}
          </Card>
        </div>
      )}

      <div className={`sticky bottom-3 ${tab === "history" ? "hidden" : "flex"}`}>
      <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#ebe9e4] bg-white px-4 py-3 shadow-sm">
        <p className="text-sm text-[#5A5A5A]">
          {summary} = <span className="font-semibold text-[#141414]">{pageCount} page{pageCount === 1 ? "" : "s"}</span>
        </p>
        <Button className="rounded-full bg-[#1B7339] hover:bg-[#145a2c]" disabled={!pageCount} onClick={openPreview}>
          <Eye className="mr-2 h-4 w-4" /> Preview &amp; download
        </Button>
      </div>
      </div>

      <PlacementEditor
        open={Boolean(editor)}
        onClose={() => setEditor(null)}
        title={
          editor?.mode === "overlay"
            ? "Place the foreground"
            : editor?.mode === "mockup"
              ? "Place the preset inside this mockup"
              : editor?.mode === "layered"
                ? "Place the logo on this display"
              : "Place the logo on this preset"
        }
        baseUrl={editorBase}
        layers={editorLayers}
        allowExtra={editor?.mode === "overlay"}
        saving={busy === "save"}
        saveLabel={editor?.mode === "overlay" ? "Apply" : "Save placement"}
        onSave={(layers) => {
          if (editor?.mode === "overlay") {
            setOverlayLayers(layers)
            setEditor(null)
          } else void saveTemplate(layers)
        }}
        sidebar={
          editor && editor.mode !== "overlay" ? (
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#6B6B6B]">Name</p>
                <Input value={editorName} onChange={(e) => setEditorName(e.target.value)} />
              </div>
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#6B6B6B]">
                  {editor.mode === "mockup" ? "Presets selected by default" : "Logos selected by default"}
                </p>
                {editorChildren.length === 0 ? (
                  <p className="text-[12px] text-[#6B6B6B]">Nothing to choose yet.</p>
                ) : (
                  <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-[#ebe9e4] p-1.5">
                    {editorChildren.map((child) => (
                      <label key={child.id} className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-[13px] hover:bg-[#f6f5f2]">
                        <input
                          type="checkbox"
                          className="accent-[#1B7339]"
                          checked={editorDefaults.includes(child.id)}
                          onChange={() => toggle(setEditorDefaults, child.id)}
                        />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={child.url} alt="" className={`h-6 w-8 rounded object-contain ${CHECKER}`} />
                        <span className="truncate">{child.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null
        }
      />

      <ExportDialog
        onSaved={() => void loadHistory()}
        open={Boolean(exportPages)}
        onClose={() => setExportPages(null)}
        title={tab === "displays" ? "displays" : tab === "mockups" ? "mockups" : tab === "overlay" ? "overlays" : "presets"}
        pages={exportPages || []}
      />
    </div>
  )
}
