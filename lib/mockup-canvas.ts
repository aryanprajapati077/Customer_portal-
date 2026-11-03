/** Browser-side compositing + export (PNG, PDF, zip) for presets, mockups and overlays. */

export type Layer = {
  id: string
  label: string
  kind: "image" | "text"
  /** Image layers: url of the picture. */
  src?: string
  /** Image layers: another page rendered into this layer (a preset placed inside a mockup). */
  child?: PageSpec
  /** Editor-only stand-in image shown while placing (e.g. the preset a mockup will hold). */
  previewSrc?: string
  /** Text layers. */
  text?: string
  color?: string
  bold?: boolean
  /** Drawn underneath the base image (the base then needs transparent areas, e.g. a "window" onto a location photo). */
  behind?: boolean
  /** "contain" (default) keeps the whole picture; "cover" fills the box and crops. */
  fit?: "contain" | "cover" | "fill"
  /** Solid colour painted in the box before the picture (e.g. white, to cover an old logo). */
  fill?: string
  /** Editor only: shown but not selectable. */
  locked?: boolean
  /** 0..1 */
  opacity: number
  /** Box in 0..1 of the base image. */
  x: number
  y: number
  w: number
  h: number
}

export type PageSpec = {
  id: string
  label: string
  baseUrl: string
  layers: Layer[]
}

const MAX_SIDE = 16384
/** Full-quality exports are never smaller than 4K (long side). */
export const MIN_EXPORT_EDGE = 3840
const imageCache = new Map<string, Promise<HTMLImageElement>>()

export function loadImage(src: string) {
  let cached = imageCache.get(src)
  if (!cached) {
    cached = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => resolve(img)
      img.onerror = () => {
        imageCache.delete(src)
        reject(new Error("Could not load an image"))
      }
      img.src = src
    })
    imageCache.set(src, cached)
  }
  return cached
}

function makeCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  return canvas
}

/** Halve repeatedly before the final draw so large → small stays crisp instead of aliasing. */
function drawSmooth(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource & { width: number; height: number },
  dx: number,
  dy: number,
  dw: number,
  dh: number,
) {
  let current: CanvasImageSource & { width: number; height: number } = source
  while (current.width > dw * 2 && current.height > dh * 2) {
    const step = makeCanvas(current.width / 2, current.height / 2)
    const sctx = step.getContext("2d")!
    sctx.imageSmoothingEnabled = true
    sctx.imageSmoothingQuality = "high"
    sctx.drawImage(current, 0, 0, step.width, step.height)
    current = step
  }
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(current, dx, dy, dw, dh)
}

export const TEXT_FONT = "Inter, Arial, Helvetica, sans-serif"

/** Font size (px) that fits `text` into a bw × bh box. Shared by the editor and the exporter. */
export function fitTextSize(text: string, bold: boolean | undefined, bw: number, bh: number) {
  const ctx = makeCanvas(1, 1).getContext("2d")!
  const weight = bold ? 700 : 500
  let size = Math.max(1, bh * 0.9)
  ctx.font = `${weight} ${size}px ${TEXT_FONT}`
  const measured = ctx.measureText(text).width
  if (measured > bw && measured > 0) size = Math.max(1, size * (bw / measured))
  return size
}

function drawText(ctx: CanvasRenderingContext2D, layer: Layer, bx: number, by: number, bw: number, bh: number) {
  const text = layer.text || ""
  if (!text) return
  const size = fitTextSize(text, layer.bold, bw, bh)
  ctx.font = `${layer.bold ? 700 : 500} ${size}px ${TEXT_FONT}`
  ctx.fillStyle = layer.color || "#ffffff"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(text, bx + bw / 2, by + bh / 2)
}

/** Render a page. `maxEdge` caps the longest side (previews); omit for a full export (native size, at least 4K). */
export async function renderPage(spec: PageSpec, maxEdge?: number): Promise<HTMLCanvasElement> {
  const base = await loadImage(spec.baseUrl)
  const nativeW = base.naturalWidth
  const nativeH = base.naturalHeight
  const longest = Math.max(nativeW, nativeH)
  const target = maxEdge ? Math.min(maxEdge, MAX_SIDE) : Math.min(MAX_SIDE, Math.max(longest, MIN_EXPORT_EDGE))
  const scale = target / longest
  const W = Math.round(nativeW * scale)
  const H = Math.round(nativeH * scale)
  const canvas = makeCanvas(W, H)
  const ctx = canvas.getContext("2d")!

  const drawLayer = async (layer: Layer) => {
    const bx = layer.x * W
    const by = layer.y * H
    const bw = layer.w * W
    const bh = layer.h * H
    ctx.save()
    ctx.globalAlpha = Math.min(1, Math.max(0, layer.opacity))
    if (layer.fill) {
      ctx.fillStyle = layer.fill
      ctx.fillRect(bx, by, bw, bh)
    }
    if (layer.kind === "text") {
      drawText(ctx, layer, bx, by, bw, bh)
    } else {
      let source: (CanvasImageSource & { width: number; height: number }) | null = null
      if (layer.child) source = await renderPage(layer.child, maxEdge)
      else if (layer.src) {
        // A detached <img> reports its natural size as width/height.
        source = await loadImage(layer.src)
      }
      if (source) {
        if (layer.fit === "fill") {
          drawSmooth(ctx, source, bx, by, bw, bh)
        } else if (layer.fit === "cover") {
          const fit = Math.max(bw / source.width, bh / source.height)
          const dw = source.width * fit
          const dh = source.height * fit
          ctx.beginPath()
          ctx.rect(bx, by, bw, bh)
          ctx.clip()
          drawSmooth(ctx, source, bx + (bw - dw) / 2, by + (bh - dh) / 2, dw, dh)
        } else {
          const fit = Math.min(bw / source.width, bh / source.height)
          const dw = source.width * fit
          const dh = source.height * fit
          drawSmooth(ctx, source, bx + (bw - dw) / 2, by + (bh - dh) / 2, dw, dh)
        }
      }
    }
    ctx.restore()
  }

  for (const layer of spec.layers.filter((l) => l.behind)) await drawLayer(layer)
  drawSmooth(ctx, base, 0, 0, W, H)
  for (const layer of spec.layers.filter((l) => !l.behind)) await drawLayer(layer)
  return canvas
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: "image/png" | "image/jpeg", quality = 0.96) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not encode image"))), type, quality)
  })
}

