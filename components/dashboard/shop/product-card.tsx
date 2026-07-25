"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { type ShopProduct } from "@/lib/cart-context"
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
    <article className="portal-card overflow-hidden flex flex-col group h-full">
      <div className="aspect-square relative overflow-hidden bg-[#F4F4F0] shrink-0">
        <Link href={`/dashboard/shop/${product.id}`} className="block absolute inset-0">
          {img ? (
            <Image
              src={img}
              alt={product.name}
              fill
              className="object-cover object-center group-hover:scale-[1.03] transition-transform duration-500"
              sizes="220px"
            />
          ) : (
            <div
              className={`absolute inset-0 bg-gradient-to-br ${product.imageGradient} flex items-center justify-center`}
            >
              <Sparkles className="w-6 h-6 text-[#1B7339]/35" />
            </div>
          )}
        </Link>
        <button
          type="button"
          onClick={() => setLiked((v) => !v)}
          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/95 border border-[#E8E8E8] flex items-center justify-center z-10"
          aria-label="Favorite"
        >
          <Heart
            className={cn("w-3.5 h-3.5", liked ? "fill-[#E53935] text-[#E53935]" : "text-[#8A8A8A]")}
            strokeWidth={1.75}
          />
        </button>
      </div>

      <div className="p-3 flex flex-col flex-1">
        <Link href={`/dashboard/shop/${product.id}`}>
          <h3 className="text-[13px] font-semibold text-[#1A1A1A] line-clamp-1 hover:text-[#1B7339]">
            {product.name}
          </h3>
        </Link>
        <p className="text-[11px] text-[#8A8A8A] mt-1 line-clamp-2 leading-snug min-h-[28px]">
          {product.tagline || product.description}
        </p>
        <span className="inline-flex self-start mt-2 px-2 py-[3px] rounded-full bg-[#E8F5E9] text-[#1B7339] text-[11px] font-semibold">
          {product.price} Credits
        </span>
        <Link
          href={`/dashboard/shop/${product.id}`}
          className="mt-auto pt-2.5 inline-flex items-center justify-center h-8 rounded-lg border border-[#1B7339] text-[#1B7339] text-[12px] font-semibold hover:bg-[#E8F5E9]"
        >
          View Details
        </Link>
      </div>
    </article>
  )
}
