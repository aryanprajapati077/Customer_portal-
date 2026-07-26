"use client"

import { motion } from "framer-motion"
import { Cigarette, Package, Truck, Recycle, Sparkles, Gift } from "lucide-react"

const STEPS = [
  { icon: Cigarette, label: "Discarded" },
  { icon: Package, label: "Collected" },
  { icon: Truck, label: "Transported" },
  { icon: Recycle, label: "Recycled" },
  { icon: Sparkles, label: "Transformed" },
  { icon: Gift, label: "Returned" },
]

export function LandingJourney() {
  return (
    <section id="journey" className="scroll-mt-24 border-y border-black/5 bg-[#E8F5E9]/55 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-[12px] font-semibold uppercase tracking-[0.18em] text-[#1B7339]/85">
          The journey of a cigarette butt
        </p>
        <h2 className="mx-auto mt-3 max-w-2xl text-center font-[family-name:var(--font-display)] text-[clamp(1.85rem,3.2vw,2.6rem)] leading-tight text-[#141414]">
          From litter to <em className="italic text-[#1B7339]">purposeful product</em>
        </h2>

        <div className="mt-12 flex flex-wrap items-start justify-center gap-y-8">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center"
            >
              <div className="flex w-[108px] flex-col items-center text-center sm:w-[120px]">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#1B7339]/25 bg-white text-[#1B7339] shadow-sm">
                  <step.icon className="h-5 w-5" strokeWidth={1.6} />
                </div>
                <p className="mt-3 text-[12px] font-semibold tracking-wide text-[#2A4A32]">
                  {i + 1}. {step.label}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  aria-hidden
                  className="mb-8 hidden w-8 border-t border-dashed border-[#1B7339]/35 sm:block md:w-12"
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