const encoder = new TextEncoder()

function concat(chunks: Uint8Array[]) {
  const out = new Uint8Array(chunks.reduce((sum, c) => sum + c.length, 0))
  let offset = 0
  for (const c of chunks) {
    out.set(c, offset)
    offset += c.length
  }
  return out
}

export type PdfPage = { jpeg: Uint8Array; width: number; height: number }

/** Minimal PDF writer: one full-bleed JPEG per page, page size = image size (1px = 1pt). */
export function buildPdf(pages: PdfPage[]) {
  const chunks: Uint8Array[] = []
  const offsets: number[] = []
  let length = 0
  const write = (data: Uint8Array | string) => {
    const bytes = typeof data === "string" ? encoder.encode(data) : data
    chunks.push(bytes)
    length += bytes.length
  }
  const startObject = (num: number) => {
    offsets[num] = length
    write(`${num} 0 obj\n`)
  }

  write("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n")
  const pageObjNums = pages.map((_, i) => 3 + i * 3 + 2)
  startObject(1)
  write("<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")
  startObject(2)
  write(`<< /Type /Pages /Count ${pages.length} /Kids [${pageObjNums.map((n) => `${n} 0 R`).join(" ")}] >>\nendobj\n`)

  pages.forEach((page, i) => {
    const imgNum = 3 + i * 3
    const contentNum = imgNum + 1
    const pageNum = imgNum + 2
    startObject(imgNum)
    write(
      `<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpeg.length} >>\nstream\n`,
    )
    write(page.jpeg)
    write("\nendstream\nendobj\n")
    const content = `q ${page.width} 0 0 ${page.height} 0 0 cm /Im0 Do Q`
    startObject(contentNum)
    write(`<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`)
    startObject(pageNum)
    write(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${page.width} ${page.height}] /Resources << /XObject << /Im0 ${imgNum} 0 R >> >> /Contents ${contentNum} 0 R >>\nendobj\n`,
    )
  })

  const total = 3 + pages.length * 3
  const xrefAt = length
  write(`xref\n0 ${total}\n0000000000 65535 f \n`)
  for (let n = 1; n < total; n++) write(`${String(offsets[n]).padStart(10, "0")} 00000 n \n`)
  write(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`)
  return concat(chunks)
}

let crcTable: Uint32Array | null = null
function crc32(data: Uint8Array) {
  if (!crcTable) {
    crcTable = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      crcTable[n] = c >>> 0
    }
  }
  let c = 0xffffffff
  for (let i = 0; i < data.length; i++) c = crcTable[(c ^ data[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

export function buildZip(files: { name: string; data: Uint8Array }[]) {
  const parts: Uint8Array[] = []
  const centrals: Uint8Array[] = []
  let offset = 0
  for (const file of files) {
    const name = encoder.encode(file.name)
    const crc = crc32(file.data)
    const local = new Uint8Array(30 + name.length)
    const lv = new DataView(local.buffer)
    lv.setUint32(0, 0x04034b50, true)
    lv.setUint16(4, 20, true)
    lv.setUint32(14, crc, true)
    lv.setUint32(18, file.data.length, true)
    lv.setUint32(22, file.data.length, true)
    lv.setUint16(26, name.length, true)
    local.set(name, 30)
    const central = new Uint8Array(46 + name.length)
    const cv = new DataView(central.buffer)
    cv.setUint32(0, 0x02014b50, true)
    cv.setUint16(4, 20, true)
    cv.setUint16(6, 20, true)
    cv.setUint32(16, crc, true)
    cv.setUint32(20, file.data.length, true)
    cv.setUint32(24, file.data.length, true)
    cv.setUint16(28, name.length, true)
    cv.setUint32(42, offset, true)
    central.set(name, 46)
    parts.push(local, file.data)
    centrals.push(central)
    offset += local.length + file.data.length
  }
  const centralBytes = concat(centrals)
  const end = new Uint8Array(22)
  const ev = new DataView(end.buffer)
  ev.setUint32(0, 0x06054b50, true)
  ev.setUint16(8, files.length, true)
  ev.setUint16(10, files.length, true)
  ev.setUint32(12, centralBytes.length, true)
  ev.setUint32(16, offset, true)
  return concat([...parts, centralBytes, end])
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

export function safeName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "file"
}
