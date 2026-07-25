"use client"

import { useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Calendar, Download, Leaf, RefreshCw } from "lucide-react"
import { PortalShell } from "@/components/portal/portal-shell"
import { PageHeader } from "@/components/portal/page-header"
import { WhatsNewBanner } from "@/components/portal/whats-new-banner"
import { OutlineButton } from "@/components/portal/outline-button"
import { ImpactOverview } from "@/components/portal/impact-overview"
import { ImpactSdg } from "@/components/portal/impact-sdg"
import { ImpactCircular } from "@/components/portal/impact-circular"
import { ImpactAnalytics } from "@/components/portal/impact-analytics"
import { MotionItem, MotionPage, scaleIn } from "@/components/portal/motion"
import { AnimatePresence, motion } from "framer-motion"
import { usePortalData } from "@/hooks/use-portal-data"
import { DownloadImpactReport } from "@/components/portal/download-impact-report"
import { cn } from "@/lib/utils"

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "analytics", label: "Analytics" },
  { id: "sdg", label: "UN SDGs" },
  { id: "circular", label: "Circular Impact" },
] as const

type TabId = (typeof TABS)[number]["id"]

function ImpactContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { customer, authLoading, dataLoading, isRefreshing, collections, metrics, handleRefresh } =
    usePortalData()

  const tab = useMemo<TabId>(() => {
    const t = searchParams.get("tab")
    if (t === "sdg" || t === "circular" || t === "overview" || t === "analytics") return t
    return "overview"
  }, [searchParams])

  const setTab = (id: TabId) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", id)
    router.replace(`/dashboard/impact?${params.toString()}`)
  }

  return (
    <PortalShell customer={customer} loading={authLoading || (!customer && dataLoading)}>
      <MotionPage className="space-y-5">
        <MotionItem>
          <PageHeader
            icon={Leaf}
            title="Impact"
            subtitle="Track your environmental and social contribution with BuffIndia."
            actions={
              <>
                <OutlineButton>
                  <Calendar className="w-4 h-4" />
                  This Year
                </OutlineButton>
                <DownloadImpactReport customerId={customer?.id}>
                  <OutlineButton>
                    <Download className="w-4 h-4" />
                    Download Impact Report
                  </OutlineButton>
                </DownloadImpactReport>
                <OutlineButton onClick={handleRefresh} disabled={isRefreshing}>
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  Refresh
                </OutlineButton>
              </>
            }
          />
        </MotionItem>

        <MotionItem variants={scaleIn}>
          <WhatsNewBanner variant="impact" />
        </MotionItem>

        <MotionItem>
          <div className="border-b border-[#E5E5E5]">
            <div className="flex gap-6 relative">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "relative pb-2.5 text-[14px] font-medium transition-colors",
                    tab === t.id ? "text-[#1B7339]" : "text-[#7A7A7A] hover:text-[#1A1A1A]",
                  )}
                >
                  {t.label}
                  {tab === t.id && (
                    <motion.span
                      layoutId="impact-tab"
                      className="absolute left-0 right-0 -bottom-px h-0.5 bg-[#1B7339] rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </MotionItem>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {tab === "overview" && (
              <ImpactOverview
                metrics={metrics}
                collections={collections}
                yearlyGoalKg={customer?.monthlyTarget ? customer.monthlyTarget * 12 : 1200}
              />
            )}
            {tab === "analytics" && (
              <ImpactAnalytics metrics={metrics} collections={collections} />
            )}
            {tab === "sdg" && <ImpactSdg metrics={metrics} />}
            {tab === "circular" && <ImpactCircular metrics={metrics} />}
          </motion.div>
        </AnimatePresence>
      </MotionPage>
    </PortalShell>
  )
}

export default function ImpactPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F8F7] flex items-center justify-center text-sm text-[#7A7A7A]">
          Loading impact...
        </div>
      }
    >
      <ImpactContent />
    </Suspense>
  )
}
