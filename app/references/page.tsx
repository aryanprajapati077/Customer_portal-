"use client"

import Link from "next/link"
import { Building2, Hotel, Briefcase, UtensilsCrossed, GraduationCap, ArrowRight, CheckCircle2 } from "lucide-react"
import { InspirePage, InspireCard } from "@/components/marketing/inspire-page"

const sectors = [
  {
    icon: Briefcase,
    title: "Fortune 500 Corporates",
    desc: "Leading corporations trust BuffIndia for cigarette waste management aligned with ESG goals, cleaner campuses, and measurable monthly impact reporting.",
  },
  {
    icon: Hotel,
    title: "Premium Hotels",
    desc: "Renowned hotel chains and boutique properties partner with BuffIndia for responsible disposal in guest and staff smoking zones—without compromising hospitality standards.",
  },
  {
    icon: UtensilsCrossed,
    title: "Restaurants, Bars & Cafés",
    desc: "Lifestyle venues use self-educative kiosks and hassle-free collection to keep outdoor areas cleaner while telling a clear sustainability story to patrons.",
  },
  {
    icon: GraduationCap,
    title: "Campuses & Institutions",
    desc: "Educational and institutional sites adopt BuffIndia services to model responsible waste habits and support the Butt Free India campaign.",
  },
  {
    icon: Building2,
    title: "Establishments Nationwide",
    desc: "Over 12,000+ businesses across 84+ cities and 22 states have joined the BuffIndia movement—from single sites to multi-location groups.",
  },
]

const trustPoints = [
  "End-to-end service: install, awareness, collect, recycle, report",
  "Upcycled EcoArt deliverables with optional brand customization",
  "Monthly impact insights suitable for internal ESG storytelling",
  "Proven footprint with hotels, corporates, and hospitality groups",
]

const stats = [
  { value: "12,000+", label: "Businesses Engaged" },
  { value: "84+", label: "Cities Reached" },
  { value: "22", label: "States Engaged" },
  { value: "86.4M+", label: "Butts Upcycled" },
]

export default function ReferencesPage() {
  return (
    <InspirePage
      eyebrow="Client references"
      title="Trusted by"
      accent="leaders"
      subtitle="BuffIndia is proud to be trusted by major Fortune 500 corporates, premium hotels, and renowned establishments across India—catching cigarette waste at the source and transforming it through recycling and EcoArt."
      cta={{ href: "/contact", label: "Get In Touch" }}
    >
      <div className="mb-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sectors.map((item, i) => (
          <InspireCard key={item.title} delay={i * 0.04} className={i === 4 ? "sm:col-span-2 lg:col-span-1" : undefined}>
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
          Why organizations choose us
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-[15px] text-[#5A5A5A]">
          References stay with BuffIndia because the service is operationally simple and the impact is visible—from
          cleaner smoking zones to products and reports they can share.
        </p>
        <ul className="mx-auto mt-8 max-w-xl space-y-3">
          {trustPoints.map((item) => (
            <li key={item} className="flex items-start gap-2 text-[14px] text-[#5A5A5A]">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1B7339]" strokeWidth={1.7} />
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-10 grid grid-cols-2 gap-6 border-t border-[#1B7339]/15 pt-10 text-center md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl tracking-tight text-[#1B7339]">
                {stat.value}
              </div>
              <div className="mt-1 text-[13px] text-[#5A5A5A]">{stat.label}</div>
            </div>
          ))}
        </div>
      </InspireCard>

      <div className="rounded-[28px] bg-[#141414] px-6 py-10 text-center text-white sm:px-10">
        <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.8rem,4vw,2.6rem)] leading-tight">
          Become a <em className="italic text-[#C8F000]">reference</em> partner
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[14px] leading-relaxed text-white/70">
          See logos on our{" "}
          <Link href="/supporter-page" className="text-[#C8F000] hover:underline">
            valued partners page
          </Link>
          , explore{" "}
          <Link href="/services" className="text-[#C8F000] hover:underline">
            our services
          </Link>
          , or contact us to join.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full bg-[#C8F000] px-5 py-2.5 text-[14px] font-semibold text-[#141414] hover:bg-[#d4f53a]"
          >
            Get In Touch
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/supporter-page"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-white/10"
          >
            View Partner Logos
          </Link>
        </div>
      </div>
    </InspirePage>
  )
}
