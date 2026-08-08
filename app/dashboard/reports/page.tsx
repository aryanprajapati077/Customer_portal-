"use client"

import { useState } from "react"
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  Download,
  FileBarChart2,
  FileText,
  History,
  Sparkles,
} from "lucide-react"
import { PortalShell } from "@/components/portal/portal-shell"
import { PageHeader } from "@/components/portal/page-header"
import { OutlineButton } from "@/components/portal/outline-button"
import { usePortalData } from "@/hooks/use-portal-data"
import { DownloadImpactReport } from "@/components/portal/download-impact-report"
import { CertificateDownloadButton, DownloadCertificate } from "@/components/portal/download-certificate"
import { formatPortalDate } from "@/lib/portal-metrics"
import { cn } from "@/lib/utils"
import type { ReportRangeKey } from "@/lib/report-date-range"

const PERIOD_OPTIONS: {
  value: ReportRangeKey
  label: string
  description: string
  icon: typeof Calendar
}[] = [
  {
    value: "this-year",
    label: "Current Year",
    description: "Jan 1 through today",
    icon: Calendar,
  },
  {
    value: "quarterly",
    label: "Quarterly",
    description: "Current quarter to date",
    icon: CalendarRange,
  },
  {
    value: "installation",
    label: "Installation till date",
    description: "From service start to today",
    icon: History,
  },
  {
    value: "month",
    label: "This month",
    description: "Current calendar month",
    icon: CalendarDays,
  },
  {
    value: "custom",
    label: "Custom range",
    description: "Pick start and end dates",
    icon: Sparkles,
  },
]

