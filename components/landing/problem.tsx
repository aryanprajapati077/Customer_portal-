"use client"

import { Reveal } from "@/components/landing/reveal"

const marqueeItems = ["STREETS", "WATER", "WILDLIFE", "WORKPLACES"]

export function LandingProblem() {
  const loop = [...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems]

  return (
    <section id="problem" className="border-t border-[var(--l-line)] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="landing-section-label mb-6">01 / The overlooked problem</p>
        </Reveal>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <Reveal>
            <h2 className="landing-display text-[clamp(2.25rem,5vw,4rem)] leading-[1.1] tracking-tight">
              It is not
              <br />
              just a <em className="italic text-[var(--l-orange)]">butt.</em>
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="text-[16px] leading-relaxed text-[var(--l-muted)]">
              Cigarette filters are made with cellulose acetate, a form of plastic. When littered,
              they carry microplastics and toxic residue into streets, soil and water.
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div className="border-t border-[var(--l-ink)] pt-5">
                <p className="landing-display text-5xl tracking-tight">500 L</p>
                <p className="mt-3 text-[13px] leading-relaxed text-[var(--l-muted)]">
                  potential water pollution from one littered cigarette waste item
                </p>
              </div>
              <div className="border-t border-[var(--l-ink)] pt-5">
                <p className="landing-display text-5xl tracking-tight">&lt;1%</p>
                <p className="mt-3 text-[13px] leading-relaxed text-[var(--l-muted)]">
                  attempted recycling, as stated in the source write-up
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      <div className="mt-16 overflow-hidden border-y border-[var(--l-line)] bg-[var(--l-ink)] py-4">
        <div className="landing-marquee-track flex whitespace-nowrap">
          {loop.map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="landing-display mx-6 text-2xl sm:text-3xl italic text-[#F7F6F2]/90"
            >
              {item}
              <span className="mx-6 not-italic text-[var(--l-orange)]">·</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
