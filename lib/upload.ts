import path from "path"
import { saveBufferToStorage, type UploadFolder } from "@/lib/object-storage"

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9.-]/g, "_").slice(0, 80)
}

export async function saveUploadedFile(
  file: File,
  folder: UploadFolder,
): Promise<{ url: string; filename: string }> {
  const ext = path.extname(file.name) || ".jpg"
  const base = sanitizeFilename(path.basename(file.name, ext)) || "file"
  const buffer = Buffer.from(await file.arrayBuffer())
  const saved = await saveBufferToStorage({
    buffer,
    folder,
    filenameBase: base,
    extension: ext,
    contentType: file.type || undefined,
  })
  return { url: saved.url, filename: saved.filename }
}

export async function saveBase64Image(
  dataUrl: string,
  folder: UploadFolder,
  prefix = "img",
): Promise<{ url: string; filename: string }> {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) throw new Error("Invalid image data")

  const mime = match[1].toLowerCase()
  if (mime.includes("svg")) {
    throw new Error("SVG logos are not supported. Please upload PNG, JPG, or WEBP.")
  }

  const ext = mime.includes("png") ? ".png" : mime.includes("webp") ? ".webp" : ".jpg"
  const buffer = Buffer.from(match[2], "base64")

  try {
    const saved = await saveBufferToStorage({
      buffer,
      folder,
      filenameBase: prefix,
      extension: ext,
      contentType: mime,
    })
    return { url: saved.url, filename: saved.filename }
  } catch {
    // Serverless / read-only FS (e.g. Vercel): keep data URL so customer create still succeeds
    const maxChars = 900_000
    const url = dataUrl.length > maxChars ? dataUrl.slice(0, maxChars) : dataUrl
    return { url, filename: `${prefix}${ext}` }
  }
}

export async function saveBase64File(
  dataUrl: string,
  folder: UploadFolder,
  prefix = "file",
): Promise<{ url: string; filename: string }> {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) throw new Error("Invalid file data")

  const mime = match[1].toLowerCase()
  const extension =
    mime === "application/pdf"
      ? ".pdf"
      : mime.includes("png")
        ? ".png"
        : mime.includes("webp")
          ? ".webp"
          : mime.includes("jpeg") || mime.includes("jpg")
            ? ".jpg"
            : ".bin"

  try {
    const saved = await saveBufferToStorage({
      buffer: Buffer.from(match[2], "base64"),
      folder,
      filenameBase: prefix,
      extension,
      contentType: mime,
      cacheControl: mime === "application/pdf" ? "public, max-age=604800" : undefined,
    })
    return { url: saved.url, filename: saved.filename }
  } catch {
    const maxChars = 900_000
    const url = dataUrl.length > maxChars ? dataUrl.slice(0, maxChars) : dataUrl
    return { url, filename: `${prefix}${extension}` }
  }
}
