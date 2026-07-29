import { mkdir, writeFile } from "fs/promises"
import path from "path"
import { randomBytes } from "crypto"
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

export type UploadFolder = "products" | "logos" | "attachments"

const LOCAL_UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads")

function sanitizeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120)
}

function trimSlashes(value: string) {
  return value.replace(/^\/+|\/+$/g, "")
}

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID?.trim()
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim()
  const bucket = process.env.R2_BUCKET_NAME?.trim()
  const publicUrl = process.env.R2_PUBLIC_URL?.trim().replace(/\/$/, "")

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    return null
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicUrl,
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  }
}

function getR2Client(config: NonNullable<ReturnType<typeof getR2Config>>) {
  const g = globalThis as typeof globalThis & { __buffR2?: S3Client }
  if (!g.__buffR2) {
    g.__buffR2 = new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    })
  }
  return g.__buffR2
}

function buildObjectKey(folder: UploadFolder, filename: string) {
  return `${trimSlashes(folder)}/${sanitizeSegment(filename)}`
}

async function saveBufferLocally(buffer: Buffer, folder: UploadFolder, filename: string) {
  const dir = path.join(LOCAL_UPLOAD_ROOT, folder)
  await mkdir(dir, { recursive: true })
  const filepath = path.join(dir, filename)
  await writeFile(filepath, buffer)
  return { url: `/uploads/${folder}/${filename}`, filename, key: `${folder}/${filename}`, storage: "local" as const }
}

export function isObjectStorageConfigured() {
  return Boolean(getR2Config())
}

export async function saveBufferToStorage(options: {
  buffer: Buffer
  folder: UploadFolder
  filenameBase: string
  extension: string
  contentType?: string
  cacheControl?: string
}) {
  const ext = options.extension.startsWith(".") ? options.extension : `.${options.extension}`
  const base = sanitizeSegment(options.filenameBase) || "file"
  const filename = `${base}-${randomBytes(6).toString("hex")}${ext.toLowerCase()}`
  const config = getR2Config()

  if (!config) {
    return saveBufferLocally(options.buffer, options.folder, filename)
  }

  const key = buildObjectKey(options.folder, filename)
  const client = getR2Client(config)
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: options.buffer,
      ContentType: options.contentType || "application/octet-stream",
      CacheControl: options.cacheControl || "public, max-age=31536000, immutable",
    }),
  )

  return {
    url: `${config.publicUrl}/${key}`,
    filename,
    key,
    storage: "r2" as const,
  }
}
