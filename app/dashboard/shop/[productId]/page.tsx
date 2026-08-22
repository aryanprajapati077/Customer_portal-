"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ShopShell } from "@/components/dashboard/shop/shop-shell"
import { ProductImageCarousel } from "@/components/dashboard/shop/product-image-carousel"
import { ProductPrice } from "@/components/dashboard/shop/product-price"
import { formatInr } from "@/lib/kraftreborn-products"
import type { ShopProduct } from "@/lib/cart-context"
import { useCart } from "@/lib/cart-context"
import { imageForColor } from "@/lib/product-color-images"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Minus, Plus, ShoppingBag, Loader2 } from "lucide-react"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = String(params.productId)
  const { addItem } = useCart()
  const [product, setProduct] = useState<ShopProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedColor, setSelectedColor] = useState<string>("")
  const [carouselIndex, setCarouselIndex] = useState(0)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/customer/products")
        const data = await res.json()
        if (data?.success) {
          const found = (data.products as ShopProduct[]).find((p) => p.id === productId)
          setProduct(found || null)
          if (found?.availableColors?.length) setSelectedColor(found.availableColors[0])
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [productId])

  const productImages = useMemo(() => {
    if (!product) return []
    return product.imageUrls?.length
      ? product.imageUrls
      : product.imageUrl
        ? [product.imageUrl]
        : []
  }, [product])

  useEffect(() => {
    if (!product || !selectedColor) return
    const colorUrl = imageForColor(selectedColor, productImages, product.colorImages)
    const index = productImages.findIndex((url) => url === colorUrl)
    if (index >= 0) setCarouselIndex(index)
  }, [selectedColor, product, productImages])

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
    addItem(product, quantity, selectedColor || undefined)
    router.push("/dashboard/shop/cart")
  }


  return (
    <ShopShell showBack backHref="/dashboard/shop/store">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductImageCarousel
          images={productImages}
          alt={product.name}
          activeIndex={carouselIndex}
          onActiveIndexChange={setCarouselIndex}
        />

        <div className="space-y-5 lg:pt-1">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-[#E8F5E9] text-[#1B7339] border-[#C8E6D4] text-[11px] font-medium">
                {product.buttsRescued} butts rescued
              </Badge>
              <Badge className="bg-[#1B7339] text-[11px] font-medium">Custom logo at checkout</Badge>
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-[1.65rem] md:text-[2rem] font-bold leading-[1.2] tracking-tight text-[#141414]">
              {product.name}
            </h1>
            <ProductPrice
              price={product.price}
              originalPrice={product.originalPrice}
              size="lg"
            />
          </div>

          <p className="text-[15px] leading-relaxed text-[#5A5A5A]">{product.description}</p>

          {(product.availableColors?.length || 0) > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-[#3A3A3A]">Color</p>
              <div className="flex flex-wrap gap-2">
                {product.availableColors!.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`h-9 px-3.5 rounded-full border text-[13px] font-medium transition-colors ${
                      selectedColor === color
                        ? "border-[#1B7339] bg-[#E8F5E9] text-[#1B7339]"
                        : "border-[#D9D6CF] bg-white text-[#5A5A5A] hover:border-[#1B7339]"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-[1.25rem] border border-[#E5E2DA] bg-[#F7F6F2] p-5 text-sm space-y-1">
            <p className="text-[#5A5A5A]">{product.tagline}</p>
            <p className="text-xs text-[#8A8A8A]">KraftReborn by Buffindia · circular craft · zero plastic · handmade india</p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Quantity</span>
            <div className="flex items-center rounded-full border border-[#D9D6CF] bg-white px-2 py-1">
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
            <Button size="lg" className="flex-1 rounded-full h-12 bg-[#1B7339] hover:bg-[#145a2c]" onClick={handleAddToCart}>
              <ShoppingBag className="w-4 h-4 mr-2" />
              Add to cart — {formatInr(product.price * quantity)}
            </Button>
            <Button size="lg" variant="outline" className="rounded-full h-12 bg-white border-[#D9D6CF]" asChild>
              <Link href="/dashboard/shop/cart">View cart</Link>
            </Button>
          </div>
        </div>
      </div>
    </ShopShell>
  )
}
