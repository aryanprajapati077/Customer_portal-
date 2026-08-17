"use client"

import { Mail, Phone, MapPin, Linkedin, Twitter, Instagram } from "lucide-react"
import Image from "next/image"

const quickLinks = [
  { name: "Home", href: "/" },
  { name: "Calculate Impact", href: "/#calculator" },
  { name: "KraftReborn", href: "/#kraftreborn" },
  { name: "Our Services", href: "/services" },
  { name: "Partner Program", href: "/partner-program" },
  { name: "Contact Us", href: "/contact" },
  { name: "WhatsApp", href: "https://wa.me/919512120366" },
]
const getInvolvedLinks = [
  { name: "Become a Partner", href: "/partner-program" },
  { name: "Support the Campaign", href: "/supporter-page" },
  { name: "Shop KraftReborn", href: "/dashboard/shop" },
  { name: "Customer Login", href: "/login" },
  { name: "References", href: "/references" },
  { name: "Recognitions", href: "/recognitions" },
]
const legalLinks = [
  { name: "Privacy Policy", href: "/privacy-policy" },
  { name: "Terms of Service", href: "/terms-of-service" },
]

const socialLinks = [
  { icon: Linkedin, href: "https://in.linkedin.com/company/buffindia", label: "LinkedIn" },
  { icon: Twitter, href: "https://twitter.com/buffindia", label: "Twitter" },
  { icon: Instagram, href: "https://www.instagram.com/buffindia.buttbins/", label: "Instagram" },
]

export function Footer() {
  return (
    <footer className="overflow-x-clip border-t border-[#D9D6CF] bg-[#141414] py-12 text-white sm:py-16 lg:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 grid grid-cols-1 gap-8 sm:mb-16 sm:grid-cols-2 lg:grid-cols-6 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-2">
            <a href="/" className="mb-5 flex items-center gap-3 sm:mb-6">
              <Image
                src="/logo.svg"
                alt="BuffIndia Logo"
                width={160}
                height={48}
                className="h-10 w-auto object-contain brightness-0 invert"
              />
            </a>
            <p className="mb-5 text-sm leading-relaxed text-white/65 sm:mb-6 sm:text-base">
              India&apos;s first end-to-end cigarette waste management. We collect, recycle, and
              transform cigarette waste into sustainable products for a Butt Free India.
            </p>
            <div className="space-y-2.5 sm:space-y-3">
              <a
                href="mailto:campaign@buffindia.com"
                className="flex items-center gap-2 text-sm text-white/65 transition-colors hover:text-white sm:gap-3 sm:text-base"
              >
                <Mail className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span className="break-all">campaign@buffindia.com</span>
              </a>
              <a
                href="tel:+919512120366"
                className="flex items-center gap-2 text-sm text-white/65 transition-colors hover:text-white sm:gap-3 sm:text-base"
              >
                <Phone className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                +91-9512120366
              </a>
              <div className="flex items-start gap-2 text-sm text-white/65 sm:gap-3 sm:text-base">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                Village-Kuha, Ahmedabad-Indore Hwy, Kuha, Ahmedabad, Gujarat, India- 382433
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold sm:mb-4 sm:text-base">Quick Links</h4>
            <ul className="space-y-2 sm:space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-sm text-white/65 transition-colors hover:text-white">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold sm:mb-4 sm:text-base">Get Involved</h4>
            <ul className="space-y-2 sm:space-y-3">
              {getInvolvedLinks.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-sm text-white/65 transition-colors hover:text-white">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold sm:mb-4 sm:text-base">Legal</h4>
            <ul className="space-y-2 sm:space-y-3">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-sm text-white/65 transition-colors hover:text-white">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row sm:pt-8">
          <p className="text-center text-xs text-white/55 sm:text-left sm:text-sm">
            © {new Date().getFullYear()} BuffIndia. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-8">
            <a href="/" className="transition-opacity hover:opacity-90">
              <Image
                src="/logo.svg"
                alt="Buffindia"
                width={120}
                height={36}
                className="h-8 w-auto object-contain"
              />
            </a>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition-all hover:bg-[#1B7339] hover:text-white sm:h-10 sm:w-10"
              >
                <social.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 overflow-hidden border-t border-white/10 px-4 pt-10 sm:mt-10 sm:px-6 sm:pt-12 lg:px-8">
        <span className="block max-w-full truncate font-[family-name:var(--font-display)] text-[clamp(2.75rem,12vw,11rem)] font-normal leading-[0.85] tracking-tight text-white/90">
          Buff<em className="italic text-[#C8F000]">India</em>
        </span>
      </div>
    </footer>
  )
}
