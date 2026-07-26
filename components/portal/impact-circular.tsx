"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  Box,
  Calendar,
  Cloud,
  Droplets,
  Gift,
  Leaf,
  Package,
  Recycle,
  Sparkles,
  Trash2,
  TreePine,
  Truck,
} from "lucide-react"
import { MetricCard } from "@/components/portal/metric-card"
import type { PortalMetrics } from "@/lib/portal-metrics"
import { formatIndianNumber, formatKg, formatWaterL } from "@/lib/portal-metrics"
import { OutlineButton } from "@/components/portal/outline-button"

const JOURNEY = [
  {
    n: 1,
    title: "Collect",
    desc: "Cigarette waste collected through our disposal kiosks.",
    icon: Trash2,
  },
  {
    n: 2,
    title: "Transport",
    desc: "Safely transported to our recycling facility.",
    icon: Truck,
  },
  {
    n: 3,
    title: "Process",
    desc: "Filters cleaned & converted into cellulose acetate powder.",
    icon: Recycle,
  },
  {
    n: 4,
    title: "Create",
    desc: "Upcycled into beautiful KraftReborn products.",
    icon: Box,
  },
  {
    n: 5,
    title: "Impact",
    desc: "Driving a cleaner planet & sustainable future.",
    icon: Gift,
  },
]

interface ImpactCircularProps {
  metrics: PortalMetrics
}

export function ImpactCircular({ metrics }: ImpactCircularProps) {
  const productsCreated = Math.max(0, Math.round(metrics.totalWasteKg * 8))

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-[18px] font-semibold text-[#1A1A1A]">
          From Waste to Worth: Creating a Circular Future
        </h2>
        <OutlineButton>
          <Calendar className="w-4 h-4" />
          This Year
        </OutlineButton>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <MetricCard
          icon={Leaf}
          iconBg="bg-[#E8F5E9]"
          iconColor="text-[#2E7D32]"
          label="Total Waste Collected"
          value={formatKg(metrics.totalWasteKg)}
          description="Cigarette waste collected responsibly."
        />
        <MetricCard
          icon={Sparkles}
          iconBg="bg-[#FFF8E1]"
          iconColor="text-[#F9A825]"
          label="Microplastics Upcycled"
          value={formatKg(metrics.microplasticsKg)}
          description="Converted into cellulose acetate & other materials."
        />
        <MetricCard
          icon={Package}
          iconBg="bg-[#E3F2FD]"
          iconColor="text-[#1565C0]"
          label="KraftReborn Products Created"
          value={formatIndianNumber(productsCreated)}
          description="Upcycled into sustainable products."
        />
        <MetricCard
          icon={Sparkles}
          iconBg="bg-[#F3E5F5]"
          iconColor="text-[#7B1FA2]"
          label="Amount to be claim pending"
          value={formatIndianNumber(metrics.kraftrebornCredits)}
          description="Pending claim amount in your account."
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.55fr_1fr] gap-4 items-stretch">
        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col">
          <h3 className="text-[15px] font-semibold text-[#1A1A1A] shrink-0">
            Circular Journey: From Cigarette Waste to Sustainable Products
          </h3>
          <div className="flex-1 flex items-center py-5">
            <div className="grid w-full grid-cols-2 sm:grid-cols-5 gap-x-4 gap-y-6 relative">
              {JOURNEY.map((step, idx) => (
                <motion.div
                  key={step.title}
                  className="relative flex flex-col items-center text-center px-0.5"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.06, duration: 0.35 }}
                  whileHover={{ y: -2 }}
                >
                  {idx < JOURNEY.length - 1 && (
                    <div className="hidden sm:block absolute top-7 left-[62%] w-[76%] h-px bg-[#C8E6C9]" />
                  )}
                  <div className="relative z-10 w-14 h-14 rounded-full bg-[#E8F5E9] border border-[#C8E6C9] flex items-center justify-center mb-3">
                    <step.icon className="w-6 h-6 text-[#2E7D32]" strokeWidth={1.75} />
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#2E7D32] text-white text-[10px] font-bold flex items-center justify-center">
                      {step.n}
                    </span>
                  </div>
                  <p className="text-[14px] font-semibold text-[#1A1A1A] leading-tight">{step.title}</p>
                  <p className="text-[12px] text-[#6B6B6B] mt-1.5 leading-snug max-w-[11.5rem]">
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="mt-auto rounded-xl bg-[#EAF6EC] px-4 py-3.5 flex items-start gap-2.5 shrink-0">
            <Leaf className="w-4 h-4 text-[#2E7D32] mt-0.5 shrink-0" />
            <p className="text-[13px] text-[#2E7D32] leading-relaxed">
              Every step is designed to keep waste out of landfills and create long-term environmental
              value.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <h3 className="text-[15px] font-semibold text-[#1A1A1A] mb-4">Environmental Impact Equivalents</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              {
                icon: TreePine,
                value: "Coming Soon",
                label: "Trees planted",
                title: "Trees Equivalent",
                bg: "bg-[#E8F5E9]",
                color: "text-[#2E7D32]",
              },
              {
                icon: Droplets,
                value: formatWaterL(metrics.waterProtectedL),
                label: "Liters of water",
                title: "Water Protected",
                bg: "bg-[#E3F2FD]",
                color: "text-[#1565C0]",
              },
              {
                icon: Cloud,
                value: "Coming Soon",
                label: "Emissions avoided",
                title: "CO2 Emissions Avoided",
                bg: "bg-[#E8F5E9]",
                color: "text-[#2E7D32]",
              },
              {
                icon: Trash2,
                value: formatKg(metrics.totalWasteKg),
                label: "From landfills",
                title: "Waste Diverted",
                bg: "bg-[#FFF3E0]",
                color: "text-[#EF6C00]",
              },
            ].map((card) => (
              <div key={card.title} className="rounded-xl border border-[#F0F0F0] p-3">
                <div className={`w-8 h-8 rounded-full ${card.bg} flex items-center justify-center mb-2`}>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <p className="text-[11px] text-[#7A7A7A]">{card.title}</p>
                <p className="text-[16px] font-bold text-[#1A1A1A] mt-0.5 leading-tight">{card.value}</p>
                <p className="text-[11px] text-[#8A8A8A] mt-0.5">{card.label}</p>
              </div>
            ))}
          </div>
          <Link
            href="/dashboard/reports"
            className="inline-block mt-4 text-[13px] font-semibold text-[#2E7D32]"
          >
            View Impact Certificate →
          </Link>
        </div>
      </div>
    </div>
  )
}
