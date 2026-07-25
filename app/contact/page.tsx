"use client"

import { useState } from "react"
import { Mail, Phone, MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { InspirePage, InspireCard } from "@/components/marketing/inspire-page"

export default function ContactPage() {
  const [message, setMessage] = useState("")

  return (
    <InspirePage
      eyebrow="Contact"
      title="Get in"
      accent="touch"
      subtitle="We're here to answer your questions and explore how we can work together on cigarette waste management, EcoArt, or partnership."
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <InspireCard delay={0}>
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#E8F5E9] text-[#1B7339]">
              <MapPin className="h-5 w-5" strokeWidth={1.7} />
            </div>
            <h3 className="text-[17px] font-semibold tracking-tight text-[#141414]">Address</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-[#5A5A5A]">
              Village-Kuha, Ahmedabad-Indore Hwy, Kuha, Ahmedabad, Gujarat, India- 382433
            </p>
          </InspireCard>

          <InspireCard delay={0.04}>
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#E8F5E9] text-[#1B7339]">
              <Phone className="h-5 w-5" strokeWidth={1.7} />
            </div>
            <h3 className="text-[17px] font-semibold tracking-tight text-[#141414]">Phone</h3>
            <a
              href="tel:+919512120366"
              className="mt-2 block text-[14px] text-[#5A5A5A] transition-colors hover:text-[#1B7339]"
            >
              Mobile: +91-9512120366
            </a>
          </InspireCard>

          <InspireCard delay={0.08}>
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#EF6C00]/12 text-[#EF6C00]">
              <Mail className="h-5 w-5" strokeWidth={1.7} />
            </div>
            <h3 className="text-[17px] font-semibold tracking-tight text-[#141414]">Email</h3>
            <a
              href="mailto:campaign@buffindia.com"
              className="mt-2 block text-[14px] text-[#5A5A5A] transition-colors hover:text-[#1B7339]"
            >
              campaign@buffindia.com
            </a>
          </InspireCard>
        </div>

        <InspireCard className="lg:col-span-2" delay={0.06}>
          <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.5rem,3vw,2rem)] tracking-tight text-[#141414]">
            Send us a message
          </h2>
          <p className="mt-2 text-[14px] text-[#5A5A5A]">
            Tell us about your site, partnership idea, or question—and we&apos;ll get back to you.
          </p>
          <form className="mt-8 space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#141414]">
                  Name
                </Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  className="border-black/10 bg-white/90 focus-visible:ring-[#1B7339]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#141414]">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  className="border-black/10 bg-white/90 focus-visible:ring-[#1B7339]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-[#141414]">
                Subject
              </Label>
              <Input
                id="subject"
                placeholder="Subject"
                className="border-black/10 bg-white/90 focus-visible:ring-[#1B7339]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message" className="text-[#141414]">
                Message
              </Label>
              <Textarea
                id="message"
                placeholder="Your message..."
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="border-black/10 bg-white/90 focus-visible:ring-[#1B7339]"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-[#1B7339] px-6 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#145a2c]"
            >
              Send Message
            </button>
          </form>
        </InspireCard>
      </div>
    </InspirePage>
  )
}
