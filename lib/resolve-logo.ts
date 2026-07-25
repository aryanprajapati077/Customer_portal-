import { existsSync } from "fs"
import path from "path"

/** Resolve customer logo from DB path (/uploads/...) for react-pdf */
export function resolveLogoForPdf(logoUrl?: string | null): string | null {
  const raw = logoUrl?.trim()
  if (!raw) return null

  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:")) {
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
