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

async function ensureProductColorColumn() {
  await sql.query(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "availableColors" TEXT`)
}

async function loadColorMap() {
  try {
    await ensureProductColorColumn()
    const rows = await sql`SELECT id, "availableColors" FROM "Product"`
    const map = new Map<string, string[]>()
    for (const row of rows as { id: string; availableColors?: string | null }[]) {
      map.set(row.id, parseProductColors(row.availableColors))
    }
    return map
  } catch {
    return new Map<string, string[]>()
  }
}

async function setProductColors(id: string, raw: unknown) {
  await ensureProductColorColumn()
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

function formatProduct(
  p: {
    id: string
    name: string
    description: string
    price: number
    category: string
    tagline: string | null
    buttsRescued: number
    imageUrl: string | null
    imageGradient: string
    allowsLogo: boolean
    active: boolean
    sortOrder: number
    createdAt: Date
    updatedAt: Date
  },
  availableColors: string[],
) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    category: p.category,
    tagline: p.tagline,
    buttsRescued: p.buttsRescued,
    imageUrl: p.imageUrl,
    imageGradient: p.imageGradient,
    allowsLogo: p.allowsLogo,
    active: p.active,
    sortOrder: p.sortOrder,
    availableColors,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }
}

export async function GET() {
  try {
    await ensureShopProductsSeeded()
    const [products, colorMap] = await Promise.all([
      prisma.product.findMany({
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      loadColorMap(),
    ])
    return NextResponse.json({
      success: true,
      products: products.map((p) =>
        formatProduct(p, colorMap.get(p.id) || [...DEFAULT_PRODUCT_COLORS]),
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
      const file = form.get("image") as File | null
      let imageUrl: string | null = null
      if (file && file.size > 0) {
        const saved = await saveUploadedFile(file, "products")
        imageUrl = saved.url
      }

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

      const availableColors = await setProductColors(product.id, form.get("availableColors"))
      return NextResponse.json({ success: true, product: formatProduct(product, availableColors) })
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

    const availableColors = await setProductColors(product.id, body.availableColors)
    return NextResponse.json({ success: true, product: formatProduct(product, availableColors) })
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

      const file = form.get("image") as File | null
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

      if (file && file.size > 0) {
        const saved = await saveUploadedFile(file, "products")
        data.imageUrl = saved.url
      }

      const product = await prisma.product.update({ where: { id }, data })
      const availableColors = await setProductColors(id, form.get("availableColors"))
      return NextResponse.json({ success: true, product: formatProduct(product, availableColors) })
    }

    const body = await request.json()
    const id = String(body.id || "")
    if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 })

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
        imageUrl: body.imageUrl,
      },
    })

    const availableColors = await setProductColors(id, body.availableColors)
    return NextResponse.json({ success: true, product: formatProduct(product, availableColors) })
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
