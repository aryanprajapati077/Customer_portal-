"use client"

import { useMemo, useState } from "react"
import {
  Activity,
  ArrowDownUp,
  Calendar,
  CalendarCheck2,
  Download,
  Leaf,
  RefreshCw,
  Trash2,
  Truck,
} from "lucide-react"
import { PortalShell } from "@/components/portal/portal-shell"
import { PageHeader } from "@/components/portal/page-header"
import { OutlineButton } from "@/components/portal/outline-button"
import { MetricCard } from "@/components/portal/metric-card"
import { usePortalData } from "@/hooks/use-portal-data"
import { DownloadImpactReport } from "@/components/portal/download-impact-report"
import { formatKg, formatPortalDate } from "@/lib/portal-metrics"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

type Period = "this-month" | "this-year" | "all"

const PERIOD_LABEL: Record<Period, string> = {
  "this-month": "This Month",
  "this-year": "This Year",
  all: "All Time",
}

function frequencyDescription(freq?: string | null) {
  const f = (freq || "").trim()
  if (!f) return "As per service agreement"
  const map: Record<string, string> = {
    Monthly: "Once every month",
    "Every 2 month": "Once every 2 months",
    "Every 3 month": "Once every 3 months",
    "2 times a month": "Twice a month",
  }
  return map[f] || f
}

