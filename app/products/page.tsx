"use client"

import Link from "next/link"
import { Sparkles, DollarSign, Users, Package, ArrowRight, Recycle, CheckCircle2 } from "lucide-react"
import { InspirePage, InspireCard } from "@/components/marketing/inspire-page"

const features = [
  {
    icon: DollarSign,
    title: "Budget-Friendly",
    description: "Sustainable products that don't compromise on affordability—ideal for corporate gifting at scale.",
  },
  {
    icon: Users,
    title: "Empowering Women",
    description: "Products are handcrafted by stay-at-home mothers and community artisans, supporting livelihoods.",
  },
  {
    icon: Package,
    title: "Customized Branding & Packaging",
    description: "Perfect for gifting, with your branding, logo, and a sustainability story included.",
  },
  {
    icon: Sparkles,
    title: "Eco-Friendly & Handcrafted",
    description: "Each piece is crafted with care using recycled cigarette waste fibres and natural materials.",
  },
]

const recoveryStreams = [
  {
    letter: "A",
    title: "Ash → Bricks",
    body: "Detoxified ash is reused through in-house machinery into useful construction-oriented forms.",
  },
  {
    letter: "T",
    title: "Tobacco → Compost",
    body: "Leftover tobacco is directed to composting to produce a nutrient-rich soil input.",
  },
  {
    letter: "F",
    title: "Filter Fibre → Objects",
    body: "Cleaned fibre is refined and combined with gypsum and clay for designed articles and décor.",
  },
]

const productTypes = ["Coasters", "Planters", "Photo frames", "Mobile stands", "Vases", "QR stands"]

const useCases = [
  "Celebrating special occasions with thoughtful, eco-friendly items",
  "Personalized corporate gifting with a sustainability message",
  "Sustainable home and office décor that starts conversations",
  "Client welcome kits and conference giveaways with measurable impact",
]

const benefits = [
  "Aligning with sustainability goals while saving on costs",
  "Empowering women artisans and fostering livelihood opportunities",
  "Supporting waste management and recycling initiatives",
  "Closing the loop on cigarette waste collected through BuffIndia services",
]

export default function ProductsPage() {
  return (
    <InspirePage
      eyebrow="KraftReborn by BuffIndia"
      title="Waste becomes"
      accent="design"
      subtitle="World's first e-commerce store for sustainable décor & gifting. Handcrafted from recycled cigarette waste—budget-friendly, purposeful, and proof that litter can become design."
      cta={{ href: "/dashboard/shop", label: "Shop KraftReborn Now" }}
    >
      <section className="mb-14">
        <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.6rem,3.5vw,2.2rem)] tracking-tight text-[#141414]">
          From waste stream to product
        </h2>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#5A5A5A]">
          One waste stream. Three new directions—then into objects you can gift and display.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recoveryStreams.map((stream, i) => (
            <InspireCard key={stream.letter} delay={i * 0.04}>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#1B7339]/15 text-[15px] font-bold text-[#1B7339]">
                {stream.letter}
              </div>
              <h3 className="text-[17px] font-semibold tracking-tight text-[#141414]">{stream.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#5A5A5A]">{stream.body}</p>
            </InspireCard>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          {productTypes.map((name) => (
            <span
              key={name}
              className="rounded-full border border-black/10 bg-white/80 px-4 py-2 text-[13px] font-medium text-[#5A5A5A]"
            >
              {name}
            </span>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.6rem,3.5vw,2.2rem)] tracking-tight text-[#141414]">
          What sets KraftReborn apart
        </h2>
        <p className="mt-2 text-[15px] text-[#5A5A5A]">Sustainability meets craftsmanship.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {features.map((feature, i) => (
            <InspireCard key={feature.title} delay={i * 0.04}>
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E8F5E9] text-[#1B7339]">
                  <feature.icon className="h-5 w-5" strokeWidth={1.7} />
                </div>
                <div>
                  <h3 className="text-[17px] font-semibold tracking-tight text-[#141414]">{feature.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-[#5A5A5A]">{feature.description}</p>
                </div>
              </div>
            </InspireCard>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <InspireCard>
          <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.5rem,3vw,2rem)] tracking-tight text-[#141414]">
            Why choose KraftReborn?
          </h2>
          <p className="mt-2 text-[15px] text-[#5A5A5A]">Purposeful décor & gifts for every occasion.</p>
          <p className="mt-6 text-[14px] font-medium text-[#141414]">KraftReborn products are perfect for:</p>
          <ul className="mt-3 space-y-2">
            {useCases.map((item) => (
              <li key={item} className="flex items-start gap-2 text-[14px] text-[#5A5A5A]">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1B7339]" strokeWidth={1.7} />
                {item}
              </li>
            ))}
          </ul>
          <h3 className="mt-8 text-[17px] font-semibold tracking-tight text-[#141414]">
            The bigger picture – more than just products
          </h3>
          <p className="mt-2 text-[14px] text-[#5A5A5A]">By choosing KraftReborn, you&apos;re making a difference:</p>
          <ul className="mt-3 space-y-2">
            {benefits.map((item) => (
              <li key={item} className="flex items-start gap-2 text-[14px] text-[#5A5A5A]">
                <Recycle className="mt-0.5 h-5 w-5 shrink-0 text-[#EF6C00]" strokeWidth={1.7} />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[13px] text-[#5A5A5A]">
            Site partners on BuffIndia&apos;s{" "}
            <Link href="/services" className="font-medium text-[#1B7339] hover:underline">
              annual service
            </Link>{" "}
            often receive branded KraftReborn as part of their sustainability package.
          </p>
        </InspireCard>
      </section>

      <div className="rounded-[28px] bg-[#141414] px-6 py-10 text-center text-white sm:px-10">
        <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.8rem,4vw,2.6rem)] leading-tight">
          Explore the <em className="italic text-[#C8F000]">collection</em>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[14px] leading-relaxed text-white/70">
          Browse sustainable décor and gifting on our KraftReborn store—or learn how collection services feed this circular
          catalogue.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="/dashboard/shop"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#C8F000] px-5 py-2.5 text-[14px] font-semibold text-[#141414] hover:bg-[#d4f53a]"
          >
            Shop KraftReborn Now
            <ArrowRight className="h-4 w-4" />
          </a>
          <Link
            href="/services"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-white/10"
          >
            See Collection Services
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold text-white/80 hover:text-white"
          >
            Ask About Corporate Gifting
          </Link>
        </div>
      </div>
    </InspirePage>
  )
}
