"use client"

import { useMemo, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { ShopShell } from "@/components/dashboard/shop/shop-shell"
import { ProductCard } from "@/components/dashboard/shop/product-card"
import { PRODUCT_CATEGORIES, type ProductCategory } from "@/lib/kraftreborn-products"
import type { ShopProduct } from "@/lib/cart-context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Search } from "lucide-react"

function ShopContent() {
  const searchParams = useSearchParams()
  const initialCategory = (searchParams.get("category") as ProductCategory) || "all"
  const [category, setCategory] = useState<ProductCategory | "all">(
    PRODUCT_CATEGORIES.some((c) => c.id === initialCategory) ? initialCategory : "all",
  )
  const [query, setQuery] = useState("")
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/customer/products")
        const data = await res.json()
        if (data?.success) setProducts(data.products || [])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filtered = useMemo(() => {
    let list = category === "all" ? products : products.filter((p) => p.category === category)
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q),
      )
    }
    return list
  }, [products, category, query])

  return (
    <ShopShell subtitle="Circular decor · conscious gifting · pay with KR credits">
      <div className="space-y-8">
        <section className="text-center max-w-2xl mx-auto space-y-3 py-2">
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">Kraft Reborn Shop</p>
          <h1 className="text-2xl md:text-3xl font-serif font-bold">Circular craft products</h1>
          <p className="text-muted-foreground text-sm">
            Pay with Kraftreborn credits — <strong>1 credit = ₹1</strong>
          </p>
        </section>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={category === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory("all")}
            >
              All
            </Button>
            {PRODUCT_CATEGORIES.map((cat) => (
              <Button
                key={cat.id}
                variant={category === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setCategory(cat.id)}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-stone-500 py-20">No products found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </ShopShell>
  )
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading shop...</div>}>
      <ShopContent />
    </Suspense>
  )
}
