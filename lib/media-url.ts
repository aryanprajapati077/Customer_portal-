import { SITE_URL } from "@/lib/site-config"

const ALLOWED_FOLDERS = new Set(["products", "logos", "attachments"])

/** Known Cloudflare R2 public host used for Buffindia product assets. */
const R2_PUBLIC_HOST_RE = /^https:\/\/pub-[a-f0-9]+\.r2\.dev\/(.+)$/i

/**
 * Rewrite external R2 image URLs to same-origin /api/media/... so hotel/office
 * networks that block *.r2.dev can still load product photos via buffindia.com.
 * Safe to call from client or server.
 */
export function toPortalMediaUrl(url: string | null | undefined): string {
  const raw = String(url || "").trim()
  if (!raw) return ""
  if (raw.startsWith("data:")) return raw
  if (raw.startsWith("/api/media/") || raw.startsWith("/uploads/")) return raw

  const publicBase =
    (typeof process !== "undefined" ? process.env.R2_PUBLIC_URL : undefined)?.trim().replace(/\/$/, "") ||
    (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_R2_PUBLIC_URL : undefined)
      ?.trim()
      .replace(/\/$/, "")

  if (publicBase && raw.startsWith(`${publicBase}/`)) {
    const key = raw.slice(publicBase.length + 1).replace(/^\/+/, "")
    return mediaPathForKey(key)
  }

  const match = raw.match(R2_PUBLIC_HOST_RE)
  if (match?.[1]) {
    return mediaPathForKey(match[1])
  }

  // Already absolute buffindia / same app URL pointing at media
  try {
    if (raw.startsWith(`${SITE_URL}/api/media/`)) {
      return raw.slice(SITE_URL.length)
    }
  } catch {
    /* ignore */
  }

  return raw
}

export function toPortalMediaUrls(urls: Array<string | null | undefined>): string[] {
  const out: string[] = []
  for (const url of urls) {
    const next = toPortalMediaUrl(url)
    if (next && !out.includes(next)) out.push(next)
  }
  return out
}

export function mediaPathForKey(key: string): string {
  const cleaned = String(key || "")
    .replace(/^\/+/, "")
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")
  return `/api/media/${cleaned}`
}

/** Validate and normalize a media object key from the public proxy route. */
export function parseMediaKey(parts: string[]): string | null {
  if (!parts.length) return null
  const decoded = parts.map((p) => {
    try {
      return decodeURIComponent(p)
    } catch {
      return p
    }
  })
  if (decoded.some((p) => !p || p === "." || p === ".." || p.includes("\\"))) return null
  const folder = decoded[0]
  if (!ALLOWED_FOLDERS.has(folder)) return null
  const key = decoded.join("/")
  if (key.length > 400) return null
  return key
}

export function r2PublicUrlForKey(key: string): string | null {
  const publicBase = process.env.R2_PUBLIC_URL?.trim().replace(/\/$/, "")
  if (!publicBase) return null
  return `${publicBase}/${key}`
}
