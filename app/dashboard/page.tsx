"use client"

import Link from "next/link"
import Image from "next/image"
import {
  Cigarette,
  Download,
  Droplets,
  FileText,
  Leaf,
  Recycle,
  RefreshCw,
  Sparkles,
  HeartPulse,
  Waves,
} from "lucide-react"
import { PortalShell } from "@/components/portal/portal-shell"
import { WhatsNewBanner } from "@/components/portal/whats-new-banner"
import { MetricCard } from "@/components/portal/metric-card"
import { MotionItem, MotionPage, fadeUp, scaleIn, staggerFast } from "@/components/portal/motion"
import { motion } from "framer-motion"
import { usePortalData } from "@/hooks/use-portal-data"
import { DownloadImpactReport } from "@/components/portal/download-impact-report"
import { ReportThumb, reportPeriodFromDate } from "@/components/portal/report-thumb"
import {
  firstName,
  formatIndianNumber,
  formatKg,
  formatWaterL,
} from "@/lib/portal-metrics"
import { SERVICE_STATUS, normalizeServiceStatus } from "@/lib/service-status"

export default function DashboardPage() {
  const {
    customer,
    authLoading,
    dataLoading,
    isRefreshing,
    reports,
    metrics,
    handleRefresh,
  } = usePortalData()

  const latestReport = reports[0]
  const name = firstName(
    customer?.contactPerson || (customer as { primaryPocName?: string } | null)?.primaryPocName,
  )
  const waterLakh = Math.max(1, Math.round(metrics.waterProtectedL / 100000))
  const period = reportPeriodFromDate(latestReport?.date || latestReport?.period || null)
  const reportTitle =
    latestReport?.name || `Monthly ESG Impact Report – ${period.monthLabel} ${period.year}`
  const reportDateLine = period.dateLabel
  const reportPeriodKey =
    latestReport?.period ||
    `${period.year}-${String(new Date(latestReport?.date || Date.now()).getMonth() + 1).padStart(2, "0")}`
  const statusCode = normalizeServiceStatus(
    (customer as { serviceStatus?: string } | null)?.serviceStatus || customer?.status,
  )
  const statusMeta = SERVICE_STATUS[statusCode]

  const metricItems = [
    {
      key: "waste",
      icon: Leaf,
      iconBg: "bg-[#E8F5E9]",
      iconColor: "text-[#1B7339]",
      label: "Total Waste Collected",
      value: formatKg(metrics.totalWasteKg),
      description: "Total waste processed",
    },
    {
      key: "butts",
      icon: Cigarette,
      iconBg: "bg-[#FFF3E0]",
      iconColor: "text-[#EF6C00]",
      label: "Cigarette Butts Rescued",
      value: formatIndianNumber(metrics.cigaretteButts),
      description: "Total butts collected",
    },
    {
      key: "micro",
      icon: Recycle,
      iconBg: "bg-[#E8F5E9]",
      iconColor: "text-[#1B7339]",
      label: "Microplastics Upcycled",
      value: formatKg(metrics.microplasticsKg),
      description: "Microplastics converted to products",
    },
    {
      key: "water",
      icon: Droplets,
      iconBg: "bg-[#E3F2FD]",
      iconColor: "text-[#1565C0]",
      label: "Water Resources Protected",
      value: formatWaterL(metrics.waterProtectedL),
      description: "Water protected through recycling",
    },
    {
      key: "credits",
      icon: Sparkles,
      iconBg: "bg-[#FFF3E0]",
      iconColor: "text-[#EF6C00]",
      label: "Amount to be claim pending",
      value: formatIndianNumber(metrics.kraftrebornCredits),
      description: "Pending claim amount",
      footer: (
        <Link href="/dashboard/shop" className="inline-block mt-2 text-[12px] font-semibold text-[#1565C0]">
          Shop KraftReborn →
        </Link>
      ),
    },
  ]

  return (
    <PortalShell customer={customer} loading={authLoading || (!customer && dataLoading)}>
      <MotionPage className="space-y-5">
        <MotionItem>
          <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-3 pt-1">
            <div>
              <h1 className="text-[28px] md:text-[30px] font-bold text-[#1A1A1A] tracking-[-0.02em] leading-tight">
                Welcome back, {name}! 👋
              </h1>
              <p className="text-[13.5px] text-[#7A7A7A] mt-1">
                Here&apos;s your sustainability impact overview
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${statusMeta.badgeClass}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`} />
                {statusMeta.label}
              </span>
              <DownloadImpactReport customerId={customer?.id}>
                <button type="button" className="portal-btn-outline">
                  <Download className="w-4 h-4" />
                  Download ESG Report
                </button>
              </DownloadImpactReport>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="portal-btn-outline-green"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh Data
              </button>
            </div>
          </div>
        </MotionItem>

        <MotionItem variants={scaleIn}>
          <WhatsNewBanner variant="home" />
        </MotionItem>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3"
          variants={staggerFast}
          initial="hidden"
          animate="show"
        >
          {metricItems.map((item) => (
            <MotionItem key={item.key} variants={fadeUp} className="h-full">
              <MetricCard
                icon={item.icon}
                iconBg={item.iconBg}
                iconColor={item.iconColor}
                label={item.label}
                value={item.value}
                description={item.description}
                footer={item.footer}
              />
            </MotionItem>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          <MotionItem>
            <div className="portal-card p-5 h-full">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-[#1B7339]" />
                <h2 className="text-[15px] font-semibold text-[#1A1A1A]">Latest Report</h2>
              </div>
              <div className="flex gap-4">
                <div className="w-[92px] h-[118px] rounded-lg border border-[#E5E5E5] bg-[#F7F9F6] overflow-hidden shrink-0">
                  <ReportThumb
                    monthLabel={period.monthLabel}
                    year={period.year}
                    className="h-full w-full"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-[#1A1A1A] leading-snug">{reportTitle}</p>
                  <p className="text-[12px] text-[#8A8A8A] mt-1">
                    {reportDateLine} | {latestReport?.size || "~10 KB"}
                  </p>
                  <p className="text-[12.5px] text-[#5A5A5A] mt-2 leading-relaxed">
                    {latestReport?.description ||
                      "Auto-generated monthly sustainability and ESG impact summary."}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <DownloadImpactReport customerId={customer?.id} period={reportPeriodKey}>
                      <button type="button" className="portal-btn-solid">
                        <Download className="w-4 h-4" />
                        Download Report
                      </button>
                    </DownloadImpactReport>
                    <Link href="/dashboard/reports" className="portal-btn-outline-green">
                      View All Reports
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </MotionItem>

          <MotionItem>
            <div className="portal-card p-5 h-full">
              <div className="flex items-center gap-2 mb-3">
                <Leaf className="w-4 h-4 text-[#1B7339]" />
                <h2 className="text-[15px] font-semibold text-[#1A1A1A]">Your Impact at a Glance</h2>
              </div>
              <div className="flex gap-3 items-start">
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold text-[#1B7339]">
                    You have made a real difference!
                  </p>
                  <p className="text-[12.5px] text-[#4A4A4A] mt-2 leading-relaxed">
                    You have helped prevent{" "}
                    <strong>{formatIndianNumber(metrics.cigaretteButts)} cigarette butts</strong> from
                    entering the environment and protected{" "}
                    <strong>{waterLakh} lakh liters</strong> of water.
                  </p>
                </div>
                <motion.div
                  className="relative w-[140px] h-[110px] shrink-0"
                  animate={{ y: [0, -4, 0], rotate: [0, 1.5, 0, -1.5, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Image
                    src="/portal/impact-globe.svg"
                    alt="Green earth impact"
                    fill
                    className="object-contain"
                    sizes="140px"
                    priority
                  />
                </motion.div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#F0F0F0]">
                {[
                  { icon: Leaf, label: "Cleaner Environment" },
                  { icon: Waves, label: "Water Protected" },
                  { icon: HeartPulse, label: "Healthier Communities" },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col items-center gap-1.5 text-center">
                    <item.icon className="w-4 h-4 text-[#1B7339]" strokeWidth={1.75} />
                    <span className="text-[11px] text-[#5A5A5A] leading-tight">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </MotionItem>
        </div>
      </MotionPage>
    </PortalShell>
  )
}
