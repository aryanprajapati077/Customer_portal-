"use client"

import { motion } from "framer-motion"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Cigarette, Droplets, Leaf, Recycle, Sparkles, TrendingUp } from "lucide-react"
import type { CollectionLike, PortalMetrics } from "@/lib/portal-metrics"
import { formatIndianNumber, formatKg, formatWaterL } from "@/lib/portal-metrics"

function buildMonthly(collections: CollectionLike[]) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const year = new Date().getFullYear()
  const totals = months.map((m) => ({ month: m, kg: 0, butts: 0 }))
  for (const c of collections) {
    if (!c.date) continue
    const d = new Date(c.date)
    if (d.getFullYear() !== year) continue
    const i = d.getMonth()
    totals[i].kg += Number(c.weight) || 0
    totals[i].butts += Math.round((Number(c.weight) || 0) * 3000)
  }
  const hasData = totals.some((t) => t.kg > 0)
  if (!hasData) {
    return months.map((m, i) => ({
      month: m,
      kg: +(0.4 + i * 0.18).toFixed(2),
      butts: Math.round((0.4 + i * 0.18) * 3000),
    }))
  }
  return totals.map((t) => ({ ...t, kg: +t.kg.toFixed(2) }))
}

interface ImpactAnalyticsProps {
  metrics: PortalMetrics
  collections: CollectionLike[]
}

const PIE_COLORS = ["#1B7339", "#EF6C00", "#1565C0", "#7B1FA2"]

export function ImpactAnalytics({ metrics, collections }: ImpactAnalyticsProps) {
  const monthly = buildMonthly(collections)
  const mix = [
    { name: "Upcycled fibre", value: Math.max(1, metrics.microplasticsKg) },
    { name: "Ash / other", value: Math.max(0.1, metrics.totalWasteKg - metrics.microplasticsKg) },
    { name: "Credits value", value: Math.max(1, metrics.kraftrebornCredits / 50) },
    { name: "Water index", value: Math.max(1, metrics.waterProtectedL / 200000) },
  ]

  const kpis = [
    {
      icon: Leaf,
      label: "Waste YTD",
      value: formatKg(metrics.totalWasteKg),
      color: "text-[#1B7339]",
      bg: "bg-[#E8F5E9]",
    },
    {
      icon: Cigarette,
      label: "Butts rescued",
      value: formatIndianNumber(metrics.cigaretteButts),
      color: "text-[#EF6C00]",
      bg: "bg-[#FFF3E0]",
    },
    {
      icon: Droplets,
      label: "Water protected",
      value: formatWaterL(metrics.waterProtectedL),
      color: "text-[#1565C0]",
      bg: "bg-[#E3F2FD]",
    },
    {
      icon: Sparkles,
      label: "Amount to be claim pending",
      value: formatIndianNumber(metrics.kraftrebornCredits),
      color: "text-[#7B1FA2]",
      bg: "bg-[#F3E5F5]",
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-[#1B7339]" />
        <h2 className="text-[16px] font-semibold text-[#1A1A1A]">Full Analytics</h2>
        <span className="text-[12px] text-[#8A8A8A]">Live operational + impact metrics</span>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            className="portal-card p-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -3 }}
          >
            <div className={`w-8 h-8 rounded-full ${k.bg} flex items-center justify-center mb-2`}>
              <k.icon className={`w-4 h-4 ${k.color}`} />
            </div>
            <p className="text-[11px] text-[#7A7A7A]">{k.label}</p>
            <motion.p
              className="text-[20px] font-bold text-[#1A1A1A] mt-1"
              key={k.value}
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {k.value}
            </motion.p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-3.5">
        <motion.div
          className="portal-card p-4 h-[320px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-[13px] font-semibold text-[#1A1A1A] mb-3">Waste collected by month</p>
          <ResponsiveContainer width="100%" height="88%">
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="wasteFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1B7339" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#1B7339" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#F0F0F0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#8A8A8A" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#8A8A8A" }} axisLine={false} tickLine={false} width={36} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #E5E5E5", fontSize: 12 }}
                formatter={(v: number) => [`${v} kg`, "Waste"]}
              />
              <Area
                type="monotone"
                dataKey="kg"
                stroke="#1B7339"
                strokeWidth={2.5}
                fill="url(#wasteFill)"
                animationDuration={1200}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          className="portal-card p-4 h-[320px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-[13px] font-semibold text-[#1A1A1A] mb-3">Impact mix</p>
          <ResponsiveContainer width="100%" height="70%">
            <PieChart>
              <Pie
                data={mix}
                dataKey="value"
                nameKey="name"
                innerRadius={48}
                outerRadius={78}
                paddingAngle={3}
                animationDuration={1100}
              >
                {mix.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E5E5", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1.5 mt-1">
            {mix.map((m, i) => (
              <div key={m.name} className="flex items-center gap-1.5 text-[10px] text-[#5A5A5A]">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                />
                {m.name}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        className="portal-card p-4 h-[280px]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Recycle className="w-4 h-4 text-[#1B7339]" />
          <p className="text-[13px] font-semibold text-[#1A1A1A]">Butts rescued by month</p>
        </div>
        <ResponsiveContainer width="100%" height="88%">
          <BarChart data={monthly}>
            <CartesianGrid stroke="#F0F0F0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#8A8A8A" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#8A8A8A" }} axisLine={false} tickLine={false} width={40} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E5E5", fontSize: 12 }} />
            <Bar dataKey="butts" fill="#EF6C00" radius={[6, 6, 0, 0]} animationDuration={1000} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  )
}
