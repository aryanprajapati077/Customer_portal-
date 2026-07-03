import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ensureShopProductsSeeded } from "@/lib/shop"

function formatProduct(p: {
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
}) {
  return {
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
  }
}

export async function GET() {
  try {
    await ensureShopProductsSeeded()
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    })
    return NextResponse.json({ success: true, products: products.map(formatProduct) })
  } catch (error) {
    console.error("Customer products error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
