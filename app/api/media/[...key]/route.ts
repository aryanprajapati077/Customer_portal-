import { GetObjectCommand } from "@aws-sdk/client-s3"
import { type NextRequest, NextResponse } from "next/server"
import { parseMediaKey, r2PublicUrlForKey } from "@/lib/media-url"

export const runtime = "nodejs"

function getR2ClientConfig() {
  const accountId = process.env.R2_ACCOUNT_ID?.trim()
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim()
  const bucket = process.env.R2_BUCKET_NAME?.trim()
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null
  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  }
}

async function fetchFromR2Sdk(key: string): Promise<Response | null> {
  const config = getR2ClientConfig()
  if (!config) return null

  const { S3Client } = await import("@aws-sdk/client-s3")
  const g = globalThis as typeof globalThis & { __buffR2Media?: InstanceType<typeof S3Client> }
  if (!g.__buffR2Media) {
    g.__buffR2Media = new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    })
  }

  try {
    const result = await g.__buffR2Media.send(
      new GetObjectCommand({
        Bucket: config.bucket,
        Key: key,
      }),
    )
    if (!result.Body) return null
    const bytes = await result.Body.transformToByteArray()
    return new Response(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": result.ContentType || guessContentType(key),
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        "Content-Length": String(bytes.byteLength),
      },
    })
  } catch (error) {
    console.warn("[media] R2 GetObject failed:", key, error)
    return null
  }
}

async function fetchFromPublicUrl(key: string): Promise<Response | null> {
  const url = r2PublicUrlForKey(key)
  if (!url) return null
  try {
    const upstream = await fetch(url, {
      headers: { Accept: "image/*,*/*" },
      // Server-side fetch is not blocked by hotel firewalls.
      cache: "force-cache",
      next: { revalidate: 60 * 60 * 24 * 7 },
    } as RequestInit)
    if (!upstream.ok) return null
    const buf = Buffer.from(await upstream.arrayBuffer())
    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || guessContentType(key),
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        "Content-Length": String(buf.byteLength),
      },
    })
  } catch (error) {
    console.warn("[media] public R2 fetch failed:", key, error)
    return null
  }
}

function guessContentType(key: string) {
  const lower = key.toLowerCase()
  if (lower.endsWith(".png")) return "image/png"
  if (lower.endsWith(".webp")) return "image/webp"
  if (lower.endsWith(".gif")) return "image/gif"
  if (lower.endsWith(".svg")) return "image/svg+xml"
  if (lower.endsWith(".pdf")) return "application/pdf"
  return "image/jpeg"
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ key: string[] }> | { key: string[] } },
) {
  const params = await Promise.resolve(context.params)
  const key = parseMediaKey(params.key || [])
  if (!key) {
    return NextResponse.json({ success: false, error: "Invalid media path" }, { status: 400 })
  }

  const fromSdk = await fetchFromR2Sdk(key)
  if (fromSdk) return fromSdk

  const fromPublic = await fetchFromPublicUrl(key)
  if (fromPublic) return fromPublic

  return NextResponse.json({ success: false, error: "Media not found" }, { status: 404 })
}
