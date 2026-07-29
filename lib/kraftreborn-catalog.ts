/** KraftReborn product catalog */

import catalogData from "@/lib/kraftreborn-products-data.json"

export const STORE_BANNER_IMAGE =
  "https://storage.googleapis.com/takeapp/media/cm7sl6yki000503l2fupx6ztp.jpeg"

export type KraftRebornCatalogCategory = "single-product-delight" | "elegant-combos"

export interface KraftRebornCatalogProduct {
  id: string
  takeAppId: string
  name: string
  description: string
  tagline: string
  price: number
  originalPrice: number
  category: KraftRebornCatalogCategory
  buttsRescued: number
  sourceImageUrls: string[]
  availableColors: string[]
  colorImages?: Record<string, string>
  allowsLogo: boolean
  active: boolean
  sortOrder: number
  imageGradient: string
}

function mapColorsToImages(colors: string[], urls: string[]): Record<string, string> {
  const map: Record<string, string> = {}
  const palette = colors.filter((c) => c !== "Mix")
  palette.forEach((color, index) => {
    const url = urls[index + 1] || urls[0]
    if (url) map[color] = url
  })
  if (colors.includes("Mix") && urls[0]) map.Mix = urls[0]
  return map
}

export const KRAFTREBORN_CATALOG: KraftRebornCatalogProduct[] = (
  catalogData.products as KraftRebornCatalogProduct[]
).map((p) => ({
  ...p,
  colorImages: mapColorsToImages(p.availableColors, p.sourceImageUrls),
}))

export function getKraftRebornCatalogProductById(id: string) {
  return KRAFTREBORN_CATALOG.find((p) => p.id === id)
}
