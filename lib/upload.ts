import { mkdir, writeFile } from "fs/promises"
import path from "path"
import { randomBytes } from "crypto"

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads")

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9.-]/g, "_").slice(0, 80)
}

export async function saveUploadedFile(
  file: File,
  folder: "products" | "logos",
): Promise<{ url: string; filename: string }> {
  const dir = path.join(UPLOAD_ROOT, folder)
  await mkdir(dir, { recursive: true })

  const ext = path.extname(file.name) || ".jpg"
  const base = sanitizeFilename(path.basename(file.name, ext)) || "file"
  const filename = `${base}-${randomBytes(4).toString("hex")}${ext}`
  const filepath = path.join(dir, filename)

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filepath, buffer)

  return { url: `/uploads/${folder}/${filename}`, filename }
}

export async function saveBase64Image(
  dataUrl: string,
  folder: "products" | "logos",
  prefix = "img",
): Promise<{ url: string; filename: string }> {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) throw new Error("Invalid image data")

  const mime = match[1].toLowerCase()
  if (mime.includes("svg")) {
    throw new Error("SVG logos are not supported. Please upload PNG, JPG, or WEBP.")
  }

  const ext = mime.includes("png") ? ".png" : mime.includes("webp") ? ".webp" : ".jpg"
  const filename = `${prefix}-${randomBytes(6).toString("hex")}${ext}`

  try {
    const dir = path.join(UPLOAD_ROOT, folder)
    await mkdir(dir, { recursive: true })
    const filepath = path.join(dir, filename)
    await writeFile(filepath, Buffer.from(match[2], "base64"))
    return { url: `/uploads/${folder}/${filename}`, filename }
  } catch {
    // Serverless / read-only FS (e.g. Vercel): keep data URL so customer create still succeeds
    const maxChars = 900_000
    const url = dataUrl.length > maxChars ? dataUrl.slice(0, maxChars) : dataUrl
    return { url, filename }
  }
}
