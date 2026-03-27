"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

export function KioskAnimation() {
  const [isVisible, setIsVisible] = useState(false)
  const [dropKey, setDropKey] = useState(0)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true)
      },
      { threshold: 0.2 },
    )
    const el = document.getElementById("kiosk-section")
    if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return
    const interval = setInterval(() => setDropKey((k) => k + 1), 2500)
    return () => clearInterval(interval)
  }, [isVisible])

  return (
    <section
      id="kiosk-section"
      className="py-20 lg:py-28 relative bg-muted/20 overflow-hidden"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12 lg:mb-16">
          <h2
            className={`text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <span className="text-foreground">Dispose </span>
            <span className="text-primary">Cigarette Waste</span>
            <span className="text-foreground"> Here</span>
          </h2>
          <p
            className={`text-muted-foreground text-lg transition-all duration-700 delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            Our collection kiosks make it easy to recycle cigarette waste at designated points
          </p>
        </div>

        <div
          className={`flex justify-center transition-all duration-700 delay-200 ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <div className="relative">
            {/* Kiosk - photo with white bg, compact on desktop */}
            <div className="relative w-20 sm:w-24 lg:w-28 xl:w-32 max-w-[140px] mx-auto rounded-lg overflow-hidden bg-white p-4">
              <Image
                src="/kiosk.png"
                alt="BuffIndia cigarette disposal kiosk"
                width={240}
                height={520}
                quality={95}
                className="w-full h-auto object-contain drop-shadow-lg"
                style={{
                  filter: "contrast(1.1) brightness(1.05) saturate(1.08)",
                }}
                priority
              />
            </div>

            {/* Animated cigarette butt dropping into kiosk */}
            <div
              key={dropKey}
              className="absolute left-1/2 -translate-x-1/2 -top-4 w-4 h-4 sm:w-5 sm:h-5 animate-drop-into-kiosk pointer-events-none"
            >
              <svg viewBox="0 0 24 24" className="w-full h-full drop-shadow-md">
                {/* Cigarette butt */}
                <rect x="4" y="2" width="12" height="4" rx="1" fill="#8B7355" />
                <rect x="2" y="3" width="16" height="2" rx="0.5" fill="#f5f0e8" />
                <ellipse cx="4" cy="4" rx="1.5" ry="1" fill="#ff6b35" opacity="0.9" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
