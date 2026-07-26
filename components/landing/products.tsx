"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Leaf, Hand, Heart, ArrowRight } from "lucide-react"

const PILLARS = [
  { icon: Leaf, label: "Sustainable" },
  { icon: Hand, label: "Handcrafted" },
  { icon: Heart, label: "Meaningful" },
]

export function LandingProducts() {
  return (
    <section id="kraftreborn" className="scroll-mt-24 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] border border-black/[0.06] bg-gradient-to-br from-[#F4F8F4] via-white to-[#EEF5EF] shadow-[0_1px_0_rgba(0,0,0,0.03)]"
        >
          <Image
            src="/landing/upcycled-products.png"
            alt="KraftReborn upcycled products"
            fill
            className="object-contain object-center p-4 sm:p-6"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        </motion.div>

        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#1B7339]/85">
            KraftReborn
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2rem,3.8vw,2.9rem)] leading-[1.1] tracking-tight text-[#141414]">
            Purposeful products.
            <br />
            <em className="italic text-[#1B7339]">Positive impact.</em>
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#5A5A5A] sm:text-[16px]">
            Cigarette waste upcycled into terrazzo planters, trays, and lifestyle pieces — circular
            design with a story your guests can feel.
          </p>

          <div className="mt-7 flex flex-wrap gap-5">
            {PILLARS.map((p) => (
              <div key={p.label} className="flex items-center gap-2 text-[#2A4A32]">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8F5E9] text-[#1B7339]">
                  <p.icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                </span>
                <span className="text-[13px] font-semibold">{p.label}</span>
              </div>
            ))}
          </div>

          <Link href="/products" className="landing-btn-primary mt-8">
            Explore KraftReborn
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
