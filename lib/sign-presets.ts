import { randomBytes } from "crypto"
import sharp from "sharp"
import { sql } from "@/lib/db"
import { deleteStoredObject, readStoredObject, saveBufferToStorage } from "@/lib/object-storage"
import { clearLogoBackground } from "@/lib/logo-background"

export type SignPreset = {
  id: string
  name: string
  imageKey: string
  imageUrl: string
  width: number
  height: number
  slotX: number
  slotY: number
  slotW: number
  slotH: number
  kind: "preset" | "mockup" | "layered"
  defaultChildIds: string[]
  createdAt: string
}

export type SignLogo = {
  id: string
  name: string
  imageKey: string
  imageUrl: string
  createdAt: string
}

function generateId(prefix: string) {
  return `${prefix}${Date.now().toString(36)}${randomBytes(4).toString("hex")}`.slice(0, 24)
}

let tablesReady: Promise<void> | null = null

export async function ensurePresetTables() {
  if (!tablesReady) {
    tablesReady = (async () => {
      await sql.query(`
        CREATE TABLE IF NOT EXISTS "SignPreset" (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          "imageKey" TEXT NOT NULL,
          "imageUrl" TEXT NOT NULL,
          width INTEGER NOT NULL,
          height INTEGER NOT NULL,
          "slotX" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
          "slotY" DOUBLE PRECISION NOT NULL DEFAULT 0.04,
          "slotW" DOUBLE PRECISION NOT NULL DEFAULT 0.24,
          "slotH" DOUBLE PRECISION NOT NULL DEFAULT 0.16,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `)
      await sql.query(`ALTER TABLE "SignPreset" ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'preset'`)
      await sql.query(`ALTER TABLE "SignPreset" ADD COLUMN IF NOT EXISTS "defaultChildIds" TEXT NOT NULL DEFAULT '[]'`)
      await sql.query(`
        CREATE TABLE IF NOT EXISTS "SignLogo" (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          "imageKey" TEXT NOT NULL,
          "imageUrl" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `)
    })().catch((err) => {
      tablesReady = null
      throw err
    })
  }
  await tablesReady
}

const PRESET_COLUMNS = `id, name, "imageKey", "imageUrl", width, height,
  "slotX", "slotY", "slotW", "slotH", kind, "defaultChildIds", "createdAt"`

type PresetRow = Omit<SignPreset, "defaultChildIds"> & { defaultChildIds: string | string[] | null }

