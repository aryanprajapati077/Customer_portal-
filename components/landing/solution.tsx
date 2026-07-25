"use client"

import { LandingKiosk } from "@/components/landing/kiosk"
import { Reveal, RevealGroup, RevealItem } from "@/components/landing/reveal"

const steps = [
  {
    num: "01",
    title: "Segregate",
    body: "Self-educative disposal kiosks make the right action obvious at the moment it matters.",
  },
  {
    num: "02",
    title: "Collect",
    body: "Door-to-door pickup creates a reliable path from smoking areas to local storage.",
  },
  {
    num: "03",
    title: "Recycle",
    body: "Waste is weighed, segregated, cleaned and routed into purpose-built recovery streams.",
  },
  {
    num: "04",
    title: "Report",
    body: "Monthly impact reporting turns an invisible waste problem into a measurable outcome.",
  },
]

export function LandingSolution() {
  return (
    <section
      id="solution"
      className="border-t border-[var(--l-line)] bg-[var(--l-ink)] py-20 text-[#F7F6F2] sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="landing-section-label mb-6 text-white/55">02 / One connected solution</p>
          <p className="mb-3 text-[13px] font-medium uppercase tracking-wide text-[var(--l-orange)]">
            From habit to circularity
          </p>
          <h2 className="landing-display max-w-3xl text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.1] tracking-tight">
            Catch it at the source.
            <br />
            <em className="italic text-[#C8F000]">Transform</em> what remains.
          </h2>
        </Reveal>

        <div
          id="process"
          className="mt-14 grid items-center gap-10 scroll-mt-28 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8"
        >
          <Reveal delay={0.08}>
            <div className="bg-transparent">
              <LandingKiosk />
            </div>
          </Reveal>

          <RevealGroup className="space-y-0">
            {steps.map((step, i) => (
              <RevealItem key={step.num}>
                <article
                  className={`border-t border-white/15 py-6 ${i === steps.length - 1 ? "border-b" : ""}`}
                >
                  <div className="flex gap-5">
                    <span className="text-[12px] font-semibold tracking-[0.16em] text-[var(--l-orange)]">
                      {step.num}
                    </span>
                    <div>
                      <h3 className="landing-display text-2xl tracking-tight">{step.title}</h3>
                      <p className="mt-2 max-w-md text-[14px] leading-relaxed text-white/60">
                        {step.body}
                      </p>
                    </div>
                  </div>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  )
}
