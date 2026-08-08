"use client"

import { useMemo, useState } from "react"
import {
  Droplets,
  Cigarette,
  Leaf,
  Recycle,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Building2,
} from "lucide-react"
import { InspireCard } from "@/components/marketing/inspire-page"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  INDUSTRIES,
  ORGANISATION_PRIORITIES,
  calculateImpact,
  formatCompactLitres,
  formatInr,
  type Industry,
  type OrganisationPriority,
} from "@/lib/impact-calculator"

const OCCUPANCY_PRESETS = [
  { label: "1 – 50", value: 40 },
  { label: "51 – 200", value: 120 },
  { label: "201 – 500", value: 320 },
  { label: "500+", value: 650 },
]

const ZONE_PRESETS = [
  { label: "1", value: 1 },
  { label: "2 – 5", value: 3 },
  { label: "6 – 10", value: 8 },
  { label: "11+", value: 14 },
]

export function LandingCalculator() {
  const [industry, setIndustry] = useState<Industry | "">("")
  const [occupancy, setOccupancy] = useState<number | null>(null)
  const [smokingZones, setSmokingZones] = useState<number | null>(null)
  const [priority, setPriority] = useState<OrganisationPriority | "">("")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")
  const [pdfDownload, setPdfDownload] = useState<{ filename: string; href: string } | null>(null)

  const needsPriority = industry === "Corporate Office" || industry === "Hotel & Hospitality"
  const needsOccupancy = industry === "Corporate Office"
  const needsZones = industry === "Hotel & Hospitality"

  const ready =
    Boolean(industry) &&
    (!needsOccupancy || occupancy != null) &&
    (!needsZones || smokingZones != null) &&
    (!needsPriority || Boolean(priority))

  const estimate = useMemo(() => {
    if (!ready || !industry) return null
    return calculateImpact({
      industry,
      occupancy: occupancy ?? undefined,
      smokingZones: smokingZones ?? undefined,
      priority: priority || undefined,
    })
  }, [ready, industry, occupancy, smokingZones, priority])

  const fieldTrigger =
    "mt-1.5 h-11 w-full rounded-xl border border-[#E5E2DA] bg-[#FBFBF8] px-3 text-[14px] text-[#141414] outline-none transition focus:border-[#1B7339] focus:bg-white focus:ring-2 focus:ring-[#1B7339]/15"

  const onIndustryChange = (v: string) => {
    setIndustry(v as Industry)
    setOccupancy(null)
    setSmokingZones(null)
    setPriority("")
  }

  const submitProposal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!ready || !industry) {
      setError("Please complete the calculator selections first.")
      return
    }
    setLoading(true)
    setError("")
    const form = new FormData(e.currentTarget)
    const payload = {
      fullName: String(form.get("fullName") || ""),
      companyName: String(form.get("companyName") || ""),
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
      city: String(form.get("city") || ""),
      industry,
      occupancy: needsOccupancy ? occupancy : undefined,
      smokingZones: needsZones ? smokingZones : undefined,
      priority: needsPriority ? priority : undefined,
    }
    try {
      const res = await fetch("/api/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(55_000),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Could not generate proposal")

      if (data.pdfBase64 && data.filename) {
        const href = `data:application/pdf;base64,${data.pdfBase64}`
        setPdfDownload({ filename: data.filename, href })
        const a = document.createElement("a")
        a.href = href
        a.download = data.filename
        document.body.appendChild(a)
        a.click()
        a.remove()
      }
      setDone(true)
    } catch (err) {
      if (err instanceof Error && err.name === "TimeoutError") {
        setError("Request timed out. Please try again — your proposal may still be emailed shortly.")
      } else if (err instanceof TypeError) {
        setError("Network error. Check your connection and try again.")
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="calculator" className="scroll-mt-24 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#1B7339]/85">
            Impact calculator
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2rem,3.8vw,2.9rem)] leading-[1.1] tracking-tight text-[#141414]">
            Know your impact.
            <br />
            <em className="italic text-[#1B7339]">Drive real change.</em>
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#5A5A5A] sm:text-[16px]">
            Estimate butts diverted, water protected, and circular value for your organisation in
            under a minute.
          </p>

          <div className="mt-8 space-y-4">
            <div>
              <p className="text-[13px] font-medium text-[#374151]">Industry Type</p>
              <Select value={industry || undefined} onValueChange={onIndustryChange}>
                <SelectTrigger className={fieldTrigger}>
                  <SelectValue placeholder="- -" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {needsOccupancy ? (
              <div>
                <p className="text-[13px] font-medium text-[#374151]">Total Workplace Occupancy</p>
                <Select
                  value={occupancy != null ? String(occupancy) : undefined}
                  onValueChange={(v) => setOccupancy(Number(v))}
                >
                  <SelectTrigger className={fieldTrigger}>
                    <SelectValue placeholder="- -" />
                  </SelectTrigger>
                  <SelectContent>
                    {OCCUPANCY_PRESETS.map((o) => (
                      <SelectItem key={o.label} value={String(o.value)}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {needsZones ? (
              <div>
                <p className="text-[13px] font-medium text-[#374151]">No. of Smoking Zones</p>
                <Select
                  value={smokingZones != null ? String(smokingZones) : undefined}
                  onValueChange={(v) => setSmokingZones(Number(v))}
                >
                  <SelectTrigger className={fieldTrigger}>
                    <SelectValue placeholder="- -" />
                  </SelectTrigger>
                  <SelectContent>
                    {ZONE_PRESETS.map((o) => (
                      <SelectItem key={o.label} value={String(o.value)}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {needsPriority ? (
              <div>
                <p className="text-[13px] font-medium text-[#374151]">
                  What is more important for your organisation?
                </p>
                <div className="mt-2 grid gap-2">
                  {ORGANISATION_PRIORITIES.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPriority(opt.value)}
                      className={`rounded-xl border px-4 py-3 text-left transition-all ${
                        priority === opt.value
                          ? "border-[#1B7339] bg-[#E8F5E9] shadow-sm"
                          : "border-[#E5E2DA] bg-[#FBFBF8] hover:border-[#1B7339]/40"
                      }`}
                    >
                      <p className="text-[13px] font-semibold text-[#141414]">{opt.label}</p>
                      <p className="mt-0.5 text-[12px] text-[#6B6B6B]">{opt.hint}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {estimate && (estimate.mode === "package" || estimate.mode === "contact") ? (
              <p className="rounded-xl bg-[#F4F9F5] px-4 py-3 text-[13px] leading-relaxed text-[#2A4A32]">
                {estimate.impactNote || estimate.summaryLine}
              </p>
            ) : null}
          </div>
        </div>

        <InspireCard className="!bg-white !p-6 sm:!p-8" delay={0.08}>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#5C5C5C]">
            Your estimated impact
          </p>

          {!estimate ? (
            <>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Metric
                  icon={Cigarette}
                  label="Cigarette Butts Diverted"
                  value="- -"
                  note="per year"
                />
                <Metric
                  icon={Droplets}
                  label="Water Pollution Prevented"
                  value="- -"
                  note="litres"
                />
                <Metric
                  icon={Building2}
                  label="Est. Annual Investment"
                  value="- -"
                  note="excl. GST / year"
                />
                <Metric icon={Recycle} label="Waste Recycled" value="- -" note="recovery rate" />
              </div>
              <div className="mt-7 rounded-2xl bg-[#F4F9F5] px-4 py-4">
                <p className="text-[13px] text-[#2A4A32]">
                  Recommended: <span className="font-semibold">- -</span>
                </p>
                <div className="mt-2 space-y-1 text-[13px] text-[#5A5A5A]">
                  <p className="flex justify-between gap-3">
                    <span>Subtotal excl. GST</span>
                    <span className="shrink-0 font-medium text-[#141414]">- -</span>
                  </p>
                  <p className="flex justify-between gap-3">
                    <span>GST</span>
                    <span className="font-medium text-[#141414]">- -</span>
                  </p>
                  <p className="flex justify-between gap-3 text-[#2A4A32]">
                    <span className="font-semibold">Total incl. GST / year</span>
                    <span className="font-bold">- -</span>
                  </p>
                </div>
                <p className="mt-2 text-[13px] text-[#5A5A5A]">
                  Complimentary KraftReborn value ={" "}
                  <span className="font-semibold text-[#141414]">- -</span>
                </p>
              </div>
            </>
          ) : (
            <>
              {estimate.mode === "quantified" ? (
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Metric
                    icon={Cigarette}
                    label="Cigarette Butts Diverted"
                    value={formatInr(estimate.buttsDiverted || 0)}
                    note="per year"
                  />
                  <Metric
                    icon={Droplets}
                    label="Water Pollution Prevented"
                    value={formatCompactLitres(estimate.waterLitres || 0)}
                    note="litres"
                  />
                  <Metric
                    icon={Building2}
                    label="Est. Annual Investment"
                    value={
                      estimate.annualInvestment != null
                        ? `₹${formatInr(estimate.annualInvestment)}`
                        : "—"
                    }
                    note={
                      estimate.pricing
                        ? `excl. GST · ₹${formatInr(estimate.pricing.totalInclGst)} incl. GST`
                        : "excl. GST / year"
                    }
                  />
                  <Metric
                    icon={Recycle}
                    label="Waste Recycled"
                    value={`${estimate.wasteRecycledPct}%`}
                    note="recovery rate"
                  />
                </div>
              ) : estimate.mode === "survey" || estimate.mode === "package" ? (
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Metric
                    icon={Building2}
                    label="Recommended Package"
                    value={estimate.packageName}
                    note={
                      estimate.recommendedKiosks != null
                        ? `${estimate.recommendedKiosks} kiosks`
                        : "fixed annual plan"
                    }
                  />
                  <Metric
                    icon={Leaf}
                    label="Est. Annual Investment"
                    value={
                      estimate.annualInvestment != null
                        ? `₹${formatInr(estimate.annualInvestment)}`
                        : "—"
                    }
                    note={
                      estimate.pricing
                        ? `excl. GST · ₹${formatInr(estimate.pricing.totalInclGst)} incl. GST`
                        : estimate.annualInvestmentNote || ""
                    }
                  />
                  <Metric
                    icon={Recycle}
                    label="Waste Recycled"
                    value={`${estimate.wasteRecycledPct}%`}
                    note="recovery rate"
                  />
                  <Metric
                    icon={Droplets}
                    label="Impact timing"
                    value="Post-survey"
                    note="site assessment required"
                  />
                </div>
              ) : (
                <div className="mt-6 rounded-2xl bg-[#F4F9F5] px-4 py-6 text-[14px] leading-relaxed text-[#2A4A32]">
                  {estimate.impactNote}
                </div>
              )}

              <div className="mt-7 rounded-2xl bg-[#F4F9F5] px-4 py-4">
                <p className="text-[13px] text-[#2A4A32]">
                  Recommended: <span className="font-semibold">{estimate.packageName}</span>
                  {estimate.kioskType ? (
                    <span className="text-[#5A5A5A]"> · {estimate.kioskType} kiosk</span>
                  ) : null}
                  {estimate.recommendedKiosks != null ? (
                    <span className="text-[#5A5A5A]"> · {estimate.recommendedKiosks} units</span>
                  ) : null}
                </p>
                {estimate.pricing ? (
                  <div className="mt-2 space-y-1 text-[13px] text-[#5A5A5A]">
                    {estimate.pricing.lineItems.map((item) => (
                      <p key={item.label} className="flex justify-between gap-3">
                        <span>{item.label}</span>
                        <span className="shrink-0 font-medium text-[#141414]">
                          ₹{formatInr(item.amount)}
                        </span>
                      </p>
                    ))}
                    <p className="flex justify-between gap-3 border-t border-[#D7E8DB] pt-2">
                      <span>Subtotal excl. GST</span>
                      <span className="font-semibold text-[#141414]">
                        ₹{formatInr(estimate.pricing.subtotalExclGst)}
                      </span>
                    </p>
                    <p className="flex justify-between gap-3">
                      <span>GST @ {estimate.pricing.gstRatePct}%</span>
                      <span className="font-medium text-[#141414]">
                        ₹{formatInr(estimate.pricing.gstAmount)}
                      </span>
                    </p>
                    <p className="flex justify-between gap-3 text-[#2A4A32]">
                      <span className="font-semibold">Total incl. GST / year</span>
                      <span className="font-bold">₹{formatInr(estimate.pricing.totalInclGst)}</span>
                    </p>
                  </div>
                ) : null}
                {estimate.kraftRebornValue != null ? (
                  <p className="mt-2 text-[13px] text-[#5A5A5A]">
                    Complimentary KraftReborn value ={" "}
                    <span className="font-semibold text-[#141414]">
                      ₹{formatInr(estimate.kraftRebornValue)}
                    </span>
                  </p>
                ) : null}
                {estimate.impactNote && estimate.mode === "survey" ? (
                  <p className="mt-2 text-[12px] leading-relaxed text-[#5A5A5A]">
                    {estimate.impactNote}
                  </p>
                ) : null}
                {estimate.solutions && estimate.solutions.length > 1 ? (
                  <div className="mt-4 space-y-2 border-t border-[#D7E8DB] pt-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A]">
                      {estimate.priority === "both" ? "Compare solutions" : "Alternative option"}
                    </p>
                    {estimate.solutions.map((tier) => (
                      <div
                        key={tier.kioskType}
                        className={`rounded-xl px-3 py-2.5 ${
                          tier.isRecommended ? "bg-white ring-1 ring-[#1B7339]/30" : "bg-white/60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[12px] font-semibold text-[#141414]">
                            {tier.label}
                            {tier.isRecommended ? (
                              <span className="ml-1.5 text-[10px] font-bold uppercase text-[#1B7339]">
                                Recommended
                              </span>
                            ) : null}
                          </p>
                          <p className="text-[12px] font-bold text-[#1B7339]">
                            ₹{formatInr(tier.annualInvestment)}
                          </p>
                        </div>
                        <p className="mt-0.5 text-[11px] text-[#6B6B6B]">
                          {tier.recommendedKiosks} kiosks · ₹{formatInr(tier.pricing.totalInclGst)} incl. GST
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </>
          )}

          <button
            type="button"
            disabled={!ready || !estimate}
            onClick={() => {
              if (!ready || !estimate) return
              setDone(false)
              setError("")
              setPdfDownload(null)
              setOpen(true)
            }}
            className="landing-btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-45"
          >
            Get detailed proposal
            <ArrowRight className="h-4 w-4" />
          </button>
        </InspireCard>
      </div>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) {
            setDone(false)
            setError("")
            setPdfDownload(null)
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-[#E5E2DA] bg-[#FBFBF8] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-display)] text-xl">
              {done ? "Your proposal is ready" : "Get my detailed proposal"}
            </DialogTitle>
            <DialogDescription>
              {done
                ? "Full commercial PDF downloaded. We’ve also emailed it and notified Buffindia sales."
                : "Review package, kiosks, pricing and impact — then generate your branded PDF proposal."}
            </DialogDescription>
          </DialogHeader>

          {done ? (
            <div className="flex flex-col items-center py-6 text-center">
              <CheckCircle2 className="h-10 w-10 text-[#1B7339]" />
              <p className="mt-4 text-[15px] font-semibold text-[#141414]">Proposal generated</p>
              <p className="mt-2 max-w-sm text-[13px] text-[#5A5A5A]">
                Your PDF includes package, kiosk quantity, full pricing with GST, impact summary, and
                KraftReborn entitlement.
              </p>
              {pdfDownload ? (
                <a
                  href={pdfDownload.href}
                  download={pdfDownload.filename}
                  className="landing-btn-primary mt-6"
                >
                  Download proposal PDF
                  <ArrowRight className="h-4 w-4" />
                </a>
              ) : null}
              <Button
                type="button"
                variant="outline"
                className="mt-3 rounded-full"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
            </div>
          ) : estimate ? (
            <>
              <div className="space-y-3 rounded-xl border border-[#E5E2DA] bg-white px-4 py-3 text-[13px] text-[#374151]">
                <p>
                  <span className="text-[#8A8A8A]">Package</span> ·{" "}
                  <span className="font-semibold">{estimate.packageName}</span>
                  {estimate.kioskType ? ` · ${estimate.kioskType}` : ""}
                </p>
                {estimate.recommendedKiosks != null ? (
                  <p>
                    <span className="text-[#8A8A8A]">Recommended kiosks</span> ·{" "}
                    <span className="font-semibold">{estimate.recommendedKiosks}</span>
                  </p>
                ) : null}

                {estimate.pricing ? (
                  <div className="border-t border-[#EFECE4] pt-2">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#8A8A8A]">
                      Pricing
                    </p>
                    {estimate.pricing.lineItems.map((item) => (
                      <p key={item.label} className="flex justify-between gap-2 py-0.5">
                        <span className="text-[#5A5A5A]">{item.label}</span>
                        <span className="font-medium">₹{formatInr(item.amount)}</span>
                      </p>
                    ))}
                    <p className="mt-1 flex justify-between gap-2 border-t border-[#EFECE4] pt-2">
                      <span>Subtotal excl. GST</span>
                      <span className="font-semibold">
                        ₹{formatInr(estimate.pricing.subtotalExclGst)}
                      </span>
                    </p>
                    <p className="flex justify-between gap-2">
                      <span>GST @ {estimate.pricing.gstRatePct}%</span>
                      <span className="font-medium">₹{formatInr(estimate.pricing.gstAmount)}</span>
                    </p>
                    <p className="flex justify-between gap-2 text-[#1B7339]">
                      <span className="font-semibold">Total incl. GST / year</span>
                      <span className="font-bold">₹{formatInr(estimate.pricing.totalInclGst)}</span>
                    </p>
                  </div>
                ) : (
                  <p className="text-[#5A5A5A]">{estimate.impactNote}</p>
                )}

                {estimate.buttsDiverted != null ? (
                  <p className="border-t border-[#EFECE4] pt-2">
                    <span className="text-[#8A8A8A]">Impact</span> ·{" "}
                    <span className="font-semibold">
                      {formatInr(estimate.buttsDiverted)} butts / yr
                    </span>
                    {estimate.waterLitres != null
                      ? ` · ${formatCompactLitres(estimate.waterLitres)} L water`
                      : ""}
                    {` · ${estimate.wasteRecycledPct}% recycled`}
                  </p>
                ) : estimate.impactNote && estimate.pricing ? (
                  <p className="border-t border-[#EFECE4] pt-2 text-[#5A5A5A]">{estimate.impactNote}</p>
                ) : null}

                {estimate.kraftRebornValue != null ? (
                  <p>
                    <span className="text-[#8A8A8A]">KraftReborn</span> ·{" "}
                    <span className="font-semibold">₹{formatInr(estimate.kraftRebornValue)}</span>
                  </p>
                ) : null}
              </div>

              <form onSubmit={submitProposal} className="space-y-3">
                {error ? (
                  <p className="rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>
                ) : null}
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    required
                    className="h-11 rounded-xl border-[#E5E2DA] bg-white"
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    required
                    className="h-11 rounded-xl border-[#E5E2DA] bg-white"
                    autoComplete="organization"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Work Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="h-11 rounded-xl border-[#E5E2DA] bg-white"
                    autoComplete="email"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      className="h-11 rounded-xl border-[#E5E2DA] bg-white"
                      autoComplete="tel"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      required
                      className="h-11 rounded-xl border-[#E5E2DA] bg-white"
                      autoComplete="address-level2"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-full bg-[#141414] text-[14px] font-semibold text-white hover:bg-[#1B7339]"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Generate my proposal
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof Cigarette
  label: string
  value: string
  note: string
}) {
  return (
    <div>
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#E8F5E9] text-[#1B7339]">
        <Icon className="h-4 w-4" strokeWidth={1.8} />
      </div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-[#8A8A8A]">{label}</p>
      <p className="mt-1 text-[1.55rem] font-bold tracking-tight text-[#141414]">{value}</p>
      {note ? <p className="text-[12px] text-[#6B6B6B]">{note}</p> : null}
    </div>
  )
}
