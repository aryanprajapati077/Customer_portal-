export type ProductCategory = "elegant-combos" | "decor" | "gifting" | "stationery"

export interface KraftRebornProduct {
  id: string
  name: string
  description: string
  price: number
  category: ProductCategory
  tagline: string
  buttsRescued: number
  imageGradient: string
}

export const PRODUCT_CATEGORIES: { id: ProductCategory; label: string; description: string }[] = [
  {
    id: "elegant-combos",
    label: "Elegant Combos",
    description: "Curated circular craft sets for conscious gifting",
  },
  {
    id: "decor",
    label: "Home Decor",
    description: "Rescued-material decor that lives on your shelf",
  },
  {
    id: "gifting",
    label: "Conscious Gifting",
    description: "Handmade presents with measurable impact",
  },
  {
    id: "stationery",
    label: "Stationery",
    description: "Upcycled paper and filter craft essentials",
  },
]

export const KRAFTREBORN_PRODUCTS: KraftRebornProduct[] = [
  {
    id: "kr-coaster-set",
    name: "Rescued Filter Coaster Set",
    description: "Set of 4 coasters handcrafted from rescued cigarette filters and circular craft resin.",
    price: 899,
    category: "elegant-combos",
    tagline: "Circular craft · zero plastic",
    buttsRescued: 40,
    imageGradient: "from-amber-100 via-stone-200 to-emerald-100",
  },
  {
    id: "kr-desk-organiser",
    name: "Circular Craft Desk Organiser",
    description: "Minimal desk organiser made from upcycled filter paper and reclaimed wood.",
    price: 1499,
    category: "decor",
    tagline: "Handmade in Gujarat",
    buttsRescued: 60,
    imageGradient: "from-stone-200 via-neutral-100 to-amber-50",
  },
  {
    id: "kr-wall-frame",
    name: "Eco-Art Wall Frame",
    description: "Framed circular art piece — rescued materials, artisan-finished edges.",
    price: 2499,
    category: "decor",
    tagline: "One piece · lasting impact",
    buttsRescued: 100,
    imageGradient: "from-emerald-100 via-stone-100 to-amber-100",
  },
  {
    id: "kr-planter-duo",
    name: "Upcycled Planter Duo",
    description: "Pair of small planters crafted from filter microplastic composite.",
    price: 1299,
    category: "decor",
    tagline: "Soil-safe · indoor ready",
    buttsRescued: 55,
    imageGradient: "from-green-100 via-stone-200 to-lime-50",
  },
  {
    id: "kr-gifting-combo",
    name: "Conscious Gifting Combo",
    description: "Premium combo: coasters, notebook, and artisan candle holder — gift-ready box.",
    price: 3499,
    category: "elegant-combos",
    tagline: "Best seller · elegant combos",
    buttsRescued: 140,
    imageGradient: "from-amber-50 via-orange-50 to-stone-200",
  },
  {
    id: "kr-tote",
    name: "Handwoven KR Tote",
    description: "Durable tote with Kraft Reborn weave — supports women artisans in Gujarat.",
    price: 1199,
    category: "gifting",
    tagline: "Artisan hours paid",
    buttsRescued: 50,
    imageGradient: "from-stone-300 via-neutral-200 to-stone-100",
  },
  {
    id: "kr-notebook-set",
    name: "Filter Paper Notebook Set",
    description: "Set of 2 notebooks with covers from upcycled filter paper pulp.",
    price: 699,
    category: "stationery",
    tagline: "Tree-free pages",
    buttsRescued: 30,
    imageGradient: "from-neutral-100 via-stone-150 to-amber-50",
  },
  {
    id: "kr-candle-holder",
    name: "Artisan Candle Holder",
    description: "Sculptural holder from rescued composite — each piece is unique.",
    price: 1899,
    category: "gifting",
    tagline: "45 min artisan craft",
    buttsRescued: 75,
    imageGradient: "from-orange-100 via-amber-100 to-stone-200",
  },
  {
    id: "kr-mini-combo",
    name: "Mini Elegant Combo",
    description: "Coaster set + notebook — perfect starter pack for new partners.",
    price: 1499,
    category: "elegant-combos",
    tagline: "Starter impact pack",
    buttsRescued: 70,
    imageGradient: "from-stone-100 via-amber-50 to-emerald-50",
  },
  {
    id: "kr-desk-set",
    name: "Executive Desk Set",
    description: "Organiser, pen stand, and coaster — complete circular workspace set.",
    price: 2799,
    category: "elegant-combos",
    tagline: "Corporate gifting favourite",
    buttsRescued: 110,
    imageGradient: "from-neutral-200 via-stone-100 to-amber-100",
  },
]

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
