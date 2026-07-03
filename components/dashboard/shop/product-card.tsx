"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { type ShopProduct } from "@/lib/cart-context"
import { formatInr } from "@/lib/kraftreborn-products"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useCart } from "@/lib/cart-context"
import { Minus, Plus, ShoppingBag, Sparkles } from "lucide-react"

interface ProductCardProps {
  product: ShopProduct
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()
  const [open, setOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    addItem(product, quantity)
    setAdded(true)
    setTimeout(() => {
      setOpen(false)
      setAdded(false)
      setQuantity(1)
    }, 800)
  }

  return (
    <>
      <article className="group relative rounded-2xl border border-stone-200/80 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
        <Link href={`/dashboard/shop/${product.id}`} className="block">
          <div className="aspect-[4/3] relative overflow-hidden">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                sizes="(max-width:768px) 100vw, 25vw"
              />
            ) : (
              <div
                className={`absolute inset-0 bg-gradient-to-br ${product.imageGradient} flex items-center justify-center`}
              >
                <div className="text-center px-6">
                  <Sparkles className="w-5 h-5 mx-auto mb-2 text-amber-700/40" />
                  <p className="font-serif text-lg font-semibold text-stone-700/80 leading-tight">{product.name}</p>
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Badge className="absolute top-3 left-3 bg-white/95 text-stone-800 border-0 text-[10px] shadow-sm backdrop-blur">
              {product.buttsRescued} butts rescued
            </Badge>
            {product.allowsLogo && (
              <Badge className="absolute top-3 right-3 bg-amber-500/90 text-white border-0 text-[10px]">
                Logo option
              </Badge>
            )}
          </div>
        </Link>

        <div className="p-5 space-y-3">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-stone-400 mb-1">Kraft Reborn</p>
            <Link href={`/dashboard/shop/${product.id}`}>
              <h3 className="font-serif text-lg font-semibold text-stone-900 hover:text-amber-700 transition-colors line-clamp-1">
                {product.name}
              </h3>
            </Link>
            <p className="text-xs text-stone-500 mt-1.5 line-clamp-2 leading-relaxed">{product.description}</p>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <div>
              <span className="text-xl font-bold text-stone-900">{formatInr(product.price)}</span>
              <p className="text-[10px] text-stone-400">or {product.price} KR credits</p>
            </div>
            <Button
              size="sm"
              className="rounded-full px-4 shadow-md shadow-primary/20"
              onClick={(e) => {
                e.preventDefault()
                setOpen(true)
              }}
            >
              <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
              Add
            </Button>
          </div>
        </div>
      </article>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif">{product.name}</DialogTitle>
            <DialogDescription>Select quantity and add to your cart</DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between py-4">
            <span className="text-sm font-medium">Quantity</span>
            <div className="flex items-center gap-3 rounded-full border border-border/60 bg-muted/30 px-2 py-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-8 text-center font-semibold text-lg">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setQuantity((q) => q + 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-xl bg-amber-50/80 border border-amber-100 p-4 flex justify-between items-center">
            <span className="text-sm text-stone-600">Line total</span>
            <span className="text-xl font-bold text-stone-900">{formatInr(product.price * quantity)}</span>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={added} className="rounded-full">
              {added ? "Added ✓" : `Add ${quantity} to cart`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
