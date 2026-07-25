"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { LandingHeroVisual } from "@/components/landing/hero-visual"

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-24 px-4 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 85% 20%, rgba(27,115,57,0.12), transparent 55%), radial-gradient(ellipse 50% 40% at 10% 80%, rgba(239,108,0,0.08), transparent 50%)",
        }}
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          className="max-w-3xl"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="landing-eyebrow mb-5">Cigarette waste, redesigned</p>
          <h1 className="landing-display text-[clamp(2.75rem,6.5vw,5rem)] leading-[1.05] tracking-tight text-[var(--l-ink)]">
            Small waste.
            <br />
            <em className="italic text-[var(--l-green)]">Massive</em> consequence.
          </h1>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-[var(--l-muted)]">
            A cigarette butt takes seconds to discard and years to disappear. BuffIndia turns this
            overlooked toxic residue into a visible, measurable circular system.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#solution" className="landing-btn-primary">
              See the system
              <span aria-hidden>↘</span>
            </a>
            <a href="#impact" className="landing-btn-ghost">
              Explore the impact
            </a>
          </div>

          <motion.a
            href="#problem"
            className="mt-14 inline-flex items-center gap-3 text-[12px] tracking-[0.2em] uppercase text-[var(--l-muted)]"
            animate={{ y: [0, 4, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            Scroll to rethink waste
            <span className="inline-block h-8 w-px bg-[var(--l-line)]" aria-hidden />
          </motion.a>

          <p className="sr-only">
            Portal entry: <Link href="/login">Customer Login</Link>
          </p>
        </motion.div>

        <LandingHeroVisual />
      </div>
    </section>
  )
}
