"use client"

import Image from "next/image"

const PARTNERS = [
  { src: "/supporters/partner-logo-clear/taj.png", alt: "Taj" },
  { src: "/supporters/partner-logo-clear/marriott.png", alt: "Marriott" },
  { src: "/supporters/partner-logo-clear/the-fern.png", alt: "The Fern" },
  { src: "/supporters/partner-logo-clear/hilton.png", alt: "Hilton" },
  { src: "/supporters/partner-logo-clear/hyatt.png", alt: "Hyatt" },
  { src: "/supporters/partner-logo-clear/radisson.png", alt: "Radisson" },
  { src: "/supporters/partner-logo-clear/accor.png", alt: "Accor" },
  { src: "/supporters/partner-logo-clear/itc-hotel.png", alt: "ITC Hotels" },
  { src: "/supporters/partner-logo-clear/amazon.png", alt: "Amazon" },
  { src: "/supporters/partner-logo-clear/novotel.png", alt: "Novotel" },
  { src: "/supporters/partner-logo-clear/park-hyatt.png", alt: "Park Hyatt" },
  { src: "/supporters/partner-logo-clear/fairfield-marriott.png", alt: "Fairfield by Marriott" },
]

function LogoRow({ keyPrefix }: { keyPrefix: string }) {
  return (
    <div className="flex shrink-0 items-center gap-0 px-0">
      {PARTNERS.map((p) => (
        <div
          key={`${keyPrefix}-${p.alt}`}
          className="relative h-16 w-[160px] shrink-0 opacity-90 transition-opacity duration-300 hover:opacity-100 sm:h-[4.5rem] sm:w-[190px]"
        >
          <Image
            src={p.src}
            alt={p.alt}
            fill
            className="object-contain object-center"
            sizes="190px"
          />
        </div>
      ))}
    </div>
  )
}

export function LandingPartners() {
  return (
    <section className="group/marquee border-b border-black/5 bg-transparent py-12 sm:py-14">
      <p className="px-4 text-center text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5C5C5C]">
        Trusted by leading organisations
      </p>

      <div className="relative mt-8 overflow-hidden">
        {/* Soft edge fades */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#F7F6F2] to-transparent sm:w-24"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#F7F6F2] to-transparent sm:w-24"
        />

        <div className="landing-marquee-track flex w-max items-center">
          <LogoRow keyPrefix="a" />
          <LogoRow keyPrefix="b" />
        </div>
      </div>
    </section>
  )
}