export default function ReportsPage() {
  const { customer, authLoading, dataLoading, reports, certificates, selectedLocationId } = usePortalData()
  const [period, setPeriod] = useState<ReportRangeKey>("this-year")

  const selected = PERIOD_OPTIONS.find((p) => p.value === period) ?? PERIOD_OPTIONS[0]

  return (
    <PortalShell customer={customer} loading={authLoading || (!customer && dataLoading)}>
      <div className="space-y-5">
        <PageHeader
          icon={FileBarChart2}
          title="Reports"
          subtitle="Download ESG impact reports and sustainability certificates."
          actions={
            <div className="flex flex-wrap gap-2">
              <DownloadImpactReport customerId={customer?.id} locationId={selectedLocationId} defaultRange="this-year">
                <OutlineButton>
                  <Download className="w-4 h-4" />
                  Download Impact Report
                </OutlineButton>
              </DownloadImpactReport>
              <DownloadCertificate customerId={customer?.id} defaultType="services">
                <OutlineButton>
                  <Download className="w-4 h-4" />
                  Download Certificate
                </OutlineButton>
              </DownloadCertificate>
            </div>
          }
        />

        <div className="relative overflow-hidden rounded-[1.25rem] border border-[#DCE8DC] bg-gradient-to-br from-white via-[#F8FBF9] to-[#EEF6F0] p-5 shadow-[0_8px_32px_rgba(27,115,57,0.06)]">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#C8F000]/10 blur-3xl"
          />
          <div className="relative">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1B7339]/80">
                  Generate by period
                </p>
                <h3 className="mt-1 text-[17px] font-semibold text-[#141414]">
                  Choose your reporting window
                </h3>
                <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-[#6B6B6B]">
                  Select a preset or custom range — your download will reflect collections and impact
                  for that period.
                </p>
              </div>
              <div className="rounded-full border border-[#C8E6D4] bg-white/80 px-3 py-1.5 text-[12px] font-medium text-[#1B7339]">
                Selected: {selected.label}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {PERIOD_OPTIONS.map((opt) => {
                const Icon = opt.icon
                const active = period === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPeriod(opt.value)}
                    className={cn(
                      "group flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all duration-200",
                      active
                        ? "border-[#1B7339] bg-white shadow-[0_4px_20px_rgba(27,115,57,0.12)] ring-1 ring-[#1B7339]/20"
                        : "border-[#E5E5E5] bg-white/70 hover:border-[#1B7339]/35 hover:bg-white",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                        active
                          ? "bg-[#1B7339] text-white"
                          : "bg-[#E8F5E9] text-[#1B7339] group-hover:bg-[#D4EDD8]",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold text-[#141414]">{opt.label}</span>
                      <span className="mt-0.5 block text-[11.5px] leading-snug text-[#8A8A8A]">
                        {opt.description}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[12px] text-[#7A7A7A]">
                {period === "custom"
                  ? "You'll pick exact dates in the download dialog."
                  : `Ready to export your ${selected.label.toLowerCase()} report.`}
              </p>
              <DownloadImpactReport
                key={period}
                customerId={customer?.id}
                locationId={selectedLocationId}
                defaultRange={period}
              >
                <button
                  type="button"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#1B7339] px-6 text-[13px] font-semibold text-white shadow-[0_6px_20px_rgba(27,115,57,0.25)] transition hover:bg-[#145a2c] hover:shadow-[0_8px_24px_rgba(27,115,57,0.3)]"
                >
                  <Download className="w-4 h-4" />
                  Download {selected.label} report
                </button>
              </DownloadImpactReport>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E5E5] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#F0F0F0]">
            <h2 className="text-[16px] font-semibold text-[#1A1A1A]">ESG Reports</h2>
            <p className="text-[13px] text-[#7A7A7A] mt-0.5">All generated sustainability reports</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="bg-[#EAF6EC] text-left">
                  <th className="px-5 py-3 text-[12px] font-semibold text-[#2E7D32]">Report</th>
                  <th className="px-5 py-3 text-[12px] font-semibold text-[#2E7D32]">Date</th>
                  <th className="px-5 py-3 text-[12px] font-semibold text-[#2E7D32]">Size</th>
                  <th className="px-5 py-3 text-[12px] font-semibold text-[#2E7D32]">Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-[#8A8A8A]">
                      No reports available yet. Use Download Impact Report to generate one.
                    </td>
                  </tr>
                ) : (
                  reports.map((r) => (
                    <tr key={r.id} className="border-t border-[#F0F0F0]">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[#E8F5E9] flex items-center justify-center">
                            <FileText className="w-4 h-4 text-[#2E7D32]" />
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-[#1A1A1A]">{r.name}</p>
                            <p className="text-[11px] text-[#8A8A8A]">
                              {r.description || r.type || "ESG Impact Report"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] text-[#4A4A4A]">{formatPortalDate(r.date)}</td>
                      <td className="px-5 py-3.5 text-[13px] text-[#4A4A4A]">{r.size || "~10 KB"}</td>
                      <td className="px-5 py-3.5">
                        {r.driveFileUrl ? (
                          <button
                            type="button"
                            onClick={() => window.open(r.driveFileUrl, "_blank")}
                            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg border border-[#2E7D32] text-[#2E7D32] text-[13px] font-semibold hover:bg-[#E8F5E9]"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                        ) : (
                          <DownloadImpactReport customerId={customer?.id} locationId={selectedLocationId}>
                            <button
                              type="button"
                              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg border border-[#2E7D32] text-[#2E7D32] text-[13px] font-semibold hover:bg-[#E8F5E9]"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </button>
                          </DownloadImpactReport>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E5E5] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#F0F0F0]">
            <h2 className="text-[16px] font-semibold text-[#1A1A1A]">Certificates</h2>
            <p className="text-[13px] text-[#7A7A7A] mt-0.5">Impact certificates issued to your organization</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-5">
            {certificates.length === 0 ? (
              <p className="text-sm text-[#8A8A8A] col-span-full text-center py-6">No certificates yet.</p>
            ) : (
              certificates.map((c) => (
                <div key={c.id} className="rounded-xl border border-[#E8E8E8] p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#E8F5E9] flex items-center justify-center">
                      <FileText className="w-5 h-5 text-[#2E7D32]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-[#1A1A1A]">{c.name}</p>
                      <p className="text-[11px] text-[#8A8A8A] mt-0.5">{formatPortalDate(c.issueDate)}</p>
                      <div className="mt-3">
                        <CertificateDownloadButton
                          customerId={customer?.id}
                          certificateId={c.id}
                          certificateType={c.type}
                          driveFileUrl={c.driveFileUrl}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PortalShell>
  )
}
