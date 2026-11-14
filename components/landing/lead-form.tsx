import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

/** Closing call-to-action band (the enquiry form lives in the "Get in touch" section above). */
export function LandingLeadForm() {
  return (
    <section id="proposal" className="scroll-mt-24 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-black/[0.06]">
          <Image src="/auth/login-greenery.jpg" alt="" fill className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F1F14]/90 via-[#0F1F14]/65 to-[#0F1F14]/25" />
          <div className="relative px-7 py-14 sm:px-12 sm:py-20 lg:max-w-2xl">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#C8F000]">
              Ready to create
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2rem,3.8vw,2.9rem)] leading-[1.1] tracking-tight text-white">
              A <em className="italic text-[#C8F000]">cleaner tomorrow?</em>
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-white/85 sm:text-[16px]">
              Infrastructure, collection, recycling and ESG reporting — one calm operating system.
              Let&apos;s plan it for your sites.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#calculator" className="inline-flex h-12 items-center rounded-full bg-[#C8F000] px-7 text-[14px] font-semibold text-[#0F1F14] transition hover:bg-[#d8ff1a]">
                Get a proposal
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
              <Link
                href="/products"
                className="inline-flex h-12 items-center rounded-full border border-white/50 px-7 text-[14px] font-medium text-white transition hover:bg-white/10"
              >
                Explore KraftReborn
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
