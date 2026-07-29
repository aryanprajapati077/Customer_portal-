import { KRAFTREBORN_CATALOG } from "@/lib/kraftreborn-catalog"
import { prisma } from "@/lib/prisma"
import { sql } from "@/lib/db"
import { serializeProductColors } from "@/lib/product-colors"

async function ensureProductExtraColumns() {
  await sql.query(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "availableColors" TEXT`)
  await sql.query(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "originalPrice" DOUBLE PRECISION`)
  await sql.query(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "imageUrls" TEXT`)
}

export async function ensureShopProductsSeeded() {
  await ensureProductExtraColumns()
  const count = await prisma.product.count()
  if (count > 0) return { seeded: false, count }

  for (const p of KRAFTREBORN_CATALOG) {
    const imageUrls = p.sourceImageUrls
    const imageUrl = imageUrls[0] || null
    await prisma.product.create({
      data: {
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        category: p.category,
        tagline: p.tagline,
        buttsRescued: p.buttsRescued,
        imageUrl,
        imageGradient: p.imageGradient,
        allowsLogo: p.allowsLogo,
        active: p.active,
        sortOrder: p.sortOrder,
      },
    })
    await sql`
      UPDATE "Product"
      SET "originalPrice" = ${p.originalPrice},
          "imageUrls" = ${JSON.stringify(imageUrls)},
          "availableColors" = ${serializeProductColors(p.availableColors)},
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${p.id}
    `
  }

  return { seeded: true, count: KRAFTREBORN_CATALOG.length }
}
