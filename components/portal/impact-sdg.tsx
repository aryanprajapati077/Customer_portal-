"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { ChevronRight, Cigarette, Recycle, Sparkles } from "lucide-react"
import type { PortalMetrics } from "@/lib/portal-metrics"
import { formatIndianNumber, formatKg } from "@/lib/portal-metrics"
import { cn } from "@/lib/utils"

const ENV_SDGS = [
  { n: 6, title: "Clean Water and Sanitation", src: "/report-assets/sdg/sdg-6.png", blurb: "Preventing toxic leachate and protecting water bodies from cigarette filter pollution." },
  { n: 12, title: "Responsible Consumption and Production", src: "/report-assets/sdg/sdg-12.png", blurb: "Cigarette waste is collected, processed, and upcycled into KraftReborn products." },
  { n: 13, title: "Climate Action", src: "/report-assets/sdg/sdg-13.png", blurb: "Diverting waste from open burning and landfills reduces associated emissions." },
  { n: 14, title: "Life Below Water", src: "/report-assets/sdg/sdg-14.png", blurb: "Keeping plastic filters out of drains and oceans protects aquatic ecosystems." },
  { n: 15, title: "Life on Land", src: "/report-assets/sdg/sdg-15.png", blurb: "Cleaner streets and soil mean healthier terrestrial habitats around your sites." },
]

const SOCIAL_SDGS = [
  { n: 3, title: "Good Health and Well-being", src: "/report-assets/sdg/sdg-3.png", blurb: "Reducing litter and toxic residue supports cleaner, healthier shared spaces." },
  { n: 11, title: "Sustainable Cities and Communities", src: "/report-assets/sdg/sdg-11.png", blurb: "Kiosks and collection services make cities visibly cleaner and more responsible." },
]

const ALL_SDGS = [...ENV_SDGS, ...SOCIAL_SDGS]

interface ImpactSdgProps {
  metrics: PortalMetrics
}

function SdgSticker({
  n,
  title,
  src,
  index,
  active,
  onSelect,
}: {
  n: number
  title: string
  src: string
  index: number
  active: boolean
  onSelect: () => void
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-white p-2 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors",
        active ? "border-[#1B7339] ring-2 ring-[#1B7339]/20" : "border-[#E8E8E8]",
      )}
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: index * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, scale: 1.03 }}
    >
      <div className="relative aspect-square w-full">
        <Image src={src} alt={`UN SDG ${n}: ${title}`} fill className="object-contain" sizes="120px" />
      </div>
      <p className="mt-1.5 px-0.5 text-center text-[10px] font-medium leading-tight text-[#4A4A4A]">
        {title}
      </p>
    </motion.button>
  )
}

export function ImpactSdg({ metrics }: ImpactSdgProps) {
  const [selected, setSelected] = useState(12)
  const active = ALL_SDGS.find((s) => s.n === selected) || ALL_SDGS[1]
  const radius = 46
  const circ = 2 * Math.PI * radius

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4 items-start">
      <motion.div
        className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <motion.div
            className="relative w-[110px] h-[110px] shrink-0"
            animate={{ rotate: [0, 2, 0, -2, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r={radius} fill="none" stroke="#E8E8E8" strokeWidth="10" />
              <motion.circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="#2E7D32"
                strokeWidth="10"
                strokeLinecap="round"
                initial={{ strokeDasharray: `0 ${circ}` }}
                animate={{ strokeDasharray: `${circ} 0` }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[20px] font-bold text-[#1A1A1A]">7/7</span>
              <span className="text-[10px] text-[#7A7A7A] leading-tight px-2">Goals Supported</span>
            </div>
          </motion.div>
          <div>
            <h3 className="text-[16px] font-semibold text-[#1A1A1A]">
              You are contributing to all 7 UN Sustainable Development Goals
            </h3>
            <p className="text-[13px] text-[#6B6B6B] mt-1.5 leading-relaxed">
              Tap a sticker to explore how your partnership advances each goal. Official UN SDG icons shown.
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[13px] font-semibold text-[#2E7D32]">🌿 Environmental</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {ENV_SDGS.map((sdg, i) => (
              <SdgSticker
                key={sdg.n}
                {...sdg}
                index={i}
                active={selected === sdg.n}
                onSelect={() => setSelected(sdg.n)}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[13px] font-semibold text-[#2E7D32]">👥 Social</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {SOCIAL_SDGS.map((sdg, i) => (
              <SdgSticker
                key={sdg.n}
                {...sdg}
                index={i + ENV_SDGS.length}
                active={selected === sdg.n}
                onSelect={() => setSelected(sdg.n)}
              />
            ))}
          </div>
        </div>
      </motion.div>

      <div className="space-y-3 xl:sticky xl:top-20">
        <motion.div
          key={active.n}
          className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="relative mb-4 overflow-hidden rounded-xl">
            <Image
              src={active.src}
              alt={`UN SDG ${active.n}`}
              width={640}
              height={640}
              className="h-auto w-full object-contain"
            />
          </div>
          <p className="text-[13px] font-semibold text-[#1A1A1A] mb-2">
            SDG {active.n} {active.title}
          </p>
          <p className="text-[12px] text-[#6B6B6B] mb-3">BuffIndia&apos;s Contribution</p>
          <p className="text-[12.5px] text-[#4A4A4A] leading-relaxed mb-3">{active.blurb}</p>
          <ul className="space-y-2.5">
            {[
              "Cigarette waste is collected responsibly from your premises.",
              "Filters are processed to recover cellulose acetate.",
              "Upcycled into sustainable products through KraftReborn.",
            ].map((text) => (
              <li key={text} className="flex gap-2 text-[12px] text-[#4A4A4A]">
                <Recycle className="w-3.5 h-3.5 text-[#2E7D32] shrink-0 mt-0.5" />
                {text}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          className="rounded-2xl border border-[#E5E5E5] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-2"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <p className="text-[13px] font-semibold text-[#1A1A1A] mb-1">Your Impact</p>
          {[
            {
              icon: Cigarette,
              text: `${formatIndianNumber(metrics.cigaretteButts)} Cigarette butts rescued`,
              bg: "bg-[#FFF3E0]",
              color: "text-[#EF6C00]",
            },
            {
              icon: Recycle,
              text: `${formatKg(metrics.microplasticsKg)} Microplastics upcycled`,
              bg: "bg-[#E8F5E9]",
              color: "text-[#2E7D32]",
            },
            {
              icon: Sparkles,
              text: `${formatIndianNumber(metrics.kraftrebornCredits)} amount to be claim pending`,
              bg: "bg-[#F3E5F5]",
              color: "text-[#7B1FA2]",
            },
          ].map((row, i) => (
            <motion.div
              key={row.text}
              className="flex items-center gap-3 rounded-xl border border-[#F0F0F0] px-3 py-2.5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08 }}
              whileHover={{ x: 3 }}
            >
              <div className={`w-8 h-8 rounded-full ${row.bg} flex items-center justify-center`}>
                <row.icon className={`w-4 h-4 ${row.color}`} />
              </div>
              <span className="flex-1 text-[12px] font-medium text-[#1A1A1A]">{row.text}</span>
              <ChevronRight className="w-4 h-4 text-[#B0B0B0]" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
