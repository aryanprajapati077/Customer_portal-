import { existsSync } from "fs"
import path from "path"
import { parseMediaKey, r2PublicUrlForKey } from "@/lib/media-url"

export type PdfLogo = {
  dataUrl: string
  width: number
  height: number
}

const MAX_LOGO_EDGE = 720
const TRIM_THRESHOLD = 16

/** Resolve customer logo from a remote R2 URL, data URL, or local development path. */
export function resolveLogoForPdf(logoUrl?: string | null): string | null {
  const raw = logoUrl?.trim()
  if (!raw) return null

  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:")) {
    return raw
  }

  // Portal media proxy — keep as path; loadLogoForPdf fetches via R2.
  if (raw.startsWith("/api/media/")) return raw

  if (raw.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "public", raw.replace(/^\//, ""))
    if (existsSync(filePath)) return filePath
    return raw
  }

  if (raw.startsWith("/")) {
    const filePath = path.join(process.cwd(), "public", raw.replace(/^\//, ""))
    if (existsSync(filePath)) return filePath
    return null
  }

  if (existsSync(raw)) return raw
  return null
}

function guessMime(url: string, headerCt: string | null): string {
  const ct = (headerCt || "").split(";")[0].trim().toLowerCase()
  if (ct.startsWith("image/")) return ct
  const lower = url.toLowerCase()
  if (lower.includes(".png")) return "image/png"
  if (lower.includes(".webp")) return "image/webp"
  if (lower.includes(".gif")) return "image/gif"
  if (lower.includes(".svg")) return "image/svg+xml"
  return "image/jpeg"
}

/** Read intrinsic pixel size from PNG / JPEG / WebP / GIF buffers. */
export function readImageDimensions(buf: Buffer): { width: number; height: number } | null {
  if (!buf || buf.length < 24) return null

  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
  }

  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
    return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) }
  }

  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf[8] === 0x57) {
    if (buf[12] === 0x56 && buf[13] === 0x50 && buf[14] === 0x38 && buf[15] === 0x20 && buf.length >= 30) {
      return {
        width: buf.readUInt16LE(26) & 0x3fff,
        height: buf.readUInt16LE(28) & 0x3fff,
      }
    }
    if (buf[12] === 0x56 && buf[13] === 0x50 && buf[14] === 0x38 && buf[15] === 0x4c && buf.length >= 25) {
      const bits = buf.readUInt32LE(21)
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1,
      }
    }
    if (buf[12] === 0x56 && buf[13] === 0x50 && buf[14] === 0x38 && buf[15] === 0x58 && buf.length >= 30) {
      return {
        width: 1 + buf[24] + (buf[25] << 8) + (buf[26] << 16),
        height: 1 + buf[27] + (buf[28] << 8) + (buf[29] << 16),
      }
    }
  }

  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2
    while (i < buf.length - 8) {
      if (buf[i] !== 0xff) {
        i += 1
        continue
      }
      const marker = buf[i + 1]
      if (marker === 0xd9 || marker === 0xda) break
      const len = buf.readUInt16BE(i + 2)
      if (
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf)
      ) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) }
      }
      i += 2 + len
    }
  }

  return null
}

export function fitLogoSize(
  srcW: number,
  srcH: number,
  maxW: number,
  maxH: number,
): { width: number; height: number } {
  if (!srcW || !srcH || !maxW || !maxH) return { width: maxW, height: maxH }
  const scale = Math.min(maxW / srcW, maxH / srcH)
  return {
    width: Math.max(1, Math.round(srcW * scale * 10) / 10),
    height: Math.max(1, Math.round(srcH * scale * 10) / 10),
  }
}

function mediaKeyFromUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (trimmed.startsWith("/api/media/")) {
    const parts = trimmed
      .slice("/api/media/".length)
      .split("/")
      .filter(Boolean)
      .map((p) => {
        try {
          return decodeURIComponent(p)
        } catch {
          return p
        }
      })
    return parseMediaKey(parts)
  }

  try {
    const u = new URL(trimmed)
    if (u.pathname.startsWith("/api/media/")) {
      const parts = u.pathname
        .slice("/api/media/".length)
        .split("/")
        .filter(Boolean)
        .map((p) => {
          try {
            return decodeURIComponent(p)
          } catch {
            return p
          }
        })
      return parseMediaKey(parts)
    }
  } catch {
    /* ignore */
  }

  const publicBase = process.env.R2_PUBLIC_URL?.trim().replace(/\/$/, "")
  if (publicBase && trimmed.startsWith(`${publicBase}/`)) {
    return trimmed.slice(publicBase.length + 1).replace(/^\/+/, "") || null
  }

  const r2Match = trimmed.match(/^https:\/\/pub-[a-f0-9]+\.r2\.dev\/(.+)$/i)
  if (r2Match?.[1]) return r2Match[1]

  return null
}

