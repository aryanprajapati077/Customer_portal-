"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

type ProductImageCarouselProps = {
  images: string[]
  alt: string
  className?: string
  activeIndex?: number
  onActiveIndexChange?: (index: number) => void
}

export function ProductImageCarousel({
  images,
  alt,
  className,
  activeIndex: controlledIndex,
  onActiveIndexChange,
}: ProductImageCarouselProps) {
  const [internalIndex, setInternalIndex] = useState(0)
  const activeIndex = controlledIndex ?? internalIndex

  const setIndex = useCallback(
    (next: number) => {
      const clamped = images.length ? ((next % images.length) + images.length) % images.length : 0
      if (onActiveIndexChange) onActiveIndexChange(clamped)
      else setInternalIndex(clamped)
    },
    [images.length, onActiveIndexChange],
  )

  useEffect(() => {
    if (controlledIndex === undefined && activeIndex >= images.length) {
      setInternalIndex(0)
    }
  }, [images.length, activeIndex, controlledIndex])

  if (!images.length) return null

  const goPrev = () => setIndex(activeIndex - 1)
  const goNext = () => setIndex(activeIndex + 1)

  return (
    <div className={cn("space-y-3", className)}>
      <div className="group relative aspect-square overflow-hidden rounded-[1.75rem] border border-black/[0.06] bg-[#F4F3EE] shadow-[0_1px_0_rgba(0,0,0,0.03)]">
        <Image
          key={images[activeIndex]}
          src={images[activeIndex]}
          alt={`${alt} — photo ${activeIndex + 1}`}
          fill
          className="object-cover transition-opacity duration-300"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority={activeIndex === 0}
        />

        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/90 text-[#141414] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus:opacity-100"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/90 text-[#141414] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus:opacity-100"
              aria-label="Next photo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {images.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setIndex(index)}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    index === activeIndex ? "w-5 bg-[#1B7339]" : "w-2 bg-white/80 hover:bg-white",
                  )}
                  aria-label={`Go to photo ${index + 1}`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="grid grid-cols-5 gap-2">
          {images.map((url, index) => (
            <button
              key={`${url}-${index}`}
              type="button"
              onClick={() => setIndex(index)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-xl border bg-[#F4F3EE]",
                index === activeIndex ? "border-[#1B7339] ring-2 ring-[#1B7339]/15" : "border-black/[0.08]",
              )}
              aria-label={`View product photo ${index + 1}`}
            >
              <Image src={url} alt={`${alt} thumbnail ${index + 1}`} fill className="object-cover" sizes="96px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
