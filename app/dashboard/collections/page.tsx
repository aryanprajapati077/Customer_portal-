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

export default function CollectionsPage() {
  const { customer, authLoading, dataLoading, collections, metrics, handleRefresh, isRefreshing } =
    usePortalData()
  const [sortAsc, setSortAsc] = useState(false)

  const sorted = useMemo(() => {
    const list = [...collections]
    list.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0
      const db = b.date ? new Date(b.date).getTime() : 0
      return sortAsc ? da - db : db - da
    })
    return list
  }, [collections, sortAsc])

  const kiosks = customer?.disposalUnitInstalled || 12
  const startDate = formatPortalDate(customer?.joinDate)
  const status = customer?.status === "Active" || !customer?.status ? "Running" : customer.status

  return (
    <PortalShell customer={customer} loading={authLoading || (!customer && dataLoading)}>
      <div className="space-y-5">
        <PageHeader
          icon={Truck}
          title="Collections"
          subtitle="Track your cigarette waste collections and ESG reports."
          actions={
            <>
              <OutlineButton>
                <Calendar className="w-4 h-4" />
                This Year
              </OutlineButton>
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
              { icon: Trash2, label: "No. of Kiosks Installed", value: String(kiosks) },
              {
                icon: Trash2,
                label: "Type of Kiosks Installed",
                value: "Wall-mounted + Floor-standing",
              },
              {
                icon: CalendarCheck2,
                label: "Service Start Date",
                value: startDate === "—" ? "01 Jan 2026" : startDate,
              },
              { icon: RefreshCw, label: "Collection Frequency", value: "Fortnightly" },
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
            value={formatKg(metrics.totalWasteKg)}
            valueClassName="text-[#1B7339]"
            description="This Year"
          />
          <MetricCard
            icon={Calendar}
            iconBg="bg-[#FFF3E0]"
            iconColor="text-[#EF6C00]"
            label="Total Collections"
            value={String(metrics.collectionCount || sorted.length || 48)}
            valueClassName="text-[#EF6C00]"
            description="This Year"
          />
          <MetricCard
            icon={Calendar}
            iconBg="bg-[#F3E5F5]"
            iconColor="text-[#7B1FA2]"
            label="Collection Frequency"
            value="Fortnightly"
            valueClassName="text-[#7B1FA2]"
            description="Once in 15 Days"
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
                    <span className="inline-flex items-center gap-1">
                      Waste Collected
                      <ArrowDownUp className="w-3.5 h-3.5" />
                    </span>
                  </th>
                  <th className="px-5 py-3 text-[12px] font-semibold text-[#1B7339]">ESG Report</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-10 text-center text-sm text-[#8A8A8A]">
                      No collections recorded yet.
                    </td>
                  </tr>
                ) : (
                  sorted.map((c, idx) => (
                    <tr key={`${c.date}-${idx}`} className="border-t border-[#F0F0F0]">
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-2 text-[13px] text-[#1A1A1A]">
                          <Calendar className="w-4 h-4 text-[#1B7339]" />
                          {formatPortalDate(c.date)}
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
