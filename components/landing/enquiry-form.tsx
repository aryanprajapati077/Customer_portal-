"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { TurnstileWidget } from "@/components/turnstile-widget"
import { INDUSTRIES } from "@/lib/impact-calculator"
import { cn } from "@/lib/utils"
import { COUNTRY_CODES, DEFAULT_COUNTRY_ISO } from "@/lib/country-codes"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


const field = "h-11 rounded-xl border-[#D5E5D9] bg-white text-[14px] shadow-none focus-visible:border-[#1B7339] focus-visible:ring-[#1B7339]/20"
function Flag({ iso }: { iso: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`https://flagcdn.com/w40/${iso.toLowerCase()}.png`} alt="" width={20} height={15} loading="lazy" className="h-[15px] w-5 shrink-0 rounded-[2px] object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.08)]" />
}

const EASE = [0.22, 1, 0.36, 1] as const
const container = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } }
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }

const labelCls = "text-[13px] font-medium text-[#374151]"

export function LandingEnquiryForm() {
  const [industry, setIndustry] = useState("")
  const [countryIso, setCountryIso] = useState(DEFAULT_COUNTRY_ISO)
  const [remarksLen, setRemarksLen] = useState(0)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const selectedCountry = COUNTRY_CODES.find((c) => c.iso === countryIso) ?? COUNTRY_CODES[0]
  const captchaRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim())

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    if (!industry) return setError("Please select your industry type.")
    if (captchaRequired && !token) return setError("Please complete the captcha.")
    const f = new FormData(e.currentTarget)
    const get = (k: string) => String(f.get(k) || "").trim()
    const mobile = get("phone").replace(/\D/g, "")
    const country = COUNTRY_CODES.find((c) => c.iso === countryIso) ?? COUNTRY_CODES[0]
    if (country.iso === "IN") {
      if (mobile.length !== 10 || !/^[6-9]/.test(mobile)) return setError("Enter a valid 10-digit Indian mobile number.")
    } else if (mobile.length < 6 || mobile.length > 14) {
      return setError("Enter a valid mobile number.")
    }
    setLoading(true)
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry,
          name: get("name"),
          businessName: get("businessName"),
          phone: `+${country.dial}${mobile}`,
          email: get("email"),
          city: get("city"),
          state: get("state"),
          remarks: get("remarks"),
          turnstileToken: token,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Could not submit. Please try again.")
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="calculator" className="scroll-mt-24 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:gap-14 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#1B7339]/85">Get in touch</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2rem,3.8vw,2.9rem)] leading-[1.1] tracking-tight text-[#141414]">
            Know your impact.
            <br />
            <em className="italic text-[#1B7339]">Drive real change.</em>
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#5A5A5A] sm:text-[16px]">
            Tell us about your business and our team will get back to you with a tailored proposal.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.65, delay: 0.08, ease: EASE }}
          className="rounded-[28px] border border-[#E4ECE6] bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-8"
        >
          {done ? (
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45, ease: EASE }} className="py-10 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.15 }}>
                <CheckCircle2 className="mx-auto h-12 w-12 text-[#1B7339]" />
              </motion.div>
              <h3 className="mt-4 text-xl font-semibold text-[#141414]">Thank you!</h3>
              <p className="mt-2 text-[14px] text-[#5A5A5A]">We’ve received your details and will contact you shortly.</p>
            </motion.div>
          ) : (
            <motion.form onSubmit={onSubmit} className="space-y-5" variants={container} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }}>
              <motion.div variants={item} className="space-y-1.5">
                <Label className={labelCls}>Industry type *</Label>
                <Select value={industry || undefined} onValueChange={setIndustry}>
                  <SelectTrigger className={cn(field, "w-full")}>
                    <SelectValue placeholder="Select industry type" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((i) => (
                      <SelectItem key={i} value={i}>{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>

              <motion.div variants={item} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className={labelCls}>Name *</Label>
                  <Input id="name" name="name" required autoComplete="name" className={field} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="businessName" className={labelCls}>Business name *</Label>
                  <Input id="businessName" name="businessName" required autoComplete="organization" className={field} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className={labelCls}>Mobile no. *</Label>
                  <div className="flex h-11 items-center rounded-xl border border-[#D5E5D9] bg-white focus-within:border-[#1B7339] focus-within:ring-[3px] focus-within:ring-[#1B7339]/20">
                    <Select value={countryIso} onValueChange={setCountryIso}>
                      <SelectTrigger aria-label="Country code" className="h-full w-[104px] shrink-0 gap-1.5 rounded-l-xl rounded-r-none border-0 border-r border-[#E4ECE6] bg-transparent px-3 text-[14px] shadow-none focus:ring-0 focus-visible:ring-0">
                        <span className="flex items-center gap-2">
                          <Flag iso={selectedCountry.iso} />
                          <span>+{selectedCountry.dial}</span>
                        </span>
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {COUNTRY_CODES.map((c) => (
                          <SelectItem key={c.iso} value={c.iso}>
                            <span className="flex items-center gap-2">
                              <Flag iso={c.iso} />
                              <span>{c.name}</span>
                              <span className="text-[#8A8A8A]">+{c.dial}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input id="phone" name="phone" type="tel" inputMode="numeric" required autoComplete="tel-national" maxLength={countryIso === "IN" ? 10 : 14} placeholder={countryIso === "IN" ? "98765 43210" : "Mobile number"} className="h-full flex-1 rounded-l-none rounded-r-xl border-0 bg-transparent text-[14px] shadow-none focus-visible:ring-0" onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "").slice(0, 14) }} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className={labelCls}>Business email *</Label>
                  <Input id="email" name="email" type="email" required autoComplete="email" placeholder="name@company.com" className={field} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city" className={labelCls}>City *</Label>
                  <Input id="city" name="city" required autoComplete="address-level2" className={field} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="state" className={labelCls}>State *</Label>
                  <Input id="state" name="state" required autoComplete="address-level1" className={field} />
                </div>
              </motion.div>

              <motion.div variants={item} className="space-y-1.5">
                <Label htmlFor="remarks" className={labelCls}>Remarks <span className="font-normal text-[#8A8A8A]">(optional)</span></Label>
                <Textarea id="remarks" name="remarks" rows={3} maxLength={500} onChange={(e) => setRemarksLen(e.target.value.length)} className="rounded-xl border-[#D5E5D9] bg-white text-[14px] shadow-none focus-visible:border-[#1B7339] focus-visible:ring-[#1B7339]/20" placeholder="Number of smoking zones, timeline, or anything else we should know" />
                <p className="text-right text-[11px] text-[#8A8A8A]">{remarksLen}/500</p>
              </motion.div>

              <motion.div variants={item}>
                <TurnstileWidget onToken={setToken} className="min-h-[65px]" />
              </motion.div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    key={error}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: [0, -6, 6, -3, 3, 0] }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4 }}
                    className="rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-700"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.div variants={item} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              <Button type="submit" disabled={loading || (captchaRequired && !token)} className="h-12 w-full rounded-full bg-[#1B7339] text-[15px] hover:bg-[#155c2e]">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Submit
              </Button>
              </motion.div>
            </motion.form>
          )}
        </motion.div>
      </div>
    </section>
  )
}
