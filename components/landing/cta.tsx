"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Reveal } from "@/components/landing/reveal"

export function LandingCta() {
  return (
    <section className="border-t border-[var(--l-line)] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mb-16 max-w-2xl">
            <p className="landing-eyebrow mb-4">The social purpose</p>
            <h2 className="landing-display text-[clamp(2rem,4vw,3.25rem)] leading-[1.12] tracking-tight">
              A cleaner India begins <em className="italic">with a smaller gesture.</em>
            </h2>
            <p className="mt-5 text-[16px] leading-relaxed text-[var(--l-muted)]">
              Make disposal thoughtful. Make recovery circular. Make every impact visible.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <motion.div
            className="rounded-[2rem] bg-[var(--l-ink)] px-8 py-12 text-[#F7F6F2] sm:px-12 sm:py-16"
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/55">
              Start where waste begins
            </p>
            <h3 className="landing-display mt-4 max-w-xl text-[clamp(1.85rem,4vw,3rem)] leading-[1.12]">
              Ready to make your space litter-free?
            </h3>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" className="landing-btn-orange">
                Start a conversation
                <span aria-hidden>↗</span>
              </Link>
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/30 px-5 text-[14px] font-semibold text-white transition-colors hover:bg-white/10"
              >
                Customer Login
              </Link>
            </div>
          </motion.div>
        </Reveal>
      </div>
    </section>
  )
}
