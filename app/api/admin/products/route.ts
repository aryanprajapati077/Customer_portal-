import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sql } from "@/lib/db"
import { ensureShopProductsSeeded } from "@/lib/shop"
import { saveUploadedFile } from "@/lib/upload"
import {
  DEFAULT_PRODUCT_COLORS,
  parseProductColors,
  serializeProductColors,
} from "@/lib/product-colors"

async function ensureProductExtraColumns() {
  await sql.query(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "availableColors" TEXT`)
  await sql.query(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "originalPrice" DOUBLE PRECISION`)
  await sql.query(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "imageUrls" TEXT`)
}

function parseProductImages(raw?: string | null, fallback?: string | null) {
  const urls: string[] = []
  try {
    const parsed = raw ? JSON.parse(raw) : []
    if (Array.isArray(parsed)) {
      for (const url of parsed) {
        if (typeof url === "string" && url.trim()) urls.push(url.trim())
      }
    }
  } catch {}
  if (fallback && !urls.includes(fallback)) urls.unshift(fallback)
  return urls
}

function serializeProductImages(urls: string[]) {
  return JSON.stringify(Array.from(new Set(urls.map((u) => u.trim()).filter(Boolean))))
}

function parseOptionalPrice(raw: unknown) {
  if (raw === null || raw === undefined || raw === "") return null
  const price = Number(raw)
  return Number.isFinite(price) && price > 0 ? price : null
}

async function saveProductFiles(files: File[]) {
  const urls: string[] = []
  for (const file of files) {
    if (file && file.size > 0) {
      const saved = await saveUploadedFile(file, "products")
      urls.push(saved.url)
    }
  }
  return urls
}

async function loadProductMetaMap() {
  try {
    await ensureProductExtraColumns()
    const rows = await sql`SELECT id, "availableColors", "originalPrice", "imageUrl", "imageUrls" FROM "Product"`
    const map = new Map<string, { availableColors: string[]; originalPrice: number | null; imageUrls: string[] }>()
    for (const row of rows as {
      id: string
      availableColors?: string | null
      originalPrice?: number | null
      imageUrl?: string | null
      imageUrls?: string | null
    }[]) {
      map.set(row.id, {
        availableColors: parseProductColors(row.availableColors),
        originalPrice: row.originalPrice ?? null,
        imageUrls: parseProductImages(row.imageUrls, row.imageUrl),
      })
    }
    return map
  } catch {
    return new Map<string, { availableColors: string[]; originalPrice: number | null; imageUrls: string[] }>()
  }
}

async function setProductColors(id: string, raw: unknown) {
  await ensureProductExtraColumns()
  let colors = [...DEFAULT_PRODUCT_COLORS] as string[]
  if (typeof raw === "string") {
    try {
      colors = parseProductColors(raw.startsWith("[") ? raw : JSON.stringify(String(raw).split(",")))
    } catch {
      colors = parseProductColors(null)
    }
  } else if (Array.isArray(raw)) {
    colors = parseProductColors(JSON.stringify(raw))
  }
  const serialized = serializeProductColors(colors)
  await sql`
    UPDATE "Product"
    SET "availableColors" = ${serialized}, "updatedAt" = CURRENT_TIMESTAMP
    WHERE id = ${id}
  `
  return colors
}

async function setProductMeta(id: string, rawColors: unknown, originalPrice: unknown, imageUrls: string[]) {
  const colors = await setProductColors(id, rawColors)
  const serializedImages = serializeProductImages(imageUrls)
  const parsedOriginalPrice = parseOptionalPrice(originalPrice)
  await sql`
    UPDATE "Product"
    SET "originalPrice" = ${parsedOriginalPrice}, "imageUrls" = ${serializedImages}, "updatedAt" = CURRENT_TIMESTAMP
    WHERE id = ${id}
  `
  return { availableColors: colors, originalPrice: parsedOriginalPrice, imageUrls: parseProductImages(serializedImages) }
}

function formatProduct(
  p: {
    id: string
    name: string
    description: string
    price: number
    originalPrice?: number | null
    category: string
    tagline: string | null
    buttsRescued: number
    imageUrl: string | null
    imageUrls?: string | null
    imageGradient: string
    allowsLogo: boolean
    active: boolean
    sortOrder: number
    createdAt: Date
    updatedAt: Date
  },
  meta: { availableColors: string[]; originalPrice?: number | null; imageUrls?: string[] },
) {
  const imageUrls = meta.imageUrls?.length ? meta.imageUrls : parseProductImages(p.imageUrls, p.imageUrl)
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    originalPrice: meta.originalPrice ?? p.originalPrice ?? null,
    category: p.category,
    tagline: p.tagline,
    buttsRescued: p.buttsRescued,
    imageUrl: imageUrls[0] || p.imageUrl,
    imageUrls,
    imageGradient: p.imageGradient,
    allowsLogo: p.allowsLogo,
    active: p.active,
    sortOrder: p.sortOrder,
    availableColors: meta.availableColors,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }
}

export async function GET() {
  try {
    await ensureShopProductsSeeded()
    const [products, metaMap] = await Promise.all([
      prisma.product.findMany({
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      loadProductMetaMap(),
    ])
    return NextResponse.json({
      success: true,
      products: products.map((p) =>
        formatProduct(
          p,
          metaMap.get(p.id) || {
            availableColors: [...DEFAULT_PRODUCT_COLORS],
            originalPrice: null,
            imageUrls: parseProductImages(null, p.imageUrl),
          },
        ),
      ),
    })
  } catch (error) {
    console.error("Admin products GET error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || ""

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData()
      const uploadedUrls = await saveProductFiles([
        ...form.getAll("images"),
        form.get("image"),
      ].filter((file): file is File => file instanceof File))
      const imageUrl = uploadedUrls[0] || null

      const product = await prisma.product.create({
        data: {
          name: String(form.get("name") || ""),
          description: String(form.get("description") || ""),
          price: Number(form.get("price")) || 0,
          category: String(form.get("category") || "elegant-combos"),
          tagline: form.get("tagline") ? String(form.get("tagline")) : null,
          buttsRescued: Number(form.get("buttsRescued")) || 40,
          imageGradient: String(form.get("imageGradient") || "from-amber-100 via-stone-200 to-emerald-100"),
          allowsLogo: form.get("allowsLogo") === "true",
          active: form.get("active") !== "false",
          sortOrder: Number(form.get("sortOrder")) || 0,
          imageUrl,
        },
      })

      const meta = await setProductMeta(product.id, form.get("availableColors"), form.get("originalPrice"), uploadedUrls)
      return NextResponse.json({ success: true, product: formatProduct(product, meta) })
    }

    const body = await request.json()
    const product = await prisma.product.create({
      data: {
        name: String(body.name || ""),
        description: String(body.description || ""),
        price: Number(body.price) || 0,
        category: String(body.category || "elegant-combos"),
        tagline: body.tagline || null,
        buttsRescued: Number(body.buttsRescued) || 40,
        imageGradient: body.imageGradient || "from-amber-100 via-stone-200 to-emerald-100",
        allowsLogo: Boolean(body.allowsLogo),
        active: body.active !== false,
        sortOrder: Number(body.sortOrder) || 0,
        imageUrl: body.imageUrl || null,
      },
    })

    const imageUrls = parseProductImages(JSON.stringify(body.imageUrls || []), body.imageUrl || null)
    const meta = await setProductMeta(product.id, body.availableColors, body.originalPrice, imageUrls)
    return NextResponse.json({ success: true, product: formatProduct(product, meta) })
  } catch (error) {
    console.error("Admin products POST error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || ""

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData()
      const id = String(form.get("id") || "")
      if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 })

      const existingImageUrls = parseProductImages(String(form.get("existingImageUrls") || "[]"))
      const uploadedUrls = await saveProductFiles([
        ...form.getAll("images"),
        form.get("image"),
      ].filter((file): file is File => file instanceof File))
      const imageUrls = [...existingImageUrls, ...uploadedUrls]
      const data: Record<string, unknown> = {
        name: String(form.get("name") || ""),
        description: String(form.get("description") || ""),
        price: Number(form.get("price")) || 0,
        category: String(form.get("category") || "elegant-combos"),
        tagline: form.get("tagline") ? String(form.get("tagline")) : null,
        buttsRescued: Number(form.get("buttsRescued")) || 40,
        imageGradient: String(form.get("imageGradient") || "from-amber-100 via-stone-200 to-emerald-100"),
        allowsLogo: form.get("allowsLogo") === "true",
        active: form.get("active") !== "false",
        sortOrder: Number(form.get("sortOrder")) || 0,
      }

      data.imageUrl = imageUrls[0] || null

      const product = await prisma.product.update({ where: { id }, data })
      const meta = await setProductMeta(id, form.get("availableColors"), form.get("originalPrice"), imageUrls)
      return NextResponse.json({ success: true, product: formatProduct(product, meta) })
    }

    const body = await request.json()
    const id = String(body.id || "")
    if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 })

    const imageUrls = parseProductImages(JSON.stringify(body.imageUrls || []), body.imageUrl || null)
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        price: Number(body.price),
        category: body.category,
        tagline: body.tagline,
        buttsRescued: Number(body.buttsRescued),
        imageGradient: body.imageGradient,
        allowsLogo: Boolean(body.allowsLogo),
        active: Boolean(body.active),
        sortOrder: Number(body.sortOrder),
        imageUrl: imageUrls[0] || body.imageUrl,
      },
    })

    const meta = await setProductMeta(id, body.availableColors, body.originalPrice, imageUrls)
    return NextResponse.json({ success: true, product: formatProduct(product, meta) })
  } catch (error) {
    console.error("Admin products PUT error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 })

    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin products DELETE error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
