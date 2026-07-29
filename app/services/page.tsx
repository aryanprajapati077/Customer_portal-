"use client"

import Link from "next/link"
import {
  Package,
  Megaphone,
  Truck,
  Recycle,
  Palette,
  Gift,
  BarChart3,
  Users,
  Building2,
  ArrowRight,
} from "lucide-react"
import { InspirePage, InspireCard } from "@/components/marketing/inspire-page"

const services = [
  {
    icon: Package,
    title: "Disposal unit installation",
    description:
      "Self-educative cigarette waste kiosks installed at your premises — designed so the right action is obvious.",
  },
  {
    icon: Megaphone,
    title: "Awareness programmes",
    description:
      "On-site activities that inspire patrons and employees to adopt responsible disposal habits.",
  },
  {
    icon: Truck,
    title: "Door-to-door collection",
    description:
      "Reliable pickup from smoking areas to local storage — hassle-free for your operations team.",
  },
  {
    icon: Recycle,
    title: "Recovery & recycling",
    description:
      "Waste is weighed, segregated and routed into ash bricks, compost and designed objects.",
  },
  {
    icon: Palette,
    title: "KraftReborn upcycled products",
    description:
      "Filter fibre becomes décor and gifting — circular design your brand can show off.",
  },
  {
    icon: Gift,
    title: "Branded sustainability gifts",
    description:
      "Custom upcycled products with your logo — included with partnership, not sold as an add-on.",
  },
  {
    icon: BarChart3,
    title: "Monthly impact reporting",
    description:
      "Butts diverted, water protected, waste upcycled — measurable ESG outcomes every month.",
  },
  {
    icon: Users,
    title: "Community livelihoods",
    description:
      "Partnerships support artisans and local labour who handcraft KraftReborn products.",
  },
  {
    icon: Building2,
    title: "Trusted enterprise partner",
    description:
      "Fortune 500 corporates, hotels and campuses across India choose BuffIndia.",
  },
]

export default function ServicesPage() {
  return (
    <InspirePage
      eyebrow="Our services"
      title="One system."
      accent="Full circle."
      subtitle="From kiosk to collection to recovery to report — BuffIndia runs the loop so your spaces stay litter-free and your impact stays visible."
      cta={{ href: "/contact", label: "Start a conversation" }}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s, i) => (
          <InspireCard key={s.title} delay={i * 0.04}>
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#E8F5E9] text-[#1B7339]">
              <s.icon className="h-5 w-5" strokeWidth={1.7} />
            </div>
            <h3 className="text-[17px] font-semibold tracking-tight text-[#141414]">{s.title}</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-[#5A5A5A]">{s.description}</p>
          </InspireCard>
        ))}
      </div>

      <div className="mt-14 rounded-[28px] bg-[#141414] px-6 py-10 text-center text-white sm:px-10">
        <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.8rem,4vw,2.6rem)] leading-tight">
          Ready to make your space <em className="italic text-[#C8F000]">litter-free</em>?
        </h2>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#C8F000] px-5 py-2.5 text-[14px] font-semibold text-[#141414] hover:bg-[#d4f53a]"
        >
          Customer login
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </InspirePage>
  )
}
