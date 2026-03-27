"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { SUPPORTER_PARTNERS } from "@/lib/supporter-data"

function LogoItem({
  supporter,
  index,
  isVisible,
  compact = false,
}: {
  supporter: (typeof SUPPORTER_PARTNERS)[0]
  index: number
  isVisible: boolean
  compact?: boolean
}) {
  const [imgError, setImgError] = useState(false)
  const initial = supporter.name.replace(/^the\s+/i, "").charAt(0).toUpperCase()

  return (
    <div
      className={`group flex flex-col items-center justify-center px-4 py-4 rounded-xl bg-white border border-border/50 shadow-sm transition-all duration-500 hover:scale-[1.08] hover:shadow-xl hover:shadow-primary/10 hover:border-primary/40 overflow-hidden ${
        compact ? "w-28 h-20 flex-shrink-0" : "w-full min-h-[100px] sm:min-h-[115px]"
      } ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      style={{
        transitionDelay: compact ? "0ms" : `${Math.min(index % 24, 12) * 40}ms`,
        transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
    >
      <div className="flex flex-col items-center gap-2 w-full h-full justify-center">
        {imgError ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className={`rounded-full flex items-center justify-center ${
                compact ? "w-10 h-10" : "w-14 h-14"
              }`}
              style={{
                background: "linear-gradient(135deg, oklch(0.96 0.02 55) 0%, oklch(0.93 0.03 45) 100%)",
                boxShadow: "inset 0 1px 2px rgba(255,255,255,0.9), 0 2px 12px rgba(0,0,0,0.06)",
              }}
            >
              <span className="font-bold text-primary" style={{ fontSize: compact ? "0.875rem" : "1.25rem" }}>
                {initial}
              </span>
            </div>
          </div>
        ) : (
          <div
            className={`relative flex-shrink-0 bg-white rounded-lg overflow-hidden ${
              compact ? "w-20 h-14" : "w-[110px] h-[72px]"
            }`}
          >
            <Image
              src={supporter.logo}
              alt={supporter.name}
              fill
              sizes="(max-width: 768px) 80px, 110px"
              className="object-contain object-center transition-transform duration-300 group-hover:scale-105"
              style={{ backgroundColor: "white" }}
              onError={() => setImgError(true)}
            />
          </div>
        )}
        {!compact && (
          <span className="text-[10px] sm:text-[11px] font-medium text-center leading-tight line-clamp-2 px-1 text-muted-foreground">
            {supporter.name}
          </span>
        )}
      </div>
    </div>
  )
}

export function SupporterLogos() {
  const [isVisible, setIsVisible] = useState(false)
  const duplicatedPartners = [...SUPPORTER_PARTNERS, ...SUPPORTER_PARTNERS]

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true)
      },
      { threshold: 0.05 },
    )
    const el = document.getElementById("supporter-logos")
    if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="supporter-logos"
      className="relative py-20 lg:py-28 overflow-hidden bg-white"
    >
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, oklch(0.35 0 0) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-14 relative">
        <h2
          className={`text-3xl sm:text-4xl font-bold text-center mb-3 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ color: "oklch(0.32 0.1 45)", letterSpacing: "-0.02em" }}
        >
          Our Valued Partners
        </h2>
        <p
          className={`text-muted-foreground text-center max-w-2xl mx-auto text-base sm:text-lg transition-all duration-700 delay-100 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          Building a sustainable future together with visionary partners across India
        </p>
      </div>

      {/* Grid with partner logos from BuffIndia_React */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-16 relative">
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 sm:gap-4">
          {SUPPORTER_PARTNERS.map((supporter, index) => (
            <LogoItem
              key={`${supporter.name}-${index}`}
              supporter={supporter}
              index={index}
              isVisible={isVisible}
            />
          ))}
        </div>
      </div>

      {/* Marquee rows */}
      <div className="relative group/marquee">
        <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-32 z-10 pointer-events-none bg-gradient-to-r from-white to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-32 z-10 pointer-events-none bg-gradient-to-l from-white to-transparent" />

        <div className="flex gap-5 py-4 overflow-hidden">
          <div className="flex animate-marquee gap-5 flex-shrink-0 min-w-max">
            {duplicatedPartners.map((supporter, index) => (
              <LogoItem key={`m1-${supporter.name}-${index}`} supporter={supporter} index={index} isVisible={true} compact />
            ))}
            {duplicatedPartners.map((supporter, index) => (
              <LogoItem key={`m1b-${supporter.name}-${index}`} supporter={supporter} index={index} isVisible={true} compact />
            ))}
          </div>
        </div>

        <div className="flex gap-5 py-4 overflow-hidden">
          <div className="flex animate-marquee-reverse gap-5 flex-shrink-0 min-w-max">
            {[...duplicatedPartners].reverse().map((supporter, index) => (
              <LogoItem key={`m2-${supporter.name}-${index}`} supporter={supporter} index={index} isVisible={true} compact />
            ))}
            {[...duplicatedPartners].reverse().map((supporter, index) => (
              <LogoItem key={`m2b-${supporter.name}-${index}`} supporter={supporter} index={index} isVisible={true} compact />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
