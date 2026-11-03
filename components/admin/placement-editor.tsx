"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  ImagePlus,
  Loader2,
  Trash2,
  Type,
} from "lucide-react"
import { fitTextSize, TEXT_FONT, type Layer } from "@/lib/mockup-canvas"

type Handle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw"

const HANDLES: { id: Handle; style: React.CSSProperties; cursor: string }[] = [
  { id: "nw", style: { left: 0, top: 0 }, cursor: "nwse-resize" },
  { id: "n", style: { left: "50%", top: 0 }, cursor: "ns-resize" },
  { id: "ne", style: { left: "100%", top: 0 }, cursor: "nesw-resize" },
  { id: "e", style: { left: "100%", top: "50%" }, cursor: "ew-resize" },
  { id: "se", style: { left: "100%", top: "100%" }, cursor: "nwse-resize" },
  { id: "s", style: { left: "50%", top: "100%" }, cursor: "ns-resize" },
  { id: "sw", style: { left: 0, top: "100%" }, cursor: "nesw-resize" },
  { id: "w", style: { left: 0, top: "50%" }, cursor: "ew-resize" },
]

const MIN = 0.02
const SNAP_PX = 7
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

type Guides = { v: number[]; h: number[] }

export type PlacementEditorProps = {
  open: boolean
  onClose: () => void
  title: string
  baseUrl: string
  layers: Layer[]
  /** Let the person add text / image layers and delete layers. */
  allowExtra?: boolean
  saving?: boolean
  saveLabel?: string
  onSave: (layers: Layer[]) => void
  /** Extra controls shown above the layer list (e.g. default logos picker). */
  sidebar?: ReactNode
}

