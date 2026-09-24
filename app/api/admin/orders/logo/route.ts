import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { readFile } from "fs/promises"
import path from "path"

export const runtime = "nodejs"

function guessExt(contentType: string | null, url: string) {
  const ct = (contentType || "").toLowerCase()
  if (ct.includes("png")) return "png"
  if (ct.includes("webp")) return "webp"
  if (ct.includes("gif")) return "gif"
  if (ct.includes("svg")) return "svg"
  const m = url.toLowerCase().match(/\.(png|jpe?g|webp|gif|svg)(\?|$)/)
  if (m) return m[1] === "jpeg" ? "jpg" : m[1]
  return "jpg"
}

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID?.trim()
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim()
  const bucket = process.env.R2_BUCKET_NAME?.trim()
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null
  const g = globalThis as typeof globalThis & { __buffR2Logo?: S3Client }
  if (!g.__buffR2Logo) {
    g.__buffR2Logo = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    })
  }
  return { client: g.__buffR2Logo, bucket }
}

async function loadLogoBytes(logoUrl: string): Promise<{ bytes: Buffer; contentType: string } | null> {
  const raw = logoUrl.trim()
  if (!raw) return null

  if (raw.startsWith("data:")) {
    const match = raw.match(/^data:([^;]+);base64,(.+)$/)
    if (!match) return null
    return {
      contentType: match[1] || "image/png",
      bytes: Buffer.from(match[2], "base64"),
    }
  }

  // Local upload path
  if (raw.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "public", raw.replace(/^\//, ""))
    try {
      const bytes = await readFile(filePath)
      return { bytes, contentType: "image/jpeg" }
    } catch {
      return null
    }
  }

  // /api/media/products/... or /api/media/logos/...
  const mediaKey = raw.startsWith("/api/media/")
    ? raw.slice("/api/media/".length)
    : raw.match(/^https:\/\/pub-[a-f0-9]+\.r2\.dev\/(.+)$/i)?.[1] ||
      (() => {
        const base = process.env.R2_PUBLIC_URL?.trim().replace(/\/$/, "")
        if (base && raw.startsWith(`${base}/`)) return raw.slice(base.length + 1)
        return null
      })()

  if (mediaKey) {
    const r2 = getR2Client()
    if (r2) {
      try {
        const result = await r2.client.send(
          new GetObjectCommand({ Bucket: r2.bucket, Key: decodeURIComponent(mediaKey) }),
        )
        if (result.Body) {
          const bytes = Buffer.from(await result.Body.transformToByteArray())
          return {
            bytes,
            contentType: result.ContentType || "image/jpeg",
          }
        }
      } catch (error) {
        console.warn("order logo R2 fetch failed:", error)
      }
    }
    const publicBase = process.env.R2_PUBLIC_URL?.trim().replace(/\/$/, "")
    if (publicBase) {
      try {
        const upstream = await fetch(`${publicBase}/${decodeURIComponent(mediaKey)}`)
        if (upstream.ok) {
          return {
            bytes: Buffer.from(await upstream.arrayBuffer()),
            contentType: upstream.headers.get("content-type") || "image/jpeg",
          }
        }
      } catch {
        /* fall through */
      }
    }
  }

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      const upstream = await fetch(raw)
      if (!upstream.ok) return null
      return {
        bytes: Buffer.from(await upstream.arrayBuffer()),
        contentType: upstream.headers.get("content-type") || "image/jpeg",
      }
    } catch {
      return null
    }
  }

  return null
}

/** Download the logo the customer uploaded (or attached) for a shop order. */
export async function GET(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get("orderId")
    if (!orderId) {
      return NextResponse.json({ success: false, error: "orderId required" }, { status: 400 })
    }

    const order = await prisma.shopOrder.findUnique({
      where: { id: orderId },
      select: { orderNumber: true, logoUrl: true, logoRequested: true },
    })

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }
    if (!order.logoUrl) {
      return NextResponse.json(
        { success: false, error: "No logo uploaded for this order" },
        { status: 404 },
      )
    }

    const loaded = await loadLogoBytes(order.logoUrl)
    if (!loaded) {
      return NextResponse.json({ success: false, error: "Could not load logo file" }, { status: 502 })
    }

    const ext = guessExt(loaded.contentType, order.logoUrl)
    const filename = `Order-${order.orderNumber}-logo.${ext}`

    return new NextResponse(new Uint8Array(loaded.bytes), {
      headers: {
        "Content-Type": loaded.contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, max-age=60",
      },
    })
  } catch (error) {
    console.error("Order logo download error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
