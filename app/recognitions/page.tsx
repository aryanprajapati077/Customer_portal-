"use client"

import Link from "next/link"
import { Award, Target, Lightbulb, TrendingUp, ArrowRight } from "lucide-react"
import { InspirePage, InspireCard } from "@/components/marketing/inspire-page"

const recognitions = [
  {
    icon: Award,
    title: "Atal Innovation Mission",
    desc: "BuffIndia is proud to be supported by the Atal Innovation Mission, recognizing our innovative approach to cigarette waste management and circular design.",
  },
  {
    icon: Lightbulb,
    title: "India's First End-to-End Solution",
    desc: "Recognized as India's first comprehensive cigarette waste management solution—from self-educative disposal and collection to recycling, KraftReborn, and impact reporting.",
  },
  {
    icon: Target,
    title: "Founded 2018 · Ahmedabad",
    desc: "Established with a vision for a Butt Free India. From a single city mission to serving thousands of businesses across dozens of states and cities.",
  },
  {
    icon: TrendingUp,
    title: "Nationwide Impact",
    desc: "Reaching 84+ cities and 22 states, upcycling tens of millions of cigarette butts, and creating livelihoods for students, unskilled labour, and stay-at-home mothers.",
  },
]

const milestones = [
  { value: "2018", label: "Founded in Ahmedabad" },
  { value: "22", label: "States engaged" },
  { value: "84+", label: "Cities reached" },
  { value: "12,000+", label: "Businesses engaged" },
]

export default function RecognitionsPage() {
  return (
    <InspirePage
      eyebrow="Awards & achievements"
      title="Our"
      accent="recognitions"
      subtitle="BuffIndia has been recognized for innovation and impact in cigarette waste management—building India's first end-to-end path from littered filters to recycled materials, KraftReborn products, and measurable ESG outcomes."
      cta={{ href: "/contact", label: "Partner With BuffIndia" }}
    >
      <div className="mb-14 grid gap-4 sm:grid-cols-2">
        {recognitions.map((item, i) => (
          <InspireCard key={item.title} delay={i * 0.04}>
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#E8F5E9] text-[#1B7339]">
              <item.icon className="h-5 w-5" strokeWidth={1.7} />
            </div>
            <h3 className="text-[17px] font-semibold tracking-tight text-[#141414]">{item.title}</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-[#5A5A5A]">{item.desc}</p>
          </InspireCard>
        ))}
      </div>

      <InspireCard className="mb-14 border-[#1B7339]/15 bg-[#E8F5E9]/40">
        <h2 className="text-center font-[family-name:var(--font-display)] text-[clamp(1.5rem,3vw,2rem)] tracking-tight text-[#141414]">
          Milestones that matter
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-[15px] text-[#5A5A5A]">
          Recognition is meaningful when it translates into reach—more sites served, more butts diverted, and more
          communities empowered through circular craft.
        </p>
        <div className="mt-10 grid grid-cols-2 gap-6 text-center md:grid-cols-4">
          {milestones.map((item) => (
            <div key={item.label}>
              <div className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl tracking-tight text-[#1B7339]">
                {item.value}
              </div>
              <div className="mt-1 text-[13px] text-[#5A5A5A]">{item.label}</div>
            </div>
          ))}
        </div>
      </InspireCard>

      <div className="rounded-[28px] bg-[#141414] px-6 py-10 text-center text-white sm:px-10">
        <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.8rem,4vw,2.6rem)] leading-tight">
          Bring BuffIndia to <em className="italic text-[#C8F000]">your organization</em>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[14px] leading-relaxed text-white/70">
          Explore{" "}
          <Link href="/services" className="text-[#C8F000] hover:underline">
            how our service works
          </Link>
          , meet{" "}
          <Link href="/supporter-page" className="text-[#C8F000] hover:underline">
            the partners who trust us
          </Link>
          , or get in touch.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full bg-[#C8F000] px-5 py-2.5 text-[14px] font-semibold text-[#141414] hover:bg-[#d4f53a]"
          >
            Partner With BuffIndia
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/references"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-white/10"
          >
            View References
          </Link>
        </div>
      </div>
    </InspirePage>
  )
}
