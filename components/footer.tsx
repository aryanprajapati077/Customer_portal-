"use client"

import { Mail, Phone, MapPin, Linkedin, Twitter, Instagram } from "lucide-react"
import Image from "next/image"

const footerLinks = {
  company: [
    { name: "About Us", href: "#" },
    { name: "Our Mission", href: "#" },
    { name: "Careers", href: "#" },
    { name: "Press", href: "#" },
  ],
  solutions: [
    { name: "Corporate Programs", href: "#" },
    { name: "Collection Services", href: "#" },
    { name: "Product Catalog", href: "#" },
    { name: "Custom Solutions", href: "#" },
  ],
  resources: [
    { name: "ESG Reports", href: "#reports" },
    { name: "Certificates", href: "#reports" },
    { name: "Case Studies", href: "#" },
    { name: "Blog", href: "#" },
  ],
  legal: [
    { name: "Privacy Policy", href: "#" },
    { name: "Terms of Service", href: "#" },
    { name: "Cookie Policy", href: "#" },
  ],
}

const socialLinks = [
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
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
                  alt="Buffindia Logo"
                  width={80}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
              
            </a>
            <p className="text-sm sm:text-base text-background/70 mb-5 sm:mb-6 leading-relaxed">
              Transforming cigarette waste into sustainable products, creating measurable environmental impact for a
              cleaner world.
            </p>
            <div className="space-y-2.5 sm:space-y-3">
              <a
                href="mailto:contact@buffindia.com"
                className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-background/70 hover:text-background transition-colors"
              >
                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="break-all">contact@buffindia.com</span>
              </a>
              <a
                href="tel:+911234567890"
                className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-background/70 hover:text-background transition-colors"
              >
                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                +91 123 456 7890
              </a>
              <div className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-background/70">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                Mumbai, India
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm sm:text-base text-background mb-3 sm:mb-4">Company</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-sm text-background/70 hover:text-background transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm sm:text-base text-background mb-3 sm:mb-4">Solutions</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.solutions.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-sm text-background/70 hover:text-background transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm sm:text-base text-background mb-3 sm:mb-4">Resources</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.resources.map((link) => (
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
              {footerLinks.legal.map((link) => (
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
            © {new Date().getFullYear()} Buffindia. All rights reserved.
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
    </footer>
  )
}
