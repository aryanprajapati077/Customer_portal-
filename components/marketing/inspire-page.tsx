"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { cn } from "@/lib/utils"

export function InspirePage({
  eyebrow,
  title,
  accent,
  subtitle,
  children,
  cta,
}: {
  eyebrow: string
  title: string
  accent?: string
  subtitle: string
  children: React.ReactNode
  cta?: { href: string; label: string }
}) {
  return (
    <div className="landing-root relative min-h-screen overflow-x-clip bg-[var(--l-cream,#F7F6F2)] text-[var(--l-ink,#141414)]">
      <Navbar />
      <main className="relative pb-20">
        {/* Hero bleeds under the transparent fixed navbar (same as homepage) */}
        <section className="relative overflow-hidden border-b border-black/5 pt-28 sm:pt-32">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(200,240,0,0.18),_transparent_55%),radial-gradient(ellipse_at_80%_20%,_rgba(239,108,0,0.12),_transparent_40%)]"
          />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-14 sm:pb-20">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#1B7339]/80"
            >
              {eyebrow}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mt-4 max-w-3xl font-[family-name:var(--font-display)] text-[clamp(2.4rem,6vw,4.2rem)] leading-[1.05] tracking-tight"
            >
              {title}{" "}
              {accent ? <em className="italic text-[#1B7339]">{accent}</em> : null}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="mt-5 max-w-2xl text-[16px] sm:text-[17px] leading-relaxed text-[#5A5A5A]"
            >
              {subtitle}
            </motion.p>
            {cta ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
                className="mt-8"
              >
                <Link
                  href={cta.href}
                  className="inline-flex items-center gap-2 rounded-full bg-[#1B7339] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#145a2c] transition-colors"
                >
                  {cta.label}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ) : null}
          </div>
        </section>

        <div className={cn("mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16")}>{children}</div>
      </main>
      <Footer />
    </div>
  )
}

export function InspireCard({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "rounded-2xl border border-black/[0.06] bg-white/80 p-6 shadow-[0_1px_0_rgba(0,0,0,0.03)] backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </motion.div>
  )
}