async function fetchBytesFromR2Key(key: string): Promise<Buffer | null> {
  const publicUrl = r2PublicUrlForKey(key)
  if (publicUrl) {
    try {
      const upstream = await fetch(publicUrl, {
        headers: { Accept: "image/*,*/*" },
        signal: AbortSignal.timeout(15_000),
      })
      if (upstream.ok) {
        const bytes = Buffer.from(await upstream.arrayBuffer())
        if (bytes.length >= 32) return bytes
      }
    } catch (error) {
      console.warn("loadLogoForPdf R2 public fetch failed:", key, error)
    }
  }

  try {
    const accountId = process.env.R2_ACCOUNT_ID?.trim()
    const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim()
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim()
    const bucket = process.env.R2_BUCKET_NAME?.trim()
    if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null

    const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3")
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    })
    const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
    if (!result.Body) return null
    const bytes = Buffer.from(await result.Body.transformToByteArray())
    return bytes.length >= 32 ? bytes : null
  } catch (error) {
    console.warn("loadLogoForPdf R2 SDK fetch failed:", key, error)
    return null
  }
}

async function loadRawLogoBytes(logoUrl?: string | null): Promise<Buffer | null> {
  const resolved = resolveLogoForPdf(logoUrl)
  if (!resolved) return null

  if (resolved.startsWith("data:")) {
    const match = resolved.match(/^data:([^;,]+);base64,(.+)$/i)
    if (!match) return null
    try {
      const bytes = Buffer.from(match[2], "base64")
      if (bytes.length < 32 || bytes.length > 12 * 1024 * 1024) return null
      return bytes
    } catch {
      return null
    }
  }

  const mediaKey = mediaKeyFromUrl(resolved)
  if (mediaKey) {
    const bytes = await fetchBytesFromR2Key(mediaKey)
    if (bytes) return bytes
  }

  if (!resolved.startsWith("http://") && !resolved.startsWith("https://") && !resolved.startsWith("/")) {
    try {
      const { readFile } = await import("fs/promises")
      const bytes = await readFile(resolved)
      return bytes.length >= 32 ? bytes : null
    } catch {
      return null
    }
  }

  if (resolved.startsWith("/uploads/")) {
    try {
      const { readFile } = await import("fs/promises")
      const filePath = path.join(process.cwd(), "public", resolved.replace(/^\//, ""))
      const bytes = await readFile(filePath)
      return bytes.length >= 32 ? bytes : null
    } catch {
      return null
    }
  }

  if (resolved.startsWith("http://") || resolved.startsWith("https://")) {
    try {
      const upstream = await fetch(resolved, {
        headers: { Accept: "image/*,*/*" },
        signal: AbortSignal.timeout(15_000),
      })
      if (!upstream.ok) {
        console.warn("loadLogoForPdf fetch failed:", upstream.status, resolved.slice(0, 100))
        return null
      }
      const bytes = Buffer.from(await upstream.arrayBuffer())
      if (bytes.length < 32 || bytes.length > 12 * 1024 * 1024) return null
      return bytes
    } catch (error) {
      console.warn("loadLogoForPdf error:", error)
      return null
    }
  }

  return null
}

/**
 * Normalize any logo into a compact PNG that @react-pdf can always render.
 * Converts WebP/GIF/SVG/JPEG → PNG, trims padded screenshot canvases, downscales.
 */
async function normalizeLogoForPdf(bytes: Buffer): Promise<PdfLogo | null> {
  try {
    const sharp = (await import("sharp")).default
    const base = () =>
      sharp(bytes, {
        failOn: "none",
        animated: false,
        density: 180,
      }).rotate()

    let source = base()
    try {
      const meta = await base().metadata()
      const origW = meta.width || 1
      const origH = meta.height || 1
      const trimmed = await base()
        .ensureAlpha()
        .trim({
          background: { r: 255, g: 255, b: 255, alpha: 0 },
          threshold: TRIM_THRESHOLD,
        })
        .toBuffer({ resolveWithObject: true })

      const newArea = trimmed.info.width * trimmed.info.height
      const origArea = origW * origH
      // Keep trim when it removes padding but leaves a usable logo.
      if (newArea >= 80 && newArea <= origArea * 0.97 && trimmed.info.width >= 8 && trimmed.info.height >= 8) {
        source = sharp(trimmed.data)
      }
    } catch {
      source = base()
    }

    const { data, info } = await source
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .resize({
        width: MAX_LOGO_EDGE,
        height: MAX_LOGO_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .png({
        compressionLevel: 8,
        adaptiveFiltering: true,
        palette: false,
      })
      .toBuffer({ resolveWithObject: true })

    if (!info.width || !info.height || data.length < 32) return null

    return {
      dataUrl: `data:image/png;base64,${data.toString("base64")}`,
      width: info.width,
      height: info.height,
    }
  } catch (error) {
    console.warn("normalizeLogoForPdf sharp failed:", error)
    const dims = readImageDimensions(bytes)
    if (!dims) return null
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8
    if (!isPng && !isJpeg) return null
    return {
      dataUrl: `data:${isPng ? "image/png" : "image/jpeg"};base64,${bytes.toString("base64")}`,
      width: dims.width,
      height: dims.height,
    }
  }
}

/**
 * Load a logo into an embedded PNG data URL + intrinsic size for reliable PDF rendering.
 */
export async function loadLogoForPdf(logoUrl?: string | null): Promise<PdfLogo | null> {
  const bytes = await loadRawLogoBytes(logoUrl)
  if (!bytes) return null
  return normalizeLogoForPdf(bytes)
}
