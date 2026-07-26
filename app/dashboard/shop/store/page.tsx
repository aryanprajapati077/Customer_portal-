"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  Gift,
  Loader2,
  Search,
  ShoppingBag,
  Sparkles,
} from "lucide-react"
import { ShopShell } from "@/components/dashboard/shop/shop-shell"
import { useAuth } from "@/lib/auth-context"
import { useCart, type ShopProduct } from "@/lib/cart-context"
import { SHOWCASE_PRODUCTS } from "@/lib/portal-showcase-products"
import { formatInr } from "@/lib/kraftreborn-products"
import { formatIndianNumber } from "@/lib/portal-metrics"
import { creditsToRupees } from "@/lib/kraftreborn"
import { cn } from "@/lib/utils"

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "elegant-combos", label: "Elegant Combos" },
  { id: "decor", label: "Décor" },
  { id: "gifting", label: "Corporate Gifts" },
  { id: "stationery", label: "Stationery" },
  { id: "planters", label: "Planters" },
] as const

function toShopProduct(p: (typeof SHOWCASE_PRODUCTS)[number]): ShopProduct {
  const name = p.name.toLowerCase()
  const category =
    name.includes("planter")
      ? "decor"
      : name.includes("desk") || name.includes("organizer")
        ? "stationery"
        : name.includes("tag") || name.includes("key")
          ? "gifting"
          : "decor"
  return {
    id: p.id,
    name: p.name,
    description: p.tagline,
    price: p.price,
    category,
    tagline: p.tagline,
    buttsRescued: Math.round(p.price / 2),
    imageUrl: p.image,
    imageGradient: "from-[#E8F5E9] via-[#F7F6F2] to-[#FFF8E1]",
    allowsLogo: false,
    availableColors: ["Blue", "Green", "Yellow", "Red", "White", "Mix"],
  }
}