function parseIds(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String)
  if (typeof value !== "string" || !value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

function toPreset(row: PresetRow): SignPreset {
  return { ...row, defaultChildIds: parseIds(row.defaultChildIds) }
}

export async function listPresets(kind: SignPreset["kind"] = "preset"): Promise<SignPreset[]> {
  await ensurePresetTables()
  const rows = (await sql.query(
    `SELECT ${PRESET_COLUMNS} FROM "SignPreset" WHERE kind = $1 ORDER BY "createdAt" DESC`,
    [kind],
  )) as PresetRow[]
  return rows.map(toPreset)
}

export async function listLogos(): Promise<SignLogo[]> {
  await ensurePresetTables()
  return sql`
    SELECT id, name, "imageKey", "imageUrl", "createdAt"
    FROM "SignLogo"
    ORDER BY "createdAt" DESC
  `
}

function clampSlot(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

/** Keeps the uploaded pixels untouched; only bakes in EXIF rotation when needed. */
async function keepOriginal(file: Buffer) {
  const meta = await sharp(file, { failOn: "none" }).metadata()
  const format = meta.format === "png" || meta.format === "webp" || meta.format === "jpeg" ? meta.format : null
  if (format && (!meta.orientation || meta.orientation === 1)) {
    return { buffer: file, extension: format === "jpeg" ? "jpg" : format, contentType: `image/${format}` }
  }
  const buffer = await sharp(file, { failOn: "none" }).rotate().png({ compressionLevel: 6 }).toBuffer()
  return { buffer, extension: "png", contentType: "image/png" }
}

export async function createPreset(file: Buffer, name: string, kind: SignPreset["kind"] = "preset") {
  await ensurePresetTables()
  // Displays have a solid black "window" where the location photo shows: make it see-through.
  const source =
    kind === "layered" ? await clearLogoBackground(file, { bg: [0, 0, 0], hard: 26, soft: 70, trim: false }) : file
  const prepared = await keepOriginal(source)
  const meta = await sharp(prepared.buffer, { failOn: "none" }).metadata()
  const stored = await saveBufferToStorage({
    buffer: prepared.buffer,
    folder: "presets",
    filenameBase: name || kind,
    extension: prepared.extension,
    contentType: prepared.contentType,
  })
  const id = generateId(kind === "mockup" ? "sm" : kind === "layered" ? "sd" : "sp")
  const now = new Date().toISOString()
  const rows = (await sql.query(
    `INSERT INTO "SignPreset" (
       id, name, "imageKey", "imageUrl", width, height,
       "slotX", "slotY", "slotW", "slotH", kind, "defaultChildIds", "createdAt", "updatedAt"
     ) VALUES ($1,$2,$3,$4,$5,$6,0.7,0.04,0.24,0.16,$7,'[]',$8,$8)
     RETURNING ${PRESET_COLUMNS}`,
    [id, name || (kind === "mockup" ? "Mockup" : kind === "layered" ? "Display" : "Preset"), stored.key, stored.url, meta.width || 0, meta.height || 0, kind, now],
  )) as PresetRow[]
  return rows[0] ? toPreset(rows[0]) : null
}

export async function updatePresetSlot(
  id: string,
  slot: {
    name?: string
    slotX: number
    slotY: number
    slotW: number
    slotH: number
    defaultChildIds?: string[]
  },
) {
  await ensurePresetTables()
  const slotX = clampSlot(slot.slotX, 0, 0.95)
  const slotY = clampSlot(slot.slotY, 0, 0.95)
  const slotW = clampSlot(slot.slotW, 0.02, 1 - slotX)
  const slotH = clampSlot(slot.slotH, 0.02, 1 - slotY)
  const name = slot.name?.trim() || null
  const defaults = slot.defaultChildIds ? JSON.stringify(slot.defaultChildIds.map(String)) : null
  const rows = (await sql.query(
    `UPDATE "SignPreset"
     SET name = COALESCE($2, name), "slotX" = $3, "slotY" = $4, "slotW" = $5, "slotH" = $6,
         "defaultChildIds" = COALESCE($7, "defaultChildIds"), "updatedAt" = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING ${PRESET_COLUMNS}`,
    [id, name, slotX, slotY, slotW, slotH, defaults],
  )) as PresetRow[]
  return rows[0] ? toPreset(rows[0]) : null
}

export async function deletePreset(id: string) {
  await ensurePresetTables()
  const rows = await sql<{ imageKey: string }>`
    SELECT "imageKey" FROM "SignPreset" WHERE id = ${id} LIMIT 1
  `
  if (!rows[0]) return false
  await sql`DELETE FROM "SignPreset" WHERE id = ${id}`
  await deleteStoredObject(rows[0].imageKey)
  return true
}

export async function createLogo(file: Buffer, name: string) {
  await ensurePresetTables()
  const cleared = await clearLogoBackground(file)
  // Everything is delivered in 4K: smaller logos are upscaled (Lanczos) so the transparent PNG is at least 3840px.
  const clearedMeta = await sharp(cleared).metadata()
  const longEdge = Math.max(clearedMeta.width || 0, clearedMeta.height || 0)
  const upscaled =
    longEdge > 0 && longEdge < 3840
      ? await sharp(cleared)
          .resize({ width: 3840, height: 3840, fit: "inside", kernel: "lanczos3" })
          .png({ compressionLevel: 6 })
          .toBuffer()
      : cleared
  const stored = await saveBufferToStorage({
    buffer: upscaled,
    folder: "preset-logos",
    filenameBase: name || "logo",
    extension: "png",
    contentType: "image/png",
  })
  const id = generateId("sl")
  const now = new Date().toISOString()
  const rows = await sql<SignLogo>`
    INSERT INTO "SignLogo" (id, name, "imageKey", "imageUrl", "createdAt")
    VALUES (${id}, ${name || "Logo"}, ${stored.key}, ${stored.url}, ${now})
    RETURNING id, name, "imageKey", "imageUrl", "createdAt"
  `
  return rows[0]
}

export async function deleteLogo(id: string) {
  await ensurePresetTables()
  const rows = await sql<{ imageKey: string }>`
    SELECT "imageKey" FROM "SignLogo" WHERE id = ${id} LIMIT 1
  `
  if (!rows[0]) return false
  await sql`DELETE FROM "SignLogo" WHERE id = ${id}`
  await deleteStoredObject(rows[0].imageKey)
  return true
}

// ---------------------------------------------------------------------------
// History (7 days) + approval into a client folder

export type SignHistory = {
  id: string
  title: string
  imageKey: string
  imageUrl: string
  thumbKey: string
  thumbUrl: string
  status: "draft" | "approved"
  clientId: string | null
  finalUrl: string | null
  createdAt: string
}

export const HISTORY_DAYS = 7

let historyReady: Promise<void> | null = null

async function ensureHistoryTable() {
  if (!historyReady) {
    historyReady = (async () => {
      await sql.query(`
        CREATE TABLE IF NOT EXISTS "SignHistory" (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          "imageKey" TEXT NOT NULL,
          "imageUrl" TEXT NOT NULL,
          "thumbKey" TEXT NOT NULL,
          "thumbUrl" TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'draft',
          "clientId" TEXT,
          "finalUrl" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `)
    })().catch((err) => {
      historyReady = null
      throw err
    })
  }
  await historyReady
}

const HISTORY_COLUMNS = `id, title, "imageKey", "imageUrl", "thumbKey", "thumbUrl", status, "clientId", "finalUrl", "createdAt"`

/** Client IDs become R2 folder names: BIS-prefixed, upper-case, letters/digits/-/_ only. */
export function normalizeClientId(value: string) {
  const cleaned = value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "")
  if (!cleaned) return ""
  return cleaned.startsWith("BIS") ? cleaned : `BIS${cleaned}`
}

async function purgeExpiredHistory() {
  const cutoff = new Date(Date.now() - HISTORY_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const old = (await sql.query(
    `DELETE FROM "SignHistory" WHERE "createdAt" < $1 RETURNING "imageKey", "thumbKey"`,
    [cutoff],
  )) as { imageKey: string; thumbKey: string }[]
  for (const row of old) {
    await deleteStoredObject(row.imageKey)
    await deleteStoredObject(row.thumbKey)
  }
}

export async function listHistory(): Promise<SignHistory[]> {
  await ensureHistoryTable()
  await purgeExpiredHistory().catch((err) => console.error("history purge:", err))
  return (await sql.query(
    `SELECT ${HISTORY_COLUMNS} FROM "SignHistory" ORDER BY "createdAt" DESC LIMIT 300`,
  )) as SignHistory[]
}

async function saveHistoryFiles(png: Buffer, title: string) {
  const thumb = await sharp(png, { failOn: "none" })
    .resize({ width: 700, height: 700, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer()
  const image = await saveBufferToStorage({
    buffer: png,
    folder: "preset-history",
    filenameBase: title || "design",
    extension: "png",
    contentType: "image/png",
  })
  const small = await saveBufferToStorage({
    buffer: thumb,
    folder: "preset-history",
    filenameBase: `${title || "design"}-thumb`,
    extension: "jpg",
    contentType: "image/jpeg",
  })
  return { image, small }
}

/** Save a rendered design; with a client ID it is approved and filed under that client's folder right away. */
export async function addHistory(png: Buffer, title: string, clientId?: string) {
  await ensureHistoryTable()
  const { image, small } = await saveHistoryFiles(png, title)
  const id = generateId("sh")
  const client = clientId ? normalizeClientId(clientId) : ""
  let finalUrl: string | null = null
  if (client) {
    const finalFile = await saveBufferToStorage({
      buffer: png,
      folder: client,
      filenameBase: title || "design",
      extension: "png",
      contentType: "image/png",
    })
    finalUrl = finalFile.url
  }
  const rows = (await sql.query(
    `INSERT INTO "SignHistory" (id, title, "imageKey", "imageUrl", "thumbKey", "thumbUrl", status, "clientId", "finalUrl")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING ${HISTORY_COLUMNS}`,
    [id, title || "Design", image.key, image.url, small.key, small.url, client ? "approved" : "draft", client || null, finalUrl],
  )) as SignHistory[]
  return rows[0]
}

export async function approveHistory(id: string, clientId: string) {
  await ensureHistoryTable()
  const client = normalizeClientId(clientId)
  if (!client) return null
  const rows = (await sql.query(`SELECT ${HISTORY_COLUMNS} FROM "SignHistory" WHERE id = $1 LIMIT 1`, [id])) as SignHistory[]
  const entry = rows[0]
  if (!entry) return null
  const png = await readStoredObject(entry.imageKey)
  const finalFile = await saveBufferToStorage({
    buffer: png,
    folder: client,
    filenameBase: entry.title,
    extension: "png",
    contentType: "image/png",
  })
  const updated = (await sql.query(
    `UPDATE "SignHistory" SET status = 'approved', "clientId" = $2, "finalUrl" = $3 WHERE id = $1 RETURNING ${HISTORY_COLUMNS}`,
    [id, client, finalFile.url],
  )) as SignHistory[]
  return updated[0] || null
}

export async function deleteHistory(id: string) {
  await ensureHistoryTable()
  const rows = (await sql.query(`DELETE FROM "SignHistory" WHERE id = $1 RETURNING "imageKey", "thumbKey"`, [id])) as {
    imageKey: string
    thumbKey: string
  }[]
  if (!rows[0]) return false
  await deleteStoredObject(rows[0].imageKey)
  await deleteStoredObject(rows[0].thumbKey)
  return true
}
