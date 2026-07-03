import { KRAFTREBORN_PRODUCTS } from "@/lib/kraftreborn-products"
import { prisma } from "@/lib/prisma"

export { formatOrderNumber, ORDER_STATUSES, orderStatusLabel, orderStatusColor } from "@/lib/shop-constants"
export type { OrderStatus } from "@/lib/shop-constants"

export async function ensureShopProductsSeeded() {
  const count = await prisma.product.count()
  if (count > 0) return { seeded: false, count }

  for (let i = 0; i < KRAFTREBORN_PRODUCTS.length; i++) {
    const p = KRAFTREBORN_PRODUCTS[i]
    await prisma.product.create({
      data: {
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        category: p.category,
        tagline: p.tagline,
        buttsRescued: p.buttsRescued,
        imageGradient: p.imageGradient,
        allowsLogo: p.category === "elegant-combos" || p.category === "gifting",
        active: true,
        sortOrder: i,
      },
    })
  }

  return { seeded: true, count: KRAFTREBORN_PRODUCTS.length }
}
