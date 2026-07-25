"use client"

import { motion } from "framer-motion"
import { LandingProductComposition } from "@/components/landing/product-composition"
import { Reveal, RevealGroup, RevealItem } from "@/components/landing/reveal"

const streams = [
  {
    letter: "A",
    label: "Ash",
    title: "Into ash bricks",
    body: "Detoxified and reused through in-house machinery.",
  },
  {
    letter: "T",
    label: "Leftover tobacco",
    title: "Into compost",
    body: "Directed to composting to produce a nutrient-rich soil input.",
  },
  {
    letter: "F",
    label: "Filter fibre",
    title: "Into designed objects",
    body: "Cleaned, refined and combined with gypsum and clay for useful articles.",
  },
]

const products = [
  "COASTERS",
  "PLANTERS",
  "PHOTO FRAMES",
  "MOBILE STANDS",
  "VASES",
  "QR STANDS",
]

export function LandingRecovery() {
  const loop = [...products, ...products]

  return (
    <section id="recovery" className="border-t border-[var(--l-line)] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="landing-section-label mb-6">03 / The recovery loop</p>
          <h2 className="landing-display max-w-3xl text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.1] tracking-tight">
            One waste stream.
            <br />
            <em className="italic text-[var(--l-green)]">Three</em> new directions.
          </h2>
          <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-[var(--l-muted)]">
            At the recycling facility, each component is separated and given a more useful next life.
          </p>
        </Reveal>

        <div className="relative mt-14 grid gap-10 lg:grid-cols-[180px_1fr] lg:items-center">
          <Reveal>
            <div className="mx-auto flex aspect-square max-w-[180px] flex-col items-center justify-center rounded-full border border-[var(--l-line)] bg-white text-center shadow-[0_10px_30px_rgba(20,20,20,0.06)] lg:mx-0">
              <span className="mb-2 h-2 w-10 rounded-full bg-[var(--l-orange)]" />
              <p className="landing-display text-lg leading-tight">
                Collected
                <br />
                cigarette waste
              </p>
            </div>
          </Reveal>

          <div className="relative">
            <svg
              className="pointer-events-none absolute inset-0 hidden h-full w-full text-[var(--l-line)] lg:block"
              viewBox="0 0 560 320"
              fill="none"
              aria-hidden
            >
              <motion.path
                d="M 10 160 C 160 160, 180 40, 540 40"
                stroke="currentColor"
                strokeWidth="1.5"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
              />
              <motion.path
                d="M 10 160 C 180 160, 220 160, 540 160"
                stroke="currentColor"
                strokeWidth="1.5"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.1, ease: "easeInOut" }}
              />
              <motion.path
                d="M 10 160 C 160 160, 180 280, 540 280"
                stroke="currentColor"
                strokeWidth="1.5"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.2, ease: "easeInOut" }}
              />
            </svg>

            <RevealGroup className="relative grid gap-6 sm:grid-cols-3">
              {streams.map((s) => (
                <RevealItem key={s.letter}>
                  <article className="border-t border-[var(--l-ink)] bg-[var(--l-bg)]/80 pt-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--l-ink)] text-[13px] font-semibold text-white">
                      {s.letter}
                    </div>
                    <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--l-muted)]">
                      {s.label}
                    </p>
                    <h3 className="landing-display mt-2 text-xl tracking-tight">{s.title}</h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-[var(--l-muted)]">{s.body}</p>
                  </article>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </div>
      </div>

      <div className="mt-20 overflow-hidden border-y border-[var(--l-line)] bg-white/50 py-3">
        <div className="landing-marquee-track flex whitespace-nowrap">
          {loop.map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="mx-5 text-[13px] font-semibold tracking-[0.2em] text-[var(--l-muted)]"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-16 grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <Reveal>
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--l-orange)]">
            150+ possibilities
          </p>
          <h3 className="landing-display mt-3 max-w-xl text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.15]">
            Waste becomes <em className="italic">something worth keeping.</em>
          </h3>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--l-muted)]">
            Recovered fibre is shaped into corporate gifting and utility products, extending the
            story from responsible disposal to tangible circular design.
          </p>
        </Reveal>
        <Reveal delay={0.12}>
          <LandingProductComposition />
        </Reveal>
      </div>
    </section>
  )
}
