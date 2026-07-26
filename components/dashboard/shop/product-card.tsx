"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { type ShopProduct } from "@/lib/cart-context"
import { formatInr } from "@/lib/kraftreborn-products"
import { Heart, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProductCardProps {
  product: ShopProduct
  forceImage?: string
}

export function ProductCard({ product, forceImage }: ProductCardProps) {
  const [liked, setLiked] = useState(false)
  const img = forceImage || product.imageUrl

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-black/[0.06] bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)]">
      <div className="relative aspect-square shrink-0 overflow-hidden bg-[#F4F3EE]">
        <Link href={`/dashboard/shop/${product.id}`} className="absolute inset-0 block">
          {img ? (
            <Image
              src={img}
              alt={product.name}
              fill
              className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="220px"
            />
          ) : (
            <div
              className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${product.imageGradient}`}
            >
              <Sparkles className="h-6 w-6 text-[#1B7339]/35" />
            </div>
          )}
        </Link>
        <button
          type="button"
          onClick={() => setLiked((v) => !v)}
          className="absolute right-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-[#E8E8E8] bg-white/95"
          aria-label="Favorite"
        >
          <Heart
            className={cn("h-3.5 w-3.5", liked ? "fill-[#E53935] text-[#E53935]" : "text-[#8A8A8A]")}
            strokeWidth={1.75}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <Link href={`/dashboard/shop/${product.id}`}>
          <h3 className="line-clamp-1 font-[family-name:var(--font-display)] text-[14px] font-semibold tracking-tight text-[#141414] hover:text-[#1B7339]">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1 min-h-[28px] line-clamp-2 text-[11px] leading-snug text-[#8A8A8A]">
          {product.tagline || product.description}
        </p>
        <span className="mt-2 inline-flex self-start rounded-full bg-[#E8F5E9] px-2.5 py-[3px] text-[11px] font-semibold text-[#1B7339]">
          {formatInr(product.price)}
        </span>
        <div className="mt-auto pt-2.5">
          <Link
            href={`/dashboard/shop/${product.id}`}
            className="inline-flex h-8 w-full items-center justify-center rounded-full border border-[#1B7339] text-[12px] font-semibold text-[#1B7339] hover:bg-[#E8F5E9]"
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  )
}
