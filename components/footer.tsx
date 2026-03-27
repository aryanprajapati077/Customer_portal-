"use client"

import { Mail, Phone, MapPin, Linkedin, Twitter, Instagram } from "lucide-react"
import Image from "next/image"

const quickLinks = [
  { name: "Home", href: "/" },
  { name: "Our Services", href: "/services" },
  { name: "EcoArt by BuffIndia", href: "https://ecoart.buffindia.com" },
  { name: "Public Campaign", href: "/supporter-page" },
  { name: "Partner Program", href: "/partner-program" },
  { name: "Supporter Page", href: "/supporter-page" },
  { name: "Contact Us", href: "/contact" },
  { name: "WhatsApp", href: "https://wa.me/919512120366" },
]
const getInvolvedLinks = [
  { name: "Become a Partner", href: "/partner-program" },
  { name: "Support the Campaign", href: "/supporter-page" },
  { name: "Shop EcoArt", href: "https://ecoart.buffindia.com" },
  { name: "References", href: "/references" },
  { name: "Recognitions", href: "/recognitions" },
  { name: "Donate", href: "/contact" },
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
    <footer className="bg-foreground text-background py-12 sm:py-16 lg:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-8 mb-12 sm:mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-2 sm:col-span-2">
            <a href="#" className="flex items-center gap-3 mb-5 sm:mb-6">
              <div className="w-40 h-9 sm:w-10 sm:h-10 flex items-center justify-center">
                <Image
                  src="/logo.svg"
                  alt="BuffIndia Logo"
                  width={80}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
              
            </a>
            <p className="text-sm sm:text-base text-background/70 mb-5 sm:mb-6 leading-relaxed">
              India&apos;s first end-to-end cigarette waste management. We collect, recycle, and transform cigarette
              waste into sustainable products for a Butt Free India.
            </p>
            <div className="space-y-2.5 sm:space-y-3">
              <a
                href="mailto:campaign@buffindia.com"
                className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-background/70 hover:text-background transition-colors"
              >
                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="break-all">campaign@buffindia.com</span>
              </a>
              <a
                href="tel:+919512120366"
                className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-background/70 hover:text-background transition-colors"
              >
                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                +91-9512120366
              </a>
              <div className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-background/70">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                Village-Kuha, Ahmedabad-Indore Hwy, Kuha, Ahmedabad, Gujarat, India- 382433
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm sm:text-base text-background mb-3 sm:mb-4">Quick Links</h4>
            <ul className="space-y-2 sm:space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className={`text-sm transition-colors ${
                      link.name === "Partner Program" ? "text-primary font-medium hover:text-primary/90" : "text-background/70 hover:text-background"
                    }`}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm sm:text-base text-background mb-3 sm:mb-4">Get Involved</h4>
            <ul className="space-y-2 sm:space-y-3">
              {getInvolvedLinks.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-sm text-background/70 hover:text-background transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm sm:text-base text-background mb-3 sm:mb-4">Legal</h4>
            <ul className="space-y-2 sm:space-y-3">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-sm text-background/70 hover:text-background transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 sm:pt-8 border-t border-background/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-background/60 text-center sm:text-left">
            © {new Date().getFullYear()} BuffIndia. All rights reserved.
          </p>
          <div className="flex items-center gap-3 sm:gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-background/10 flex items-center justify-center text-background/70 hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <social.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
            ))}
          </div>
        </div>

      </div>

      <div className="pt-12 sm:pt-16 mt-8 border-t border-background/10 w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] px-4 sm:px-6 lg:px-8">
        <span className="block text-white font-bold tracking-tight text-[22vw] sm:text-[20vw] lg:text-[18vw] leading-[0.85]">
          BuffIndia
        </span>
      </div>
    </footer>
  )
}
