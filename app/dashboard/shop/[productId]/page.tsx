"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ShopShell } from "@/components/dashboard/shop/shop-shell"
import { formatInr } from "@/lib/kraftreborn-products"
import type { ShopProduct } from "@/lib/cart-context"
import { useCart } from "@/lib/cart-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Minus, Plus, ShoppingBag, Loader2, Sparkles } from "lucide-react"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = String(params.productId)
  const { addItem } = useCart()
  const [product, setProduct] = useState<ShopProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/customer/products")
        const data = await res.json()
        if (data?.success) {
          const found = (data.products as ShopProduct[]).find((p) => p.id === productId)
          setProduct(found || null)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [productId])

  if (loading) {
    return (
      <ShopShell showBack backHref="/dashboard/shop">
        <div className="py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </ShopShell>
    )
  }

  if (!product) {
    return (
      <ShopShell showBack backHref="/dashboard/shop" title="Not found">
        <div className="text-center py-16 space-y-4">
          <p className="text-muted-foreground">Product not found.</p>
          <Button asChild>
            <Link href="/dashboard/shop">Back to shop</Link>
          </Button>
        </div>
      </ShopShell>
    )
  }

  const handleAddToCart = () => {
    addItem(product, quantity)
    router.push("/dashboard/shop/cart")
  }

  return (
    <ShopShell showBack backHref="/dashboard/shop" title={product.name}>
      <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
        <div className="aspect-square rounded-3xl overflow-hidden border border-stone-200/60 shadow-lg relative">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="50vw" />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${product.imageGradient} flex items-center justify-center`}>
              <div className="text-center px-8">
                <Sparkles className="w-8 h-8 mx-auto mb-4 text-amber-600/50" />
                <p className="font-serif text-3xl font-bold text-stone-800/85">{product.name}</p>
                <p className="text-sm text-stone-600 mt-2">{product.tagline}</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="outline" className="bg-amber-50">{product.buttsRescued} butts rescued</Badge>
              {product.allowsLogo && <Badge className="bg-amber-500">Custom logo available</Badge>}
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-900">{product.name}</h1>
            <p className="text-3xl font-bold mt-3 text-stone-900">{formatInr(product.price)}</p>
            <p className="text-sm text-stone-500 mt-1">{product.price} KR credits · 1 credit = ₹1</p>
          </div>

          <p className="text-stone-600 leading-relaxed">{product.description}</p>

          <div className="rounded-2xl border border-stone-200/60 bg-white/60 p-5 text-sm space-y-1">
            <p className="text-stone-500">{product.tagline}</p>
            <p className="text-xs text-stone-400">kraftreborn.in · circular craft · zero plastic · handmade india</p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Quantity</span>
            <div className="flex items-center rounded-full border border-stone-200 bg-white px-2 py-1">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => setQuantity((q) => q + 1)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" className="flex-1 rounded-full h-12" onClick={handleAddToCart}>
              <ShoppingBag className="w-4 h-4 mr-2" />
              Add to cart — {formatInr(product.price * quantity)}
            </Button>
            <Button size="lg" variant="outline" className="rounded-full h-12 bg-white/70" asChild>
              <Link href="/dashboard/shop/cart">View cart</Link>
            </Button>
          </div>
        </div>
      </div>
    </ShopShell>
  )
}
