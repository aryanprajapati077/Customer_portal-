"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight, Building2, MapPin, Map } from "lucide-react"

const STATS = [
  { icon: Building2, label: "580+ Clients" },
  { icon: MapPin, label: "1,900+ Locations" },
  { icon: Map, label: "85+ Cities Pan India" },
]

export function LandingHero() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden border-b border-black/5">
      <div className="absolute inset-0">
        <Image
          src="/landing/hero-kiosk.png"
          alt="BuffIndia disposal kiosk"
          fill
          className="object-cover object-[68%_center]"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#F7F6F2] via-[#F7F6F2]/88 to-[#F7F6F2]/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F7F6F2]/90 via-transparent to-[#F7F6F2]/45" />
      </div>

      <div className="relative mx-auto flex min-h-[100svh] max-w-6xl items-center px-4 pb-16 pt-28 sm:px-6 lg:px-8 lg:pb-20 lg:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl"
        >
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#1B7339]/85">
            Cigarette waste infrastructure
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2.5rem,5.5vw,4.1rem)] leading-[1.05] tracking-tight text-[#141414]">
            India&apos;s first system for{" "}
            <em className="italic text-[#1B7339]">cigarette waste management.</em>
          </h1>
          <p className="mt-5 max-w-md text-[16px] leading-relaxed text-[#5A5A5A] sm:text-[17px]">
            Collect, recycle, and turn cigarette waste into measurable impact — across hotels,
            campuses, and workplaces.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#calculator" className="landing-btn-primary">
              Calculate my impact
              <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#proposal" className="landing-btn-ghost bg-white/70 backdrop-blur-sm">
              Get a proposal
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
            {STATS.map((s) => (
              <div key={s.label} className="flex items-center gap-2 text-[#2A4A32]">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-[#1B7339] shadow-sm backdrop-blur-sm">
                  <s.icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                </span>
                <span className="text-[13px] font-semibold">{s.label}</span>
              </div>
            ))}
          </div>

          <p className="sr-only">
            Portal entry: <Link href="/login">Customer Login</Link>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
