"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2, ArrowRight } from "lucide-react"
import { InspireCard } from "@/components/marketing/inspire-page"

export function LandingLeadForm() {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const form = new FormData(e.currentTarget)
    const payload = {
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      subject: `Proposal request — ${String(form.get("company") || "Organisation")}`,
      message: [
        "Landing page proposal request",
        `Company: ${String(form.get("company") || "")}`,
        `Phone: ${String(form.get("phone") || "")}`,
      ].join("\n"),
      category: "proposal",
      source: "landing",
    }
    try {
      const res = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Could not send. Try the contact page.")
      setDone(true)
      e.currentTarget.reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="proposal" className="scroll-mt-24 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#1B7339]/85">
            Ready to create
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2rem,3.8vw,2.9rem)] leading-[1.1] tracking-tight text-[#141414]">
            A <em className="italic text-[#1B7339]">cleaner tomorrow?</em>
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[#5A5A5A] sm:text-[16px]">
            Tell us about your sites — we&apos;ll send a tailored proposal with kiosk plan and
            estimated impact.
          </p>
        </div>

        <div className="grid items-stretch gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="relative min-h-[280px] overflow-hidden rounded-[1.75rem] border border-black/[0.06]">
            <Image
              src="/auth/login-greenery.jpg"
              alt=""
              fill
              className="object-cover"
              sizes="50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F1F14]/80 via-[#0F1F14]/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-7 sm:p-8">
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#C8F000]">
                BuffIndia partnership
              </p>
              <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-white/90">
                Infrastructure, collection, recycling, and ESG reporting — one calm operating system.
              </p>
            </div>
          </div>

          <InspireCard className="!bg-white !p-6 sm:!p-8" delay={0.06}>
            {done ? (
              <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                <CheckCircle2 className="h-10 w-10 text-[#1B7339]" />
                <p className="mt-4 text-[18px] font-semibold text-[#141414]">Request received</p>
                <p className="mt-2 max-w-sm text-[14px] text-[#5A5A5A]">
                  Our team will reach out shortly with your proposal.
                </p>
                <button
                  type="button"
                  onClick={() => setDone(false)}
                  className="mt-6 text-[13px] font-medium text-[#1B7339] hover:underline"
                >
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <p className="text-[15px] font-semibold text-[#141414]">Get a proposal</p>
                {error && (
                  <p className="rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    className="h-11 rounded-xl border-[#E5E2DA] bg-[#FBFBF8]"
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Work Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="h-11 rounded-xl border-[#E5E2DA] bg-[#FBFBF8]"
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    name="company"
                    required
                    className="h-11 rounded-xl border-[#E5E2DA] bg-[#FBFBF8]"
                    autoComplete="organization"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    className="h-11 rounded-xl border-[#E5E2DA] bg-[#FBFBF8]"
                    autoComplete="tel"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-full bg-[#1B7339] text-[14px] font-semibold hover:bg-[#145a2c]"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Get proposal
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </InspireCard>
        </div>
      </div>
    </section>
  )
}
