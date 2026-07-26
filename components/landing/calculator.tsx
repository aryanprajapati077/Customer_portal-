"use client"

import { useMemo, useState } from "react"
import { Droplets, Cigarette, Leaf, Recycle, ArrowRight } from "lucide-react"
import { InspireCard } from "@/components/marketing/inspire-page"

const INDUSTRIES = ["Hospitality", "Corporate Campus", "Education", "Healthcare", "Retail / Mall", "Mixed Use"]
const EMP_OPTIONS = [
  { label: "1 – 50", value: 40 },
  { label: "51 – 200", value: 120 },
  { label: "201 – 500", value: 320 },
  { label: "500+", value: 650 },
]
const LOC_OPTIONS = [
  { label: "1", value: 1 },
  { label: "2 – 5", value: 3 },
  { label: "6 – 15", value: 10 },
  { label: "16+", value: 22 },
]
const KIOSK_OPTIONS = ["Basic", "Advanced", "Mixed Fleet"]

function formatNumber(n: number) {
  return new Intl.NumberFormat("en-IN").format(Math.round(n))
}

export function LandingCalculator() {
  const [industry, setIndustry] = useState(INDUSTRIES[0])
  const [employees, setEmployees] = useState(EMP_OPTIONS[1].value)
  const [locations, setLocations] = useState(LOC_OPTIONS[1].value)
  const [kiosk, setKiosk] = useState(KIOSK_OPTIONS[1])

  const impact = useMemo(() => {
    const kioskMul = kiosk === "Advanced" ? 1.25 : kiosk === "Mixed Fleet" ? 1.1 : 1
    const industryMul =
      industry === "Hospitality" ? 1.3 : industry === "Corporate Campus" ? 1.15 : 1
    const butts = employees * locations * 180 * kioskMul * industryMul
    const waterLitres = butts * 100
    const co2Tonnes = butts * 0.0005
    const productsValue = Math.round((butts / 3000) * 180)
    return {
      butts,
      waterLitres,
      co2Tonnes,
      recycled: 99,
      plan: kiosk === "Basic" ? "Basic Plan" : "Advanced Plan",
      productsValue,
    }
  }, [industry, employees, locations, kiosk])

  const field =
    "mt-1.5 h-11 w-full rounded-xl border border-[#E5E2DA] bg-[#FBFBF8] px-3 text-[14px] text-[#141414] outline-none transition focus:border-[#1B7339] focus:bg-white focus:ring-2 focus:ring-[#1B7339]/15"

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
            <label className="block text-[13px] font-medium text-[#374151]">
              Industry Type
              <select className={field} value={industry} onChange={(e) => setIndustry(e.target.value)}>
                {INDUSTRIES.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
            <label className="block text-[13px] font-medium text-[#374151]">
              No. of Employees / Smoking Zones
              <select
                className={field}
                value={employees}
                onChange={(e) => setEmployees(Number(e.target.value))}
              >
                {EMP_OPTIONS.map((o) => (
                  <option key={o.label} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[13px] font-medium text-[#374151]">
              No. of Locations
              <select
                className={field}
                value={locations}
                onChange={(e) => setLocations(Number(e.target.value))}
              >
                {LOC_OPTIONS.map((o) => (
                  <option key={o.label} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[13px] font-medium text-[#374151]">
              Kiosk Preference
              <select className={field} value={kiosk} onChange={(e) => setKiosk(e.target.value)}>
                {KIOSK_OPTIONS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <InspireCard className="!bg-white !p-6 sm:!p-8" delay={0.08}>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#5C5C5C]">
            Your estimated impact
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Metric
              icon={Cigarette}
              label="Cigarette Butts Diverted"
              value={formatNumber(impact.butts)}
              note="per year"
            />
            <Metric
              icon={Droplets}
              label="Water Pollution Prevented"
              value={`${formatNumber(impact.waterLitres / 1_000_000)}M`}
              note="litres"
            />
            <Metric
              icon={Leaf}
              label="CO₂ Emissions Avoided"
              value={impact.co2Tonnes.toFixed(0)}
              note="tonnes / year"
            />
            <Metric icon={Recycle} label="Waste Recycled" value={`${impact.recycled}%`} note="recovery rate" />
          </div>

          <div className="mt-7 rounded-2xl bg-[#F4F9F5] px-4 py-4">
            <p className="text-[13px] text-[#2A4A32]">
              Recommended: <span className="font-semibold">{impact.plan}</span>
            </p>
            <p className="mt-1 text-[13px] text-[#5A5A5A]">
              Est. complimentary KraftReborn value ≈{" "}
              <span className="font-semibold text-[#141414]">
                ₹{formatNumber(impact.productsValue)}
              </span>
            </p>
          </div>

          <a
            href="#proposal"
            className="landing-btn-primary mt-6 w-full"
          >
            Get detailed proposal
            <ArrowRight className="h-4 w-4" />
          </a>
        </InspireCard>
      </div>
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
      <p className="text-[12px] text-[#6B6B6B]">{note}</p>
    </div>
  )
}