export function PlacementEditor({
  open,
  onClose,
  title,
  baseUrl,
  layers,
  allowExtra,
  saving,
  saveLabel = "Save",
  onSave,
  sidebar,
}: PlacementEditorProps) {
  const [draft, setDraft] = useState<Layer[]>(layers)
  const [selected, setSelected] = useState<string[]>([])
  const [guides, setGuides] = useState<Guides>({ v: [], h: [] })
  const [stage, setStage] = useState({ w: 0, h: 0 })
  const [ratio, setRatio] = useState(1)
  const [stageEl, setStageEl] = useState<HTMLDivElement | null>(null)
  const imageInput = useRef<HTMLInputElement>(null)
  const draftRef = useRef(draft)
  draftRef.current = draft

  useEffect(() => {
    if (open) {
      setDraft(layers)
      setSelected(layers[0] ? [layers[0].id] : [])
      setGuides({ v: [], h: [] })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open || !baseUrl) return
    const img = new Image()
    img.onload = () => setRatio(img.naturalWidth / img.naturalHeight || 1)
    img.src = baseUrl
  }, [open, baseUrl])

  useEffect(() => {
    if (!stageEl) return
    const measure = () => setStage({ w: stageEl.clientWidth, h: stageEl.clientHeight })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(stageEl)
    return () => observer.disconnect()
  }, [stageEl])

  const frame = useMemo(() => {
    const maxW = Math.max(0, stage.w - 32)
    const maxH = Math.max(0, stage.h - 32)
    const w = Math.min(maxW, maxH * ratio)
    return { w, h: w / ratio }
  }, [stage, ratio])

  const patch = useCallback((id: string, change: Partial<Layer>) => {
    setDraft((prev) => prev.map((layer) => (layer.id === id ? { ...layer, ...change } : layer)))
  }, [])

  const snapValue = (value: number, targets: number[], threshold: number) => {
    let best: { delta: number; line: number } | null = null
    for (const target of targets) {
      const delta = target - value
      if (Math.abs(delta) <= threshold && (!best || Math.abs(delta) < Math.abs(best.delta))) best = { delta, line: target }
    }
    return best
  }

  const startDrag = (event: React.PointerEvent, ids: string[], mode: "move" | Handle) => {
    if (!frame.w) return
    event.preventDefault()
    event.stopPropagation()
    const startX = event.clientX
    const startY = event.clientY
    const snapshot = new Map(draftRef.current.filter((l) => ids.includes(l.id)).map((l) => [l.id, { ...l }]))
    const items = [...snapshot.values()]
    const bbox = {
      x: Math.min(...items.map((l) => l.x)),
      y: Math.min(...items.map((l) => l.y)),
      r: Math.max(...items.map((l) => l.x + l.w)),
      b: Math.max(...items.map((l) => l.y + l.h)),
    }
    const others = draftRef.current.filter((l) => !ids.includes(l.id))
    const xTargets = [0, 0.5, 1, ...others.flatMap((l) => [l.x, l.x + l.w / 2, l.x + l.w])]
    const yTargets = [0, 0.5, 1, ...others.flatMap((l) => [l.y, l.y + l.h / 2, l.y + l.h])]
    const tx = SNAP_PX / frame.w
    const ty = SNAP_PX / frame.h
    const startAspect = items[0] ? items[0].w / items[0].h : 1

    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / frame.w
      const dy = (ev.clientY - startY) / frame.h
      const nextGuides: Guides = { v: [], h: [] }

      if (mode === "move") {
        const w = bbox.r - bbox.x
        const h = bbox.b - bbox.y
        let nx = clamp(bbox.x + dx, 0, 1 - w)
        let ny = clamp(bbox.y + dy, 0, 1 - h)
        const sx = [snapValue(nx, xTargets, tx), snapValue(nx + w / 2, xTargets, tx), snapValue(nx + w, xTargets, tx)]
          .filter(Boolean)
          .sort((a, b) => Math.abs(a!.delta) - Math.abs(b!.delta))[0]
        const sy = [snapValue(ny, yTargets, ty), snapValue(ny + h / 2, yTargets, ty), snapValue(ny + h, yTargets, ty)]
          .filter(Boolean)
          .sort((a, b) => Math.abs(a!.delta) - Math.abs(b!.delta))[0]
        if (sx) {
          nx += sx.delta
          nextGuides.v.push(sx.line)
        }
        if (sy) {
          ny += sy.delta
          nextGuides.h.push(sy.line)
        }
        nx = clamp(nx, 0, 1 - w)
        ny = clamp(ny, 0, 1 - h)
        const ox = nx - bbox.x
        const oy = ny - bbox.y
        setDraft((prev) =>
          prev.map((layer) => {
            const origin = snapshot.get(layer.id)
            return origin ? { ...layer, x: origin.x + ox, y: origin.y + oy } : layer
          }),
        )
      } else {
        let l = bbox.x
        let t = bbox.y
        let r = bbox.r
        let b = bbox.b
        if (mode.includes("w")) l = clamp(bbox.x + dx, 0, r - MIN)
        if (mode.includes("e")) r = clamp(bbox.r + dx, l + MIN, 1)
        if (mode.includes("n")) t = clamp(bbox.y + dy, 0, b - MIN)
        if (mode.includes("s")) b = clamp(bbox.b + dy, t + MIN, 1)
        if (mode.includes("w")) {
          const s = snapValue(l, xTargets, tx)
          if (s) {
            l = clamp(l + s.delta, 0, r - MIN)
            nextGuides.v.push(s.line)
          }
        }
        if (mode.includes("e")) {
          const s = snapValue(r, xTargets, tx)
          if (s) {
            r = clamp(r + s.delta, l + MIN, 1)
            nextGuides.v.push(s.line)
          }
        }
        if (mode.includes("n")) {
          const s = snapValue(t, yTargets, ty)
          if (s) {
            t = clamp(t + s.delta, 0, b - MIN)
            nextGuides.h.push(s.line)
          }
        }
        if (mode.includes("s")) {
          const s = snapValue(b, yTargets, ty)
          if (s) {
            b = clamp(b + s.delta, t + MIN, 1)
            nextGuides.h.push(s.line)
          }
        }
        // Shift on a corner keeps the original aspect ratio (measured in pixels).
        if (ev.shiftKey && mode.length === 2) {
          const pxAspect = startAspect * (frame.w / frame.h)
          const w = r - l
          const h = (w * frame.w) / (pxAspect * frame.h)
          if (mode.includes("n")) t = clamp(b - h, 0, b - MIN)
          else b = clamp(t + h, t + MIN, 1)
        }
        const id = ids[0]
        patch(id, { x: l, y: t, w: r - l, h: b - t })
      }
      setGuides(nextGuides)
    }
    const onUp = () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      setGuides({ v: [], h: [] })
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  const select = (event: React.PointerEvent, id: string) => {
    const additive = event.shiftKey || event.metaKey || event.ctrlKey
    const next = additive ? (selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]) : selected.includes(id) ? selected : [id]
    setSelected(next)
    if (next.length) startDrag(event, next, "move")
  }

  const align = (dir: "left" | "hcenter" | "right" | "top" | "vmiddle" | "bottom") => {
    const picked = draft.filter((l) => selected.includes(l.id))
    if (!picked.length) return
    const ref =
      picked.length > 1
        ? {
            x: Math.min(...picked.map((l) => l.x)),
            y: Math.min(...picked.map((l) => l.y)),
            r: Math.max(...picked.map((l) => l.x + l.w)),
            b: Math.max(...picked.map((l) => l.y + l.h)),
          }
        : { x: 0, y: 0, r: 1, b: 1 }
    setDraft((prev) =>
      prev.map((layer) => {
        if (!selected.includes(layer.id)) return layer
        switch (dir) {
          case "left":
            return { ...layer, x: ref.x }
          case "hcenter":
            return { ...layer, x: (ref.x + ref.r) / 2 - layer.w / 2 }
          case "right":
            return { ...layer, x: ref.r - layer.w }
          case "top":
            return { ...layer, y: ref.y }
          case "vmiddle":
            return { ...layer, y: (ref.y + ref.b) / 2 - layer.h / 2 }
          default:
            return { ...layer, y: ref.b - layer.h }
        }
      }),
    )
  }

  const addText = () => {
    const id = `t${Date.now().toString(36)}`
    setDraft((prev) => [
      ...prev,
      { id, kind: "text", label: "Text", text: "Your text", color: "#ffffff", bold: true, opacity: 0.6, x: 0.3, y: 0.44, w: 0.4, h: 0.12 },
    ])
    setSelected([id])
  }

  const addImage = (file: File) => {
    const id = `i${Date.now().toString(36)}`
    const src = URL.createObjectURL(file)
    setDraft((prev) => [
      ...prev,
      { id, kind: "image", label: file.name.replace(/\.[^.]+$/, ""), src, opacity: 0.5, x: 0.3, y: 0.3, w: 0.4, h: 0.4 },
    ])
    setSelected([id])
  }

  const removeSelected = useCallback(() => {
    setDraft((prev) => prev.filter((l) => !selected.includes(l.id)))
    setSelected([])
  }, [selected])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && /input|textarea|select/i.test(target.tagName)) return
      if (!selected.length) return
      const step = event.shiftKey ? 0.01 : 0.002
      const move = (dx: number, dy: number) => {
        event.preventDefault()
        setDraft((prev) =>
          prev.map((l) => (selected.includes(l.id) ? { ...l, x: clamp(l.x + dx, 0, 1 - l.w), y: clamp(l.y + dy, 0, 1 - l.h) } : l)),
        )
      }
      if (event.key === "ArrowLeft") move(-step, 0)
      else if (event.key === "ArrowRight") move(step, 0)
      else if (event.key === "ArrowUp") move(0, -step)
      else if (event.key === "ArrowDown") move(0, step)
      else if ((event.key === "Delete" || event.key === "Backspace") && allowExtra) {
        event.preventDefault()
        removeSelected()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, selected, allowExtra, removeSelected])

  const active = draft.find((l) => selected.length === 1 && l.id === selected[0]) || null
  const pct = (n: number) => Math.round(n * 1000) / 10

  const setPct = (key: "x" | "y" | "w" | "h", value: string) => {
    if (!active) return
    const n = Number(value) / 100
    if (!Number.isFinite(n)) return
    if (key === "x") patch(active.id, { x: clamp(n, 0, 1 - active.w) })
    if (key === "y") patch(active.id, { y: clamp(n, 0, 1 - active.h) })
    if (key === "w") patch(active.id, { w: clamp(n, MIN, 1 - active.x) })
    if (key === "h") patch(active.id, { h: clamp(n, MIN, 1 - active.y) })
  }

  const renderContent = (layer: Layer) => {
    const preview = layer.previewSrc || layer.src
    return (
      <div
        key={`content-${layer.id}`}
        className="pointer-events-none absolute flex items-center justify-center overflow-hidden"
        style={{
          left: `${layer.x * 100}%`,
          top: `${layer.y * 100}%`,
          width: `${layer.w * 100}%`,
          height: `${layer.h * 100}%`,
          opacity: layer.opacity,
          background: layer.fill || undefined,
        }}
      >
        {layer.kind === "text" ? (
          <span
            style={{
              color: layer.color,
              fontWeight: layer.bold ? 700 : 500,
              fontFamily: TEXT_FONT,
              whiteSpace: "nowrap",
              fontSize: fitTextSize(layer.text || "", layer.bold, layer.w * frame.w, layer.h * frame.h),
              lineHeight: 1,
            }}
          >
            {layer.text}
          </span>
        ) : preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" draggable={false} className={`h-full w-full ${layer.fit === "cover" ? "object-cover" : layer.fit === "fill" ? "object-fill" : "object-contain"}`} />
        ) : (
          <span className="rounded bg-black/40 px-1.5 text-[11px] font-semibold uppercase tracking-wide text-white">{layer.label}</span>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="flex h-[94vh] w-[97vw] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
        <DialogHeader className="border-b border-[#ebe9e4] px-5 py-3">
          <DialogTitle className="text-base">{title}</DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex flex-wrap items-center gap-1 border-b border-[#ebe9e4] bg-white px-3 py-2">
              {(
                [
                  ["left", AlignStartVertical, "Align left"],
                  ["hcenter", AlignCenterVertical, "Center horizontally"],
                  ["right", AlignEndVertical, "Align right"],
                  ["top", AlignStartHorizontal, "Align top"],
                  ["vmiddle", AlignCenterHorizontal, "Center vertically"],
                  ["bottom", AlignEndHorizontal, "Align bottom"],
                ] as const
              ).map(([dir, Icon, label]) => (
                <Button key={dir} type="button" size="icon" variant="ghost" className="h-8 w-8" title={label} onClick={() => align(dir)}>
                  <Icon className="h-4 w-4" />
                </Button>
              ))}
              <span className="ml-2 hidden text-[12px] text-[#6B6B6B] md:inline">
                Drag to move · drag any edge or corner to resize (Shift keeps ratio) · Shift-click selects several · arrow keys nudge
              </span>
              {allowExtra ? (
                <div className="ml-auto flex gap-1">
                  <Button type="button" size="sm" variant="outline" className="h-8 rounded-full" onClick={addText}>
                    <Type className="mr-1.5 h-3.5 w-3.5" /> Text
                  </Button>
                  <Button type="button" size="sm" variant="outline" className="h-8 rounded-full" onClick={() => imageInput.current?.click()}>
                    <ImagePlus className="mr-1.5 h-3.5 w-3.5" /> Image
                  </Button>
                  <input
                    ref={imageInput}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      e.target.value = ""
                      if (file) addImage(file)
                    }}
                  />
                </div>
              ) : null}
            </div>

            <div
              ref={setStageEl}
              className="relative flex min-h-[280px] flex-1 items-center justify-center overflow-hidden bg-[#1c1c1e]"
              onPointerDown={() => setSelected([])}
            >
              {frame.w > 0 ? (
                <div className="relative select-none bg-[linear-gradient(45deg,#3a3a3d_25%,transparent_25%),linear-gradient(-45deg,#3a3a3d_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#3a3a3d_75%),linear-gradient(-45deg,transparent_75%,#3a3a3d_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0] shadow-2xl" style={{ width: frame.w, height: frame.h }}>
                  {draft.filter((l) => l.behind).map((layer) => renderContent(layer))}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={baseUrl} alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full" />
                  {draft.filter((l) => !l.behind).map((layer) => renderContent(layer))}
                  {draft.filter((l) => !l.locked).map((layer) => {
                    const isSelected = selected.includes(layer.id)
                    return (
                      <div
                        key={`box-${layer.id}`}
                        className={`absolute z-10 cursor-move ${isSelected ? "outline outline-2 outline-[#1B7339]" : "outline outline-1 outline-dashed outline-white/70 hover:outline-[#1B7339]"}`}
                        style={{
                          left: `${layer.x * 100}%`,
                          top: `${layer.y * 100}%`,
                          width: `${layer.w * 100}%`,
                          height: `${layer.h * 100}%`,
                        }}
                        onPointerDown={(e) => select(e, layer.id)}
                      >
                        {isSelected && selected.length === 1
                          ? HANDLES.map((h) => (
                              <span
                                key={h.id}
                                className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-[3px] border border-[#1B7339] bg-white"
                                style={{ ...h.style, cursor: h.cursor }}
                                onPointerDown={(e) => startDrag(e, [layer.id], h.id)}
                              />
                            ))
                          : null}
                      </div>
                    )
                  })}
                  {guides.v.map((x) => (
                    <div key={`v${x}`} className="pointer-events-none absolute top-0 z-20 h-full w-px bg-[#ff2fb4]" style={{ left: `${x * 100}%` }} />
                  ))}
                  {guides.h.map((y) => (
                    <div key={`h${y}`} className="pointer-events-none absolute left-0 z-20 h-px w-full bg-[#ff2fb4]" style={{ top: `${y * 100}%` }} />
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <aside className="flex max-h-[40vh] w-full flex-col gap-4 overflow-y-auto border-t border-[#ebe9e4] bg-white p-4 lg:max-h-none lg:w-[300px] lg:border-l lg:border-t-0">
            {sidebar}

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#6B6B6B]">Layers</p>
              <div className="space-y-1">
                {draft.filter((l) => !l.locked).map((layer) => (
                  <button
                    key={layer.id}
                    type="button"
                    onClick={() => setSelected([layer.id])}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[13px] ${selected.includes(layer.id) ? "bg-[#F4FBF5] text-[#145a2c]" : "hover:bg-[#f6f5f2]"}`}
                  >
                    <span className="truncate">{layer.kind === "text" ? layer.text || "Text" : layer.label}</span>
                    {allowExtra && draft.length > 1 ? (
                      <Trash2
                        className="h-3.5 w-3.5 shrink-0 text-[#c62828]"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDraft((prev) => prev.filter((l) => l.id !== layer.id))
                          setSelected((prev) => prev.filter((id) => id !== layer.id))
                        }}
                      />
                    ) : null}
                  </button>
                ))}
              </div>
            </div>

            {active ? (
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B6B6B]">Selected</p>
                {active.kind === "text" ? (
                  <>
                    <Input value={active.text || ""} onChange={(e) => patch(active.id, { text: e.target.value })} />
                    <div className="flex items-center gap-3 text-[13px]">
                      <input type="color" value={active.color || "#ffffff"} onChange={(e) => patch(active.id, { color: e.target.value })} className="h-8 w-10 cursor-pointer rounded border border-[#ebe9e4]" />
                      <label className="flex items-center gap-1.5">
                        <input type="checkbox" checked={Boolean(active.bold)} onChange={(e) => patch(active.id, { bold: e.target.checked })} />
                        Bold
                      </label>
                    </div>
                  </>
                ) : null}
                {active.kind === "image" ? (
                  <div className="space-y-2 text-[13px]">
                    <label className="flex items-center justify-between gap-2">
                      Picture fit
                      <select
                        value={active.fit || "contain"}
                        onChange={(e) => patch(active.id, { fit: e.target.value as Layer["fit"] })}
                        className="rounded-md border border-[#ebe9e4] bg-white px-2 py-1"
                      >
                        <option value="contain">Fit inside</option>
                        <option value="cover">Fill &amp; crop</option>
                        <option value="fill">Stretch to box</option>
                      </select>
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5">
                        <input type="checkbox" checked={Boolean(active.fill)} onChange={(e) => patch(active.id, { fill: e.target.checked ? "#ffffff" : undefined })} />
                        Solid background
                      </label>
                      {active.fill ? (
                        <input type="color" value={active.fill} onChange={(e) => patch(active.id, { fill: e.target.value })} className="h-7 w-9 cursor-pointer rounded border border-[#ebe9e4]" />
                      ) : null}
                    </div>
                  </div>
                ) : null}
                <label className="block text-[13px]">
                  Opacity {Math.round(active.opacity * 100)}%
                  <input type="range" min={5} max={100} value={Math.round(active.opacity * 100)} onChange={(e) => patch(active.id, { opacity: Number(e.target.value) / 100 })} className="mt-1 w-full accent-[#1B7339]" />
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(["x", "y", "w", "h"] as const).map((key) => (
                    <label key={key} className="text-[11px] uppercase text-[#6B6B6B]">
                      {key}
                      <Input type="number" step="0.5" className="mt-1 h-8 px-1.5 text-[12px]" value={pct(active[key])} onChange={(e) => setPct(key, e.target.value)} />
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#ebe9e4] bg-white px-5 py-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button className="bg-[#1B7339] hover:bg-[#145a2c]" disabled={saving} onClick={() => onSave(draft)}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {saveLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
