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

      <div className="grid grid-cols-1 xl:grid-cols-[1.55fr_1fr] gap-4">
        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col">
          <h3 className="text-[15px] font-semibold text-[#1A1A1A] mb-4">
            Circular Journey: From Cigarette Waste to Sustainable Products
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 relative flex-1 content-start">
            {JOURNEY.map((step, idx) => (
              <motion.div
                key={step.title}
                className="relative flex flex-col items-center text-center h-full min-h-[132px]"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08, duration: 0.45 }}
                whileHover={{ y: -3 }}
              >
                {idx < JOURNEY.length - 1 && (
                  <div className="hidden sm:block absolute top-5 left-[60%] w-[80%] h-px bg-[#C8E6C9]" />
                )}
                <motion.div
                  className="relative z-10 w-10 h-10 rounded-full bg-[#E8F5E9] border border-[#C8E6C9] flex items-center justify-center mb-2"
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ duration: 2.8, delay: idx * 0.25, repeat: Infinity, ease: "easeInOut" }}
                >
                  <step.icon className="w-4 h-4 text-[#2E7D32]" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#2E7D32] text-white text-[9px] font-bold flex items-center justify-center">
                    {step.n}
                  </span>
                </motion.div>
                <p className="text-[13px] font-semibold text-[#1A1A1A]">{step.title}</p>
                <p className="text-[11px] text-[#7A7A7A] mt-1 leading-snug flex-1">{step.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-[#EAF6EC] px-4 py-3 flex items-start gap-2">
            <Leaf className="w-4 h-4 text-[#2E7D32] mt-0.5 shrink-0" />
            <p className="text-[12px] text-[#2E7D32] leading-relaxed">
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
