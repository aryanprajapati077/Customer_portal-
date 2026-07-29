"use client"

import Link from "next/link"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Car, ChevronRight, Info, Leaf, TreePine, Zap } from "lucide-react"
import { MetricCard } from "@/components/portal/metric-card"
import { Cigarette, Droplets, Recycle } from "lucide-react"
import type { PortalMetrics } from "@/lib/portal-metrics"
import { buildMonthlyTrend, formatIndianNumber, formatKg, formatWaterL } from "@/lib/portal-metrics"
import type { CollectionLike } from "@/lib/portal-metrics"

interface ImpactOverviewProps {
  metrics: PortalMetrics
  collections: CollectionLike[]
  yearlyGoalKg?: number
  serviceStartDate?: string | Date | null
}

export function ImpactOverview({
  metrics,
  collections,
  yearlyGoalKg = 1200,
  serviceStartDate,
}: ImpactOverviewProps) {
  const trend = buildMonthlyTrend(collections, {
    startDate: serviceStartDate,
  })
  const collected = metrics.totalWasteKg
  const pct = Math.min(100, Math.round((collected / yearlyGoalKg) * 100))
  const radius = 54
  const circ = 2 * Math.PI * radius
  const dash = (pct / 100) * circ

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <MetricCard
          icon={Leaf}
          iconBg="bg-[#E8F5E9]"
          iconColor="text-[#2E7D32]"
          label="Waste Collected"
          value={formatKg(metrics.totalWasteKg)}
          description="Total waste processed"
        />
        <MetricCard
          icon={Cigarette}
          iconBg="bg-[#FFF3E0]"
          iconColor="text-[#EF6C00]"
          label="Cigarette Butts Rescued"
          value={formatIndianNumber(metrics.cigaretteButts)}
          description="Total butts collected"
        />
        <MetricCard
          icon={Recycle}
          iconBg="bg-[#E8F5E9]"
          iconColor="text-[#2E7D32]"
          label="Microplastics Upcycled"
          value={formatKg(metrics.microplasticsKg)}
          description="Microplastics converted to products"
        />
        <MetricCard
          icon={Droplets}
          iconBg="bg-[#E3F2FD]"
          iconColor="text-[#1565C0]"
          label="Water Protected"
          value={formatWaterL(metrics.waterProtectedL)}
          description="Water protected through recycling"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="portal-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-semibold text-[#1A1A1A]">Waste Collection Trend</h3>
            <div className="flex items-center gap-1.5 text-[11px] text-[#7A7A7A]">
              <span className="w-2 h-2 rounded-full bg-[#2E7D32]" />
              Waste Collected (kg)
            </div>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="wasteFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1B7339" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#1B7339" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#8A8A8A" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#8A8A8A" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip />
                <Area type="monotone" dataKey="kg" stroke="#1B7339" strokeWidth={2.5} fill="url(#wasteFill)" dot={{ r: 3, fill: "#1B7339" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <Link href="/dashboard/impact?tab=circular" className="inline-block mt-2 portal-link">
            View Detailed Analytics →
          </Link>
        </div>

        <div className="portal-card p-5">
          <h3 className="text-[15px] font-semibold text-[#1A1A1A] mb-4">Yearly Progress</h3>
          <div className="flex items-center gap-5">
            <div className="relative w-[130px] h-[130px] shrink-0">
              <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
                <circle cx="70" cy="70" r={radius} fill="none" stroke="#E8E8E8" strokeWidth="12" />
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke="#1B7339"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${circ - dash}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[22px] font-bold text-[#1A1A1A]">{pct}%</span>
                <span className="text-[10px] text-[#8A8A8A] leading-tight px-2">
                  of {formatIndianNumber(yearlyGoalKg)} kg goal
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[18px] font-bold text-[#1B7339]">{formatKg(collected, 0)}</p>
                <p className="text-[12px] text-[#7A7A7A]">Collected</p>
              </div>
              <div>
                <p className="text-[18px] font-bold text-[#1A1A1A]">{formatKg(yearlyGoalKg, 0)}</p>
                <p className="text-[12px] text-[#7A7A7A]">Yearly Goal</p>
              </div>
            </div>
          </div>
          <p className="mt-4 text-[12px] text-[#1B7339] font-medium flex items-center gap-1">
            <span className="text-[14px]">↑</span> On track to exceed yearly target
          </p>
        </div>

        <div className="portal-card p-5">
          <div className="flex items-center gap-1.5 mb-3">
            <h3 className="text-[15px] font-semibold text-[#1A1A1A]">Environmental Impact Equivalent</h3>
            <Info className="w-3.5 h-3.5 text-[#A0A0A0]" />
          </div>
          <div className="space-y-2">
            {[
              {
                icon: TreePine,
                title: "Trees Equivalent",
                value: "Coming Soon",
                bg: "bg-[#E8F5E9]",
                color: "text-[#2E7D32]",
              },
              {
                icon: Car,
                title: "CO2 Emissions Avoided",
                value: "Coming Soon",
                bg: "bg-[#E3F2FD]",
                color: "text-[#1565C0]",
              },
              {
                icon: Zap,
                title: "Energy Saved",
                value: "Coming Soon",
                bg: "bg-[#FFF8E1]",
                color: "text-[#F9A825]",
              },
            ].map((row) => (
              <div
                key={row.title}
                className="flex items-center gap-3 rounded-xl border border-[#F0F0F0] px-3 py-2.5 hover:bg-[#FAFAFA]"
              >
                <div className={`w-9 h-9 rounded-full ${row.bg} flex items-center justify-center`}>
                  <row.icon className={`w-4 h-4 ${row.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#1A1A1A]">{row.title}</p>
                  <p className="text-[12px] text-[#7A7A7A]">{row.value}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#B0B0B0]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
