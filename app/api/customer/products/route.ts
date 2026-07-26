import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sql } from "@/lib/db"
import { ensureShopProductsSeeded } from "@/lib/shop"
import { DEFAULT_PRODUCT_COLORS, parseProductColors } from "@/lib/product-colors"

async function loadColorMap() {
  try {
    await sql.query(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "availableColors" TEXT`)
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

export async function GET() {
  try {
    await ensureShopProductsSeeded()
    const [products, colorMap] = await Promise.all([
      prisma.product.findMany({
        where: { active: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      loadColorMap(),
    ])

    return NextResponse.json({
      success: true,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        category: p.category,
        tagline: p.tagline || "",
        buttsRescued: p.buttsRescued,
        imageUrl: p.imageUrl,
        imageGradient: p.imageGradient,
        allowsLogo: p.allowsLogo,
        active: p.active,
        sortOrder: p.sortOrder,
        availableColors: colorMap.get(p.id) || [...DEFAULT_PRODUCT_COLORS],
      })),
    })
  } catch (error) {
    console.error("Customer products error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
