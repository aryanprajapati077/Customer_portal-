"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import { Cigarette, Leaf, Recycle, Sparkles, X, ArrowRight, Gift } from "lucide-react"
import { cn } from "@/lib/utils"
import { portalEase } from "@/components/portal/motion"

type BannerVariant = "home" | "impact" | "kraft"

const STORY_SLIDES = [
  {
    eyebrow: "Chapter 01",
    title: "It starts with a single butt",
    subtitle: "Littered filters leach toxins into soil and water — unless we catch them first.",
    icon: Cigarette,
    image: "/portal/stories/story-01.png",
    tint: "from-[#FFF3E0]/90 to-[#EEF3EA]",
  },
  {
    eyebrow: "Chapter 02",
    title: "Collected. Weighed. Recovered.",
    subtitle: "Your kiosks feed a circular stream — ash, fibre and impact, all measured.",
    icon: Recycle,
    image: "/portal/stories/story-02.png",
    tint: "from-[#E8F5E9]/95 to-[#EEF3EA]",
  },
  {
    eyebrow: "Chapter 03",
    title: "Waste becomes KraftReborn",
    subtitle: "Beautiful. Sustainable. Made from cigarette waste — for gifts that tell a story.",
    icon: Gift,
    image: "/portal/stories/story-03.png",
    tint: "from-[#EEF3EA] to-[#F7F6F2]",
  },
  {
    eyebrow: "Chapter 04",
    title: "Redeem your rupee amount",
    subtitle: "Shop KraftReborn with your available rupee balance and bring circular design home.",
    icon: Sparkles,
    image: "/portal/stories/story-04.png",
    tint: "from-[#E8F5E9] to-[#FFF8F0]",
  },
]

export function WhatsNewBanner({
  variant = "home",
  className,
}: {
  variant?: BannerVariant
  className?: string
}) {
  const [visible, setVisible] = useState(true)
  const [slide, setSlide] = useState(0)
  const current = STORY_SLIDES[slide]

  useEffect(() => {
    if (!visible) return
    const id = setInterval(() => setSlide((s) => (s + 1) % STORY_SLIDES.length), 5200)
    return () => clearInterval(id)
  }, [visible])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          layout
          initial={{ opacity: 0, y: 24, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.98, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.55, ease: portalEase }}
          className={cn(
            "relative overflow-hidden rounded-[18px] border border-[#E2E8E0] portal-banner-glow",
            className,
          )}
        >
          <div
            className={cn("absolute inset-0 bg-gradient-to-br transition-colors duration-700", current.tint)}
          />

          <button
            type="button"
            onClick={() => setVisible(false)}
            className="absolute top-3 right-3 z-20 flex h-7 w-7 items-center justify-center rounded-full text-[#8A8A8A] hover:bg-white/80"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative grid items-center gap-4 p-5 md:grid-cols-[1.15fr_1fr_0.95fr] md:gap-5 md:px-6 md:py-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={`copy-${slide}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: portalEase }}
                className="space-y-2.5 pr-2"
              >
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#1B7339]">
                  What&apos;s New · {current.eyebrow}
                </p>
                <h2 className="text-[20px] font-bold leading-[1.25] tracking-[-0.01em] text-[#1A1A1A] md:text-[22px]">
                  {current.title}
                </h2>
                <p className="text-[13px] text-[#6B6B6B]">{current.subtitle}</p>
                <Link
                  href={variant === "kraft" ? "/dashboard/shop/store" : "/dashboard/shop"}
                  className="portal-btn-solid mt-1 group inline-flex !gap-2 transition-all duration-300 hover:-translate-y-0.5 hover:!bg-[#145a2c]"
                >
                  {variant === "kraft" ? "Explore Collection" : "Explore Now"}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </motion.div>
            </AnimatePresence>

            <motion.div
              className="relative h-[140px] overflow-hidden rounded-xl md:h-[158px]"
              whileHover={{ scale: 1.02 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={`img-${slide}`}
                  className="absolute inset-0"
                  initial={{ opacity: 0, scale: 1.04, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.98, x: -16 }}
                  transition={{ duration: 0.45, ease: portalEase }}
                >
                  <Image
                    src={current.image}
                    alt={current.title}
                    fill
                    className="object-cover object-center rounded-xl"
                    sizes="380px"
                    priority
                  />
                </motion.div>
              </AnimatePresence>
            </motion.div>

            <div className="space-y-3">
              {STORY_SLIDES.map((s, i) => {
                const StepIcon = s.icon
                const active = i === slide
                return (
                  <button
                    key={s.eyebrow}
                    type="button"
                    onClick={() => setSlide(i)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition-all",
                      active
                        ? "border-[#1B7339]/35 bg-white shadow-sm"
                        : "border-transparent bg-white/40 hover:bg-white/70",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        active ? "bg-[#E8F5E9] text-[#1B7339]" : "bg-white/80 text-[#7A7A7A]",
                      )}
                    >
                      <StepIcon className="h-3.5 w-3.5" strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
                        {s.eyebrow}
                      </span>
                      <span
                        className={cn(
                          "block truncate text-[12px] font-medium",
                          active ? "text-[#1A1A1A]" : "text-[#5A5A5A]",
                        )}
                      >
                        {s.title}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="absolute bottom-3.5 left-5 z-10 flex items-center gap-1.5">
            <Leaf className="h-3 w-3 text-[#1B7339]" />
            <span className="text-[10px] font-medium text-[#6B6B6B]">
              Story {slide + 1} / {STORY_SLIDES.length}
            </span>
          </div>

          <div className="absolute bottom-3.5 right-5 z-10 flex items-center gap-1.5">
            {STORY_SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSlide(i)}
                className={cn(
                  "rounded-full transition-all duration-300",
                  slide === i ? "h-1.5 w-4 bg-[#1B7339]" : "h-1.5 w-1.5 bg-[#C5C5C5] hover:bg-[#A0A0A0]",
                )}
                aria-label={`Story slide ${i + 1}`}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