export default function CollectionsPage() {
  const { customer, authLoading, dataLoading, collections, metrics, handleRefresh, isRefreshing, isGroupView } =
    usePortalData()
  const [sortAsc, setSortAsc] = useState(false)
  const [period, setPeriod] = useState<Period>("this-year")

  const filtered = useMemo(() => {
    const now = new Date()
    const startRaw =
      (customer as { serviceStartDate?: string } | null)?.serviceStartDate || customer?.joinDate
    const start = startRaw ? new Date(startRaw) : null
    const startMonth =
      start && !Number.isNaN(start.getTime())
        ? Date.UTC(start.getFullYear(), start.getMonth(), 1)
        : null

    return collections.filter((c) => {
      if (!c.date) return true
      const d = new Date(c.date)
      if (Number.isNaN(d.getTime())) return true
      if (startMonth != null) {
        const rowMonth = Date.UTC(d.getFullYear(), d.getMonth(), 1)
        if (rowMonth < startMonth) return false
      }
      if (period === "all") return true
      if (period === "this-month") {
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      }
      return d.getFullYear() === now.getFullYear()
    })
  }, [collections, period, customer])

  const sorted = useMemo(() => {
    const list = [...filtered]
    list.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0
      const db = b.date ? new Date(b.date).getTime() : 0
      return sortAsc ? da - db : db - da
    })
    return list
  }, [filtered, sortAsc])

  const periodWasteKg = useMemo(
    () => filtered.reduce((sum, c) => sum + (Number(c.weight) || 0), 0),
    [filtered],
  )

  const kiosks =
    Number(customer?.disposalUnitInstalled) ||
    Number((customer as { noOfKiosk?: number } | null)?.noOfKiosk) ||
    0
  const startDate = formatPortalDate(
    (customer as { serviceStartDate?: string } | null)?.serviceStartDate || customer?.joinDate,
  )
  const status = customer?.status === "Active" || !customer?.status ? "Running" : customer.status
  const frequency =
    (customer as { collectionFrequency?: string } | null)?.collectionFrequency || "—"
  const freqDesc = frequencyDescription(
    (customer as { collectionFrequency?: string } | null)?.collectionFrequency,
  )

  const kioskTypes = useMemo(() => {
    const c = customer as
      | {
          noOfBasicKiosk?: number
          noOfAdvanceKiosk?: number
          noOfPanVendorKiosk?: number
          noOfWallMountKiosk?: number
        }
      | null
      | undefined
    const parts: string[] = []
    if (Number(c?.noOfWallMountKiosk) > 0) parts.push("Wall-mounted")
    if (Number(c?.noOfBasicKiosk) > 0 || Number(c?.noOfAdvanceKiosk) > 0) parts.push("Floor-standing")
    if (Number(c?.noOfPanVendorKiosk) > 0) parts.push("Pan vendor")
    return parts.length ? parts.join(" + ") : "As configured"
  }, [customer])

  return (
    <PortalShell customer={customer} loading={authLoading || (!customer && dataLoading)}>
      <div className="space-y-5">
        <PageHeader
          icon={Truck}
          title="Collections"
          subtitle="Track your cigarette waste collections and ESG reports."
          actions={
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <OutlineButton type="button">
                    <Calendar className="w-4 h-4" />
                    {PERIOD_LABEL[period]}
                    <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                  </OutlineButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[160px]">
                  {(Object.keys(PERIOD_LABEL) as Period[]).map((key) => (
                    <DropdownMenuItem key={key} onClick={() => setPeriod(key)}>
                      {PERIOD_LABEL[key]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DownloadImpactReport customerId={customer?.id}>
                <OutlineButton>
                  <Download className="w-4 h-4" />
                  Download Collection Report
                </OutlineButton>
              </DownloadImpactReport>
            </>
          }
        />

        <div className="portal-card overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#EFEFEF]">
            {[
              { icon: Trash2, label: "No. of Kiosks Installed", value: String(kiosks || "—") },
              {
                icon: Trash2,
                label: "Type of Kiosks Installed",
                value: kioskTypes,
              },
              {
                icon: CalendarCheck2,
                label: "Service Start Date",
                value: startDate === "—" ? "—" : startDate,
              },
              { icon: RefreshCw, label: "Collection Frequency", value: frequency },
            ].map((item) => (
              <div key={item.label} className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <item.icon className="w-4 h-4 text-[#1B7339]" strokeWidth={1.75} />
                  <p className="text-[11px] text-[#7A7A7A]">{item.label}</p>
                </div>
                <p className="text-[14.5px] font-semibold text-[#1A1A1A] leading-snug">{item.value}</p>
              </div>
            ))}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-[#1B7339]" strokeWidth={1.75} />
                <p className="text-[11px] text-[#7A7A7A]">Service Status</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F5E9] text-[#1B7339] text-[12px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1B7339]" />
                {status}
              </span>
              <p className="text-[11px] text-[#8A8A8A] mt-2 leading-snug">
                Service is active and running smoothly.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <MetricCard
            icon={Leaf}
            iconBg="bg-[#E8F5E9]"
            iconColor="text-[#1B7339]"
            label="Total Waste Collected"
            value={formatKg(periodWasteKg || (period === "all" ? metrics.totalWasteKg : periodWasteKg))}
            valueClassName="text-[#1B7339]"
            description={PERIOD_LABEL[period]}
          />
          <MetricCard
            icon={Calendar}
            iconBg="bg-[#FFF3E0]"
            iconColor="text-[#EF6C00]"
            label="Total Collections"
            value={String(sorted.length)}
            valueClassName="text-[#EF6C00]"
            description={PERIOD_LABEL[period]}
          />
          <MetricCard
            icon={Calendar}
            iconBg="bg-[#F3E5F5]"
            iconColor="text-[#7B1FA2]"
            label="Collection Frequency"
            value={frequency}
            valueClassName="text-[#7B1FA2]"
            description={freqDesc}
          />
        </div>

        <div className="portal-card overflow-hidden">
          <div className="px-5 py-4 border-b border-[#F0F0F0] flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-[#1A1A1A]">Collection History</h2>
            <OutlineButton onClick={handleRefresh} disabled={isRefreshing} className="!h-8">
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </OutlineButton>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="bg-[#EAF6EC] text-left">
                  <th className="px-5 py-3 text-[12px] font-semibold text-[#1B7339]">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => setSortAsc((v) => !v)}
                    >
                      Last Collection Date
                      <ArrowDownUp className="w-3.5 h-3.5" />
                    </button>
                  </th>
                  <th className="px-5 py-3 text-[12px] font-semibold text-[#1B7339]">
                    <span className="inline-flex items-center gap-1">Waste Collected</span>
                  </th>
                  <th className="px-5 py-3 text-[12px] font-semibold text-[#1B7339]">ESG Report</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-10 text-center text-sm text-[#8A8A8A]">
                      No collections recorded for {PERIOD_LABEL[period].toLowerCase()}.
                    </td>
                  </tr>
                ) : (
                  sorted.map((c, idx) => (
                    <tr key={`${c.date}-${idx}`} className="border-t border-[#F0F0F0]">
                      <td className="px-5 py-3.5">
                        <span className="inline-flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-2 text-[13px] text-[#1A1A1A]">
                            <Calendar className="w-4 h-4 text-[#1B7339]" />
                            {formatPortalDate(c.date)}
                          </span>
                          {isGroupView && (c as { locationName?: string }).locationName && (
                            <span className="text-[11px] font-medium text-[#1B7339] pl-6">
                              {(c as { locationName?: string }).locationName}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] font-medium text-[#1A1A1A]">
                        {formatKg(Number(c.weight) || 0)}
                      </td>
                      <td className="px-5 py-3.5">
                        <DownloadImpactReport customerId={customer?.id}>
                          <button type="button" className="portal-btn-outline-green">
                            <Download className="w-4 h-4" />
                            Download Report
                          </button>
                        </DownloadImpactReport>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PortalShell>
  )
}
