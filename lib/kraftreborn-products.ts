import { KRAFTREBORN_CATALOG, type KraftRebornCatalogCategory } from "@/lib/kraftreborn-catalog"

export type ProductCategory = KraftRebornCatalogCategory

export interface KraftRebornProduct {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  category: ProductCategory
  tagline: string
  buttsRescued: number
  imageGradient: string
  sourceImageUrls?: string[]
  availableColors?: string[]
  allowsLogo?: boolean
}

export const PRODUCT_CATEGORIES: { id: ProductCategory; label: string; description: string }[] = [
  {
    id: "single-product-delight",
    label: "Single Product Delight",
    description: "Handcrafted sustainable articles from recycled cigarette waste",
  },
  {
    id: "elegant-combos",
    label: "Elegant Combos",
    description: "Curated KraftReborn sets for conscious gifting and corporate orders",
  },
]

/** Shop filter tabs: All → Single Product Delight → Elegant Combos */
export const SHOP_FILTER_CATEGORIES = [
  { id: "all", label: "All" },
  ...PRODUCT_CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
] as const

/** Live KraftReborn catalog from the partner shop. */
export const KRAFTREBORN_PRODUCTS: KraftRebornProduct[] = KRAFTREBORN_CATALOG.map((p) => ({
  id: p.id,
  name: p.name,
  description: p.description,
  price: p.price,
  originalPrice: p.originalPrice,
  category: p.category,
  tagline: p.tagline,
  buttsRescued: p.buttsRescued,
  imageGradient: p.imageGradient,
  sourceImageUrls: p.sourceImageUrls,
  availableColors: p.availableColors,
  allowsLogo: p.allowsLogo,
}))

export function getProductById(id: string): KraftRebornProduct | undefined {
  return KRAFTREBORN_PRODUCTS.find((p) => p.id === id)
}

export function getProductsByCategory(category: ProductCategory | "all"): KraftRebornProduct[] {
  if (category === "all") return KRAFTREBORN_PRODUCTS
  return KRAFTREBORN_PRODUCTS.filter((p) => p.category === category)
}

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`
}
