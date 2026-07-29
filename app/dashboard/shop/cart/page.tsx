"use client"

import Link from "next/link"
import Image from "next/image"
import { ShopShell } from "@/components/dashboard/shop/shop-shell"
import { useCart } from "@/lib/cart-context"
import { formatInr } from "@/lib/kraftreborn-products"
import { ArrowRight, Minus, Plus, Sparkles, Trash2 } from "lucide-react"

export default function CartPage() {
  const { lines, subtotal, itemCount, updateQuantity, removeItem } = useCart()

  return (
    <ShopShell showBack backHref="/dashboard/shop/store" title="Your cart">
      {lines.length === 0 ? (
        <div className="mx-auto max-w-lg rounded-[1.5rem] border border-[#E5E2DA] bg-[#F7F6F2] px-6 py-16 text-center">
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-[#1B7339]/45" />
          <p className="font-[family-name:var(--font-display)] text-[1.4rem] text-[#141414]">
            Your cart is empty
          </p>
          <p className="mt-2 text-[13px] text-[#6B6B6B]">Browse the KraftReborn collection to start redeeming.</p>
          <Link href="/dashboard/shop/store" className="landing-btn-primary mt-6 !bg-[#1B7339] hover:!bg-[#145a2c]">
            Continue shopping
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {lines.map((line) => (
              <div
                key={`${line.productId}-${line.color || ""}`}
                className="flex gap-4 rounded-[1.25rem] border border-black/[0.06] bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.03)]"
              >
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[#F4F3EE]">
                  {(line.product.imageUrls?.[0] || line.product.imageUrl) ? (
                    <Image
                      src={line.product.imageUrls?.[0] || line.product.imageUrl || ""}
                      alt={line.product.name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : (
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${line.product.imageGradient} flex items-center justify-center p-2`}
                    >
                      <p className="text-center text-[9px] font-medium leading-tight text-[#5A5A5A]">
                        {line.product.name}
                      </p>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <Link
                    href={`/dashboard/shop/${line.productId}`}
                    className="line-clamp-1 font-[family-name:var(--font-display)] text-[15px] font-semibold text-[#141414] hover:text-[#1B7339]"
                  >
                    {line.product.name}
                  </Link>
                  <p className="flex flex-wrap items-baseline gap-1.5 text-[13px] text-[#6B6B6B]">
                    <span>{formatInr(line.product.price)} each</span>
                    {line.product.originalPrice && line.product.originalPrice > line.product.price ? (
                      <span className="text-[12px] text-[#A0A0A0] line-through">
                        {formatInr(line.product.originalPrice)}
                      </span>
                    ) : null}
                    {line.color ? <span>· {line.color}</span> : null}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center rounded-full border border-[#D9D6CF] bg-[#F7F6F2]">
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center"
                        onClick={() => updateQuantity(line.productId, line.quantity - 1)}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-[13px] font-semibold">{line.quantity}</span>
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center"
                        onClick={() => updateQuantity(line.productId, line.quantity + 1)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-[12px] font-medium text-[#C62828]"
                      onClick={() => removeItem(line.productId, line.color)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[15px] font-bold text-[#141414]">{formatInr(line.lineTotal)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4 rounded-[1.35rem] border border-black/[0.06] bg-[#F7F6F2] p-6">
              <h2 className="font-[family-name:var(--font-display)] text-[1.25rem] text-[#141414]">
                Order summary
              </h2>
              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-[#6B6B6B]">Items ({itemCount})</span>
                  <span className="font-semibold">{formatInr(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B6B6B]">Shipping</span>
                  <span className="font-medium text-[#1B7339]">Free with balance</span>
                </div>
                <div className="flex justify-between border-t border-[#E5E2DA] pt-2 text-[15px] font-bold">
                  <span>Total</span>
                  <span>{formatInr(subtotal)}</span>
                </div>
              </div>
              <p className="text-[12px] text-[#6B6B6B]">
                Checkout uses your available rupee amount. 1 unit = ₹1.
              </p>
              <Link
                href="/dashboard/shop/checkout"
                className="landing-btn-primary w-full !bg-[#1B7339] hover:!bg-[#145a2c]"
              >
                Proceed to checkout
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard/shop/store"
                className="landing-btn-ghost w-full"
              >
                Continue shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </ShopShell>
  )
}
