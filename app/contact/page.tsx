"use client"

import { useState } from "react"
import { CheckCircle2, Loader2, Mail, Phone, MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { InspirePage, InspireCard } from "@/components/marketing/inspire-page"

export default function ContactPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim() || "Website contact",
          message: phone.trim()
            ? `${message.trim()}\n\nPhone: ${phone.trim()}`
            : message.trim(),
          category: "contact",
          source: "contact",
          phone: phone.trim() || undefined,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || data?.error) {
        throw new Error(data?.error || "Could not send message")
      }
      setSubmitted(true)
      setName("")
      setEmail("")
      setPhone("")
      setSubject("")
      setMessage("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <InspirePage
      eyebrow="Contact"
      title="Get in"
      accent="touch"
      subtitle="We're here to answer your questions and explore how we can work together on cigarette waste management, KraftReborn, or partnership."
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

          {submitted ? (
            <div className="mt-8 rounded-2xl border border-[#C8E6D4] bg-[#E8F5E9] px-5 py-8 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-[#1B7339]" />
              <p className="mt-3 text-[17px] font-semibold text-[#141414]">Message sent</p>
              <p className="mt-1.5 text-[14px] text-[#5A5A5A]">
                Thanks for reaching out. Our team has received your message and will reply soon.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-5 inline-flex items-center rounded-full border border-[#1B7339]/30 px-4 py-2 text-[13px] font-semibold text-[#1B7339] hover:bg-white"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form className="mt-8 space-y-5" onSubmit={onSubmit}>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[#141414]">
                    Name
                  </Label>
                  <Input
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="border-black/10 bg-white/90 focus-visible:ring-[#1B7339]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[#141414]">
                  Phone number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="border-black/10 bg-white/90 focus-visible:ring-[#1B7339]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-[#141414]">
                  Subject
                </Label>
                <Input
                  id="subject"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
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
                  required
                  placeholder="Your message..."
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="border-black/10 bg-white/90 focus-visible:ring-[#1B7339]"
                />
              </div>
              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-full bg-[#1B7339] px-6 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#145a2c] disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {submitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          )}
        </InspireCard>
      </div>
    </InspirePage>
  )
}
