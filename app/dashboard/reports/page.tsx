"use client"

import { useState } from "react"
import { Download, FileBarChart2, FileText } from "lucide-react"
import { PortalShell } from "@/components/portal/portal-shell"
import { PageHeader } from "@/components/portal/page-header"
import { OutlineButton } from "@/components/portal/outline-button"
import { usePortalData } from "@/hooks/use-portal-data"
import { DownloadImpactReport } from "@/components/portal/download-impact-report"
import { CertificateDownloadButton, DownloadCertificate } from "@/components/portal/download-certificate"
import { formatPortalDate } from "@/lib/portal-metrics"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ReportRangeKey } from "@/lib/report-date-range"

const PERIOD_OPTIONS: { value: ReportRangeKey; label: string }[] = [
  { value: "this-year", label: "Current Year" },
  { value: "quarterly", label: "Quarterly" },
  { value: "installation", label: "Installation till date" },
  { value: "month", label: "This month" },
  { value: "custom", label: "Start date to end date" },
]

export default function ReportsPage() {
  const { customer, authLoading, dataLoading, reports, certificates } = usePortalData()
  const [period, setPeriod] = useState<ReportRangeKey>("this-year")

  return (
    <PortalShell customer={customer} loading={authLoading || (!customer && dataLoading)}>
      <div className="space-y-5">
        <PageHeader
          icon={FileBarChart2}
          title="Reports"
          subtitle="Download ESG impact reports and sustainability certificates."
          actions={
            <div className="flex flex-wrap gap-2">
              <DownloadImpactReport customerId={customer?.id} defaultRange="this-year">
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

        <div className="portal-card p-4">
          <p className="text-[13px] font-semibold text-[#1A1A1A] mb-2">Generate by period</p>
          <p className="text-[12px] text-[#7A7A7A] mb-3">
            Choose current year, quarterly, installation till date, this month, or a custom start–end
            date range when you download.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-1.5 flex-1 max-w-sm">
              <label className="text-[12px] font-medium text-[#5A5A5A]">Report period</label>
              <Select value={period} onValueChange={(v) => setPeriod(v as ReportRangeKey)}>
                <SelectTrigger className="h-10 rounded-xl border-[#D8D8D8] bg-white text-[13px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DownloadImpactReport
              key={period}
              customerId={customer?.id}
              defaultRange={period}
            >
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#1B7339] px-4 text-[13px] font-semibold text-white hover:bg-[#145a2c]"
              >
                <Download className="w-4 h-4" />
                Download report
              </button>
            </DownloadImpactReport>
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
                          <DownloadImpactReport customerId={customer?.id}>
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
