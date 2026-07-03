"use client"

import Link from "next/link"
import { ShopShell } from "@/components/dashboard/shop/shop-shell"
import { useCart } from "@/lib/cart-context"
import { formatInr } from "@/lib/kraftreborn-products"
import { Button } from "@/components/ui/button"
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react"

export default function CartPage() {
  const { lines, subtotal, itemCount, updateQuantity, removeItem } = useCart()

  return (
    <ShopShell showBack backHref="/dashboard/shop" title="Your cart">
      {lines.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Button asChild>
            <Link href="/dashboard/shop">Browse products</Link>
          </Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="lg:col-span-2 space-y-4">
            {lines.map((line) => (
              <div
                key={line.productId}
                className="flex gap-4 p-4 rounded-2xl border border-border/40 bg-white/60"
              >
                <div
                  className={`w-24 h-24 shrink-0 rounded-xl bg-gradient-to-br ${line.product.imageGradient} flex items-center justify-center p-2`}
                >
                  <p className="text-[9px] text-center font-serif font-medium leading-tight text-foreground/70">
                    {line.product.name}
                  </p>
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <Link
                    href={`/dashboard/shop/${line.productId}`}
                    className="font-serif font-semibold hover:text-primary transition-colors line-clamp-1"
                  >
                    {line.product.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">{formatInr(line.product.price)} each</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center border border-border/50 rounded-lg bg-white/80">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(line.productId, line.quantity - 1)}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </Button>
                      <span className="w-8 text-center text-sm">{line.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(line.productId, line.quantity + 1)}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeItem(line.productId)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold">{formatInr(line.lineTotal)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-36 rounded-2xl border border-border/40 bg-white/70 p-6 space-y-4">
              <h2 className="font-serif font-bold text-lg">Order summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items ({itemCount})</span>
                  <span>{formatInr(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-emerald-600 font-medium">Free with KR credits</span>
                </div>
                <div className="border-t border-border/40 pt-2 flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>{formatInr(subtotal)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Checkout with your Kraftreborn credits. 1 credit = ₹1.
              </p>
              <Button size="lg" className="w-full" asChild>
                <Link href="/dashboard/shop/checkout">
                  Proceed to checkout
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full bg-transparent" asChild>
                <Link href="/dashboard/shop">Continue shopping</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </ShopShell>
  )
}
