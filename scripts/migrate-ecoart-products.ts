/**
 * Migrate KraftReborn products into the database + Cloudflare R2.
 *
 * Usage: npx tsx scripts/migrate-ecoart-products.ts
 * Requires DATABASE_URL and R2_* env vars (falls back to source URLs if R2 missing).
 */

import "dotenv/config"
import { KRAFTREBORN_CATALOG } from "../lib/kraftreborn-catalog"
import { prisma } from "../lib/prisma"
import { sql } from "../lib/db"
import { saveBufferToStorage, isObjectStorageConfigured } from "../lib/object-storage"
import { serializeProductColors } from "../lib/product-colors"

const STORE_BANNER = "cm7sl6yki000503l2fupx6ztp"

async function ensureProductExtraColumns() {
  await sql.query(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "availableColors" TEXT`)
  await sql.query(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "originalPrice" DOUBLE PRECISION`)
  await sql.query(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "imageUrls" TEXT`)
}

async function downloadImage(url: string): Promise<{ buffer: Buffer; ext: string; contentType: string }> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed ${url}: ${res.status}`)
  const contentType = res.headers.get("content-type") || "image/jpeg"
  const ext = url.match(/\.(jpe?g|png|webp)$/i)?.[1]?.toLowerCase() || "jpg"
  const buffer = Buffer.from(await res.arrayBuffer())
  return { buffer, ext: ext === "jpeg" ? "jpg" : ext, contentType }
}

async function mirrorImage(url: string, productId: string, index: number): Promise<string> {
  if (url.includes(STORE_BANNER)) return ""
  if (!isObjectStorageConfigured()) return url

  const { buffer, ext, contentType } = await downloadImage(url)
  const saved = await saveBufferToStorage({
    buffer,
    folder: "products",
    filenameBase: `${productId}-${index}`,
    extension: `.${ext}`,
    contentType,
  })
  return saved.url
}

async function mirrorImages(productId: string, urls: string[]): Promise<string[]> {
  const mirrored: string[] = []
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]
    if (!url || url.includes(STORE_BANNER)) continue
    try {
      const stored = await mirrorImage(url, productId, i)
      if (stored) mirrored.push(stored)
      console.log(`  ✓ image ${i + 1}/${urls.length}`)
    } catch (err) {
      console.warn(`  ⚠ kept source URL for image ${i + 1}:`, err instanceof Error ? err.message : err)
      mirrored.push(url)
    }
    await new Promise((r) => setTimeout(r, 150))
  }
  return mirrored
}

async function main() {
  console.log(`KraftReborn migration — ${KRAFTREBORN_CATALOG.length} products`)
  console.log(`R2 configured: ${isObjectStorageConfigured()}`)

  await ensureProductExtraColumns()

  const deleted = await prisma.product.deleteMany()
  console.log(`Removed ${deleted.count} existing products`)

  for (const p of KRAFTREBORN_CATALOG) {
    console.log(`\n→ ${p.name}`)
    const imageUrls = await mirrorImages(p.id, p.sourceImageUrls)
    const imageUrl = imageUrls[0] || p.sourceImageUrls[0] || null

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

  const count = await prisma.product.count()
  console.log(`\nDone — ${count} KraftReborn products in database`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
