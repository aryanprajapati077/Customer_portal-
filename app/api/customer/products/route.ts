import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sql } from "@/lib/db"
import { ensureShopProductsSeeded } from "@/lib/shop"
import { DEFAULT_PRODUCT_COLORS, parseProductColors } from "@/lib/product-colors"

async function loadProductMetaMap() {
  try {
    await sql.query(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "availableColors" TEXT`)
    await sql.query(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "originalPrice" DOUBLE PRECISION`)
    await sql.query(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "imageUrls" TEXT`)
    const rows = await sql`SELECT id, "availableColors", "originalPrice", "imageUrl", "imageUrls" FROM "Product"`
    const map = new Map<string, { availableColors: string[]; originalPrice: number | null; imageUrls: string[] }>()
    for (const row of rows as {
      id: string
      availableColors?: string | null
      originalPrice?: number | null
      imageUrl?: string | null
      imageUrls?: string | null
    }[]) {
      let images: string[] = []
      try {
        const parsed = row.imageUrls ? JSON.parse(row.imageUrls) : []
        if (Array.isArray(parsed)) images = parsed.filter((url): url is string => typeof url === "string" && Boolean(url.trim()))
      } catch {}
      if (row.imageUrl && !images.includes(row.imageUrl)) images.unshift(row.imageUrl)
      map.set(row.id, {
        availableColors: parseProductColors(row.availableColors),
        originalPrice: row.originalPrice ?? null,
        imageUrls: images,
      })
    }
    return map
  } catch {
    return new Map<string, { availableColors: string[]; originalPrice: number | null; imageUrls: string[] }>()
  }
}

export async function GET() {
  try {
    await ensureShopProductsSeeded()
    const [products, metaMap] = await Promise.all([
      prisma.product.findMany({
        where: { active: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      loadProductMetaMap(),
    ])

    return NextResponse.json({
      success: true,
      products: products.map((p) => {
        const meta = metaMap.get(p.id)
        const imageUrls = meta?.imageUrls?.length ? meta.imageUrls : p.imageUrl ? [p.imageUrl] : []
        return {
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          originalPrice: meta?.originalPrice ?? null,
          category: p.category,
          tagline: p.tagline || "",
          buttsRescued: p.buttsRescued,
          imageUrl: imageUrls[0] || p.imageUrl,
          imageUrls,
          imageGradient: p.imageGradient,
          allowsLogo: p.allowsLogo,
          active: p.active,
          sortOrder: p.sortOrder,
          availableColors: meta?.availableColors || [...DEFAULT_PRODUCT_COLORS],
        }
      }),
    })
  } catch (error) {
    console.error("Customer products error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
