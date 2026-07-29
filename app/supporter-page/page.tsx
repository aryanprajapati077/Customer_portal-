"use client"

import Link from "next/link"
import { Heart, Users, Leaf, Megaphone, Recycle, ArrowRight, CheckCircle2 } from "lucide-react"
import { SupporterLogos } from "@/components/supporter-logos"
import { InspirePage, InspireCard } from "@/components/marketing/inspire-page"

const waysToSupport = [
  {
    icon: Heart,
    title: "Individual Supporters",
    desc: "Spread awareness in your community, advocate for responsible disposal, and inspire others to join the Butt Free India movement.",
  },
  {
    icon: Users,
    title: "Organizational Support",
    desc: "Businesses, NGOs, and institutions can host kiosks, fund collection drives, and amplify the campaign through partnerships.",
  },
  {
    icon: Leaf,
    title: "Campaign Advocacy",
    desc: "Help drive the mission by promoting sustainable cigarette waste practices across your network and social channels.",
  },
]

const campaignPillars = [
  {
    icon: Megaphone,
    title: "Awareness at the Source",
    text: "Self-educative disposal units and on-site activations change habits where litter begins—smoking zones at hotels, offices, and venues.",
  },
  {
    icon: Recycle,
    title: "Collection & Circularity",
    text: "Door-to-door pickup feeds BuffIndia's recovery loop: ash into bricks, tobacco into compost, and filter fibre into KraftReborn products.",
  },
  {
    icon: Leaf,
    title: "Visible Impact",
    text: "Partners receive measurable outcomes—butts diverted, toxic waste upcycled, and water protected—so progress is counted, not just claimed.",
  },
]

const helpItems = [
  "Host BuffIndia disposal units at your premises",
  "Sponsor awareness drives in your city or campus",
  "Share the campaign with hotels, corporates, and venues you know",
  "Shop KraftReborn products made from recovered cigarette waste",
  "Join as an affiliate partner and earn while you advocate",
]

export default function SupporterPage() {
  return (
    <InspirePage
      eyebrow="Butt Free India"
      title="Our valued"
      accent="partners"
      subtitle="We're proud to collaborate with visionary partners across India who share our mission for a cleaner, greener environment. From leading corporates to renowned hotels, these organizations turn cigarette waste from litter into livelihood and design."
      cta={{ href: "https://form.jotform.com/250602909519459", label: "Become a Partner" }}
    >
      <div className="mb-14">
        <SupporterLogos />
      </div>

      <section className="mb-14">
        <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.6rem,3.5vw,2.2rem)] tracking-tight text-[#141414]">
          The Butt Free India campaign
        </h2>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#5A5A5A]">
          Cigarette filters are plastic. When littered, they carry microplastics and toxic residue into streets, soil,
          and water. Our public campaign brings together supporters who refuse to treat butts as &quot;someone
          else&apos;s problem.&quot;
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaignPillars.map((item, i) => (
            <InspireCard key={item.title} delay={i * 0.04}>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#E8F5E9] text-[#1B7339]">
                <item.icon className="h-5 w-5" strokeWidth={1.7} />
              </div>
              <h3 className="text-[17px] font-semibold tracking-tight text-[#141414]">{item.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#5A5A5A]">{item.text}</p>
            </InspireCard>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {waysToSupport.map((item, i) => (
            <InspireCard key={item.title} delay={i * 0.04}>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#EF6C00]/12 text-[#EF6C00]">
                <item.icon className="h-5 w-5" strokeWidth={1.7} />
              </div>
              <h3 className="text-[17px] font-semibold tracking-tight text-[#141414]">{item.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#5A5A5A]">{item.desc}</p>
            </InspireCard>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <InspireCard>
          <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.5rem,3vw,2rem)] tracking-tight text-[#141414]">
            How you can help today
          </h2>
          <ul className="mt-6 space-y-3">
            {helpItems.map((item) => (
              <li key={item} className="flex items-start gap-2 text-[14px] text-[#5A5A5A]">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1B7339]" strokeWidth={1.7} />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-2.5 text-[14px] font-semibold text-[#141414] hover:bg-black/[0.03]"
            >
              Explore Our Services
            </Link>
            <a
              href="/dashboard/shop"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#1B7339] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#145a2c]"
            >
              Shop KraftReborn
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </InspireCard>
      </section>

      <div className="rounded-[28px] bg-[#141414] px-6 py-10 text-center text-white sm:px-10">
        <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.8rem,4vw,2.6rem)] leading-tight">
          Partner <em className="italic text-[#C8F000]">with us</em>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[14px] leading-relaxed text-white/70">
          Join BuffIndia&apos;s network—as a site partner, campaign supporter, or{" "}
          <Link href="/partner-program" className="text-[#C8F000] hover:underline">
            affiliate partner
          </Link>
          —and contribute to a cleaner, greener India.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="https://form.jotform.com/250602909519459"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#C8F000] px-5 py-2.5 text-[14px] font-semibold text-[#141414] hover:bg-[#d4f53a]"
          >
            Become a Partner
            <ArrowRight className="h-4 w-4" />
          </a>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-white/10"
          >
            Support the Campaign
          </Link>
          <Link
            href="/references"
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold text-white/80 hover:text-white"
          >
            View References
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 border-t border-white/15 pt-10 sm:grid-cols-3">
          <div>
            <div className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl text-[#C8F000]">86.4M+</div>
            <div className="mt-1 text-[13px] text-white/60">Cigarette Butts Upcycled</div>
          </div>
          <div>
            <div className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl text-[#C8F000]">1,200+</div>
            <div className="mt-1 text-[13px] text-white/60">Corporates & Hotel Partners</div>
          </div>
          <div>
            <div className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl text-[#C8F000]">84+</div>
            <div className="mt-1 text-[13px] text-white/60">Cities Served Across India</div>
          </div>
        </div>
      </div>
    </InspirePage>
  )
}
