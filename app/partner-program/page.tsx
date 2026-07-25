"use client"

import Link from "next/link"
import { Users, Award, Gift, TrendingUp, Target, ArrowRight, CheckCircle2 } from "lucide-react"
import { InspirePage, InspireCard } from "@/components/marketing/inspire-page"

const whyPartner = [
  {
    title: "Promote Transformation",
    text: "Inspire businesses and individuals to adopt end-to-end cigarette waste solutions—from kiosk installation to EcoArt upcycling.",
  },
  {
    title: "Expand Our Reach",
    text: "Introduce BuffIndia to hotels, corporates, bars, restaurants, cafés, campuses, and facility managers in your network.",
  },
  {
    title: "Raise Awareness",
    text: "Advocate for responsible cigarette waste disposal and help grow the Butt Free India campaign in your community.",
  },
]

const benefits = [
  {
    icon: Target,
    text: "Exclusive Training: Weekly onboarding sessions and ongoing support so you can pitch with confidence.",
  },
  {
    icon: TrendingUp,
    text: "Real-Time Updates: Stay informed about the progress of every lead you provide.",
  },
  {
    icon: Award,
    text: "Certification of Affiliation: Official recognition of your commitment to sustainability.",
  },
  {
    icon: Gift,
    text: "Complimentary Products: Free vouchers for BuffIndia's upcycled sustainable décor and gifting.",
  },
  {
    icon: Users,
    text: "Financial Rewards: Earn commissions for every lead that converts into a client.",
  },
]

const steps = [
  {
    step: "1",
    title: "Sign Up",
    desc: "Express your interest via our partner form. We'll review and onboard you quickly.",
  },
  {
    step: "2",
    title: "Promote",
    desc: "Use BuffIndia's video content and resources to raise awareness in your local area.",
  },
  {
    step: "3",
    title: "Source Leads",
    desc: "Share details of potential clients—hotels, corporates, venues—with our sales team.",
  },
  {
    step: "4",
    title: "Earn Rewards",
    desc: "Receive commissions and exclusive perks for every successful lead conversion.",
  },
]

const whoCanJoin = [
  "Organizations & individuals passionate about environmental impact",
  "Facility management providers catering to businesses & campuses",
  "NGOs and community groups focused on sustainability",
  "Hospitality & corporate consultants with active client networks",
]

const stats = [
  { value: "22", label: "States Engaged" },
  { value: "84+", label: "Cities Reached" },
  { value: "12,000+", label: "Businesses Engaged" },
  { value: "12", label: "Affiliated Partners" },
]

export default function PartnerProgramPage() {
  return (
    <InspirePage
      eyebrow="Affiliate partner program"
      title="Partner with"
      accent="BuffIndia"
      subtitle="Join the movement for a cleaner, greener India. As an affiliate partner, you help businesses catch waste at the source, route it into BuffIndia's recovery loop, and turn litter into EcoArt—while earning meaningful rewards."
      cta={{ href: "https://form.jotform.com/250602909519459", label: "Sign Up Now" }}
    >
      <section className="mb-14">
        <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.6rem,3.5vw,2.2rem)] tracking-tight text-[#141414]">
          Why partner with BuffIndia?
        </h2>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#5A5A5A]">
          Make an impact in your community. You&apos;ll spread awareness about cigarette waste management while
          empowering others to adopt sustainable practices.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {whyPartner.map((item, i) => (
            <InspireCard key={item.title} delay={i * 0.04}>
              <CheckCircle2 className="mb-4 h-7 w-7 text-[#1B7339]" strokeWidth={1.7} />
              <h3 className="text-[17px] font-semibold tracking-tight text-[#141414]">{item.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#5A5A5A]">{item.text}</p>
            </InspireCard>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.6rem,3.5vw,2.2rem)] tracking-tight text-[#141414]">
          Affiliate partner benefits
        </h2>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#5A5A5A]">
          Training, tools, recognition, and rewards—built for change-makers.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((item, i) => (
            <InspireCard key={item.text} delay={i * 0.04}>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#E8F5E9] text-[#1B7339]">
                <item.icon className="h-5 w-5" strokeWidth={1.7} />
              </div>
              <p className="text-[14px] leading-relaxed text-[#5A5A5A]">{item.text}</p>
            </InspireCard>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.6rem,3.5vw,2.2rem)] tracking-tight text-[#141414]">
          How it works
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-[#5A5A5A]">Becoming a partner is simple.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item, i) => (
            <InspireCard key={item.step} delay={i * 0.04}>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#EF6C00]/15 text-[15px] font-bold text-[#EF6C00]">
                {item.step}
              </div>
              <h3 className="text-[17px] font-semibold tracking-tight text-[#141414]">{item.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#5A5A5A]">{item.desc}</p>
            </InspireCard>
          ))}
        </div>
        <div className="mt-8">
          <a
            href="https://form.jotform.com/250602909519459"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#1B7339] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#145a2c]"
          >
            Sign Up as a Partner
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      <section className="mb-14">
        <InspireCard>
          <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.5rem,3vw,2rem)] tracking-tight text-[#141414]">
            Who can join
          </h2>
          <p className="mt-2 text-[15px] text-[#5A5A5A]">
            Calling all change-makers! We&apos;re looking for individuals and organizations who share our vision:
          </p>
          <ul className="mt-6 space-y-3">
            {whoCanJoin.map((item) => (
              <li key={item} className="flex items-start gap-2 text-[14px] text-[#5A5A5A]">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1B7339]" strokeWidth={1.7} />
                {item}
              </li>
            ))}
          </ul>
        </InspireCard>
      </section>

      <section className="mb-14">
        <InspireCard className="border-[#1B7339]/15 bg-[#E8F5E9]/40">
          <h2 className="text-center font-[family-name:var(--font-display)] text-[clamp(1.5rem,3vw,2rem)] tracking-tight text-[#141414]">
            Highlighting impact
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-[15px] text-[#5A5A5A]">
            Together, we&apos;ve already made a difference. Join a growing community transforming cigarette waste
            management across India.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-6 text-center md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[#1B7339]">
                  {stat.value}
                </div>
                <div className="mt-1 text-[13px] text-[#5A5A5A]">{stat.label}</div>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-[14px] text-[#5A5A5A]">
            Be part of this journey—and help us reach even more cities and sites.
          </p>
        </InspireCard>
      </section>

      <div className="rounded-[28px] bg-[#141414] px-6 py-10 text-center text-white sm:px-10">
        <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.8rem,4vw,2.6rem)] leading-tight">
          Ready to get <em className="italic text-[#C8F000]">started</em>?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[14px] leading-relaxed text-white/70">
          Learn more about our{" "}
          <Link href="/services" className="text-[#C8F000] hover:underline">
            end-to-end services
          </Link>
          , meet our{" "}
          <Link href="/supporter-page" className="text-[#C8F000] hover:underline">
            valued partners
          </Link>
          , or fill out the signup form.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="https://form.jotform.com/250602909519459"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#C8F000] px-5 py-2.5 text-[14px] font-semibold text-[#141414] hover:bg-[#d4f53a]"
          >
            Sign Up Now
            <ArrowRight className="h-4 w-4" />
          </a>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-white/10"
          >
            Talk to Our Team
          </Link>
        </div>
      </div>
    </InspirePage>
  )
}