export default function KraftStorePage() {
  const { customer } = useAuth()
  const { itemCount } = useCart()
  const [category, setCategory] = useState("all")
  const [query, setQuery] = useState("")
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [loading, setLoading] = useState(true)

  const rupeeAmount = creditsToRupees(Number(customer?.kraftrebornCredits) || 0)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/customer/products")
        const data = await res.json()
        if (data?.success && Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products)
        } else {
          setProducts(SHOWCASE_PRODUCTS.map(toShopProduct))
        }
      } catch {
        setProducts(SHOWCASE_PRODUCTS.map(toShopProduct))
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      const cat = (p.category || "").toLowerCase()
      const hay = `${p.name} ${p.tagline || ""} ${p.description || ""} ${cat}`.toLowerCase()
      const catOk =
        category === "all" ||
        cat === category ||
        (category === "planters" && hay.includes("planter")) ||
        (category === "stationery" &&
          (hay.includes("desk") || hay.includes("organizer") || hay.includes("stationery"))) ||
        (category === "decor" &&
          (hay.includes("decor") || hay.includes("frame") || hay.includes("bowl"))) ||
        (category === "gifting" &&
          (hay.includes("gift") || hay.includes("corporate") || hay.includes("tag"))) ||
        (category === "elegant-combos" && (hay.includes("combo") || cat === "elegant-combos"))
      const searchOk = !q || hay.includes(q)
      return catOk && searchOk
    })
  }, [products, category, query])

  return (
    <ShopShell>
      <div className="space-y-8 pb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard/shop"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#5A5A5A] hover:text-[#1B7339]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to KraftReborn
          </Link>
          <Link
            href="/dashboard/shop/cart"
            className="landing-btn-ghost !h-10 !px-4 text-[13px]"
          >
            <ShoppingBag className="h-4 w-4" />
            Cart{itemCount > 0 ? ` (${itemCount})` : ""}
          </Link>
        </div>

        {/* Inspire hero */}
        <section className="relative overflow-hidden rounded-[1.75rem] border border-black/[0.06] bg-[#F7F6F2]">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#1B7339]/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-[#C8F000]/20 blur-3xl"
          />
          <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.9fr] lg:items-end lg:p-10">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#1B7339]/85">
                KraftReborn · Shop
              </p>
              <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2rem,4vw,3.1rem)] leading-[1.08] tracking-tight text-[#141414]">
                Redeem your
                <br />
                <em className="italic text-[#1B7339]">rupee amount.</em>
              </h1>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#5A5A5A]">
                Circular craft from rescued cigarette waste — claim upcycled products with your
                available rupee balance.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a href="#catalog" className="landing-btn-primary !bg-[#1B7339] hover:!bg-[#145a2c]">
                  Browse collection
                  <ArrowRight className="h-4 w-4" />
                </a>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#D9D6CF] bg-white/80 px-4 py-2.5 text-[13px] font-semibold text-[#141414]">
                  <Sparkles className="h-3.5 w-3.5 text-[#1B7339]" />
                  ₹{formatIndianNumber(rupeeAmount)} available
                </div>
              </div>
            </div>
            <div className="relative aspect-[5/4] overflow-hidden rounded-[1.35rem] border border-black/[0.05] bg-white/70 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
              <Image
                src="/landing/upcycled-products.png"
                alt="KraftReborn products"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
                priority
              />
            </div>
          </div>
        </section>

        {/* Filters */}
        <section id="catalog" className="scroll-mt-24 space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#8A8A8A]">
                Collection
              </p>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-[1.65rem] tracking-tight text-[#141414]">
                Shop the line
              </h2>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A9A9A]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className="h-11 w-full rounded-full border border-[#D9D6CF] bg-white pl-10 pr-4 text-[13px] text-[#141414] outline-none focus:border-[#1B7339]"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={cn(
                  "h-9 rounded-full border px-3.5 text-[12.5px] font-semibold transition-colors",
                  category === cat.id
                    ? "border-[#1B7339] bg-[#1B7339] text-white"
                    : "border-[#D9D6CF] bg-white text-[#4A4A4A] hover:border-[#1B7339] hover:text-[#1B7339]",
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#1B7339]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-[1.25rem] border border-[#E5E2DA] bg-[#F7F6F2] px-6 py-16 text-center">
              <Gift className="mx-auto mb-3 h-8 w-8 text-[#1B7339]/50" />
              <p className="text-[15px] font-semibold text-[#141414]">No products found</p>
              <p className="mt-1 text-[13px] text-[#6B6B6B]">Try another category or search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 md:gap-4">
              {filtered.map((product, i) => (
                <motion.article
                  key={product.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.35), duration: 0.4 }}
                  className="group flex flex-col overflow-hidden rounded-[1.25rem] border border-black/[0.06] bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)]"
                >
                  <Link
                    href={`/dashboard/shop/${product.id}`}
                    className="relative aspect-square overflow-hidden bg-[#F4F3EE]"
                  >
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        sizes="240px"
                      />
                    ) : (
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${product.imageGradient} flex items-center justify-center`}
                      >
                        <Sparkles className="h-7 w-7 text-[#1B7339]/30" />
                      </div>
                    )}
                  </Link>
                  <div className="flex flex-1 flex-col p-3.5 sm:p-4">
                    <Link href={`/dashboard/shop/${product.id}`}>
                      <h3 className="font-[family-name:var(--font-display)] text-[15px] leading-snug tracking-tight text-[#141414] line-clamp-2 group-hover:text-[#1B7339]">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-[#7A7A7A]">
                      {product.tagline || product.description}
                    </p>
                    <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                      <span className="text-[14px] font-bold text-[#141414]">
                        {formatInr(product.price)}
                      </span>
                      <Link
                        href={`/dashboard/shop/${product.id}`}
                        className="inline-flex h-8 items-center rounded-full bg-[#1B7339] px-3 text-[11.5px] font-semibold text-white hover:bg-[#145a2c]"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </section>

        <div className="rounded-[1.25rem] border border-[#E5E2DA] bg-[#F7F6F2] px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8A8A8A]">
                Your balance
              </p>
              <p className="mt-1 text-[18px] font-bold text-[#141414]">
                ₹{formatIndianNumber(rupeeAmount)}{" "}
                <span className="text-[13px] font-medium text-[#6B6B6B]">rupee amount</span>
              </p>
            </div>
            <Link href="/dashboard/shop/cart" className="landing-btn-primary !bg-[#1B7339] hover:!bg-[#145a2c]">
              Go to cart
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </ShopShell>
  )
}
