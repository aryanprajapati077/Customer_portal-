"use client"

import { useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type ReportRange = "this-year" | "quarterly" | "installation" | "month"
type ReportFormat = "pdf" | "excel"

interface DownloadImpactReportProps {
  customerId?: string
  /** YYYY-MM when range is month */
  period?: string
  defaultRange?: ReportRange
  children: React.ReactNode
}

async function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function resolvePeriod(range: ReportRange, period?: string): string | undefined {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() + 1
  if (range === "month") return period || `${y}-${String(m).padStart(2, "0")}`
  if (range === "this-year") return `${y}-12`
  if (range === "quarterly") {
    const qEnd = Math.ceil(m / 3) * 3
    return `${y}-${String(qEnd).padStart(2, "0")}`
  }
  return undefined
}

export function DownloadImpactReport({
  customerId,
  period,
  defaultRange = "installation",
  children,
}: DownloadImpactReportProps) {
  const [open, setOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [range, setRange] = useState<ReportRange>(defaultRange)
  const [format, setFormat] = useState<ReportFormat>("pdf")

  const ranges: { id: ReportRange; label: string; hint: string }[] = useMemo(
    () => [
      { id: "this-year", label: "This year", hint: "Jan–today of current year" },
      { id: "quarterly", label: "Quarterly", hint: "Current quarter to date" },
      { id: "installation", label: "Installation till date", hint: "Full partnership history" },
      { id: "month", label: "This month", hint: "Latest monthly snapshot" },
    ],
    [],
  )

  const handleDownload = async () => {
    if (!customerId) return
    setDownloading(true)
    try {
      const resolved = resolvePeriod(range, period)

      if (format === "excel") {
        const res = await fetch("/api/customer/impact-report-excel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customerId, period: resolved }),
        })
        if (!res.ok) throw new Error("Failed to generate Excel")
        const blob = await res.blob()
        const disposition = res.headers.get("Content-Disposition")
        const filenameMatch = disposition?.match(/filename="(.+)"/)
        const filename = filenameMatch?.[1] || `${customerId}-Impact-Report.xlsx`
        await triggerDownload(blob, filename)
        setOpen(false)
        return
      }

      const res = await fetch("/api/customer/impact-report-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          period: resolved,
          range,
        }),
      })
      if (!res.ok) throw new Error("Failed to generate report")
      const blob = await res.blob()
      const disposition = res.headers.get("Content-Disposition")
      const filenameMatch = disposition?.match(/filename="(.+)"/)
      const filename = filenameMatch?.[1] || `${customerId}-ESG-Report.pdf`
      await triggerDownload(blob, filename)
      setOpen(false)
    } catch (error) {
      console.error("Download report failed:", error)
      alert("Could not download report. Please try again.")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild disabled={!customerId}>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Download ESG Impact Report</DialogTitle>
          <DialogDescription>
            Choose format and period. Your customer logo from the profile is used automatically when
            available.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-sm font-medium text-[#1F4A30]">Format</p>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { id: "pdf" as const, label: "PDF Report", hint: "Branded 4-page ESG PDF", Icon: FileText },
                {
                  id: "excel" as const,
                  label: "Excel (.xlsx)",
                  hint: "Customer + month-wise data",
                  Icon: FileSpreadsheet,
                },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFormat(f.id)}
                className={cn(
                  "flex flex-col items-start rounded-xl border px-3 py-2.5 text-left transition-colors",
                  format === f.id
                    ? "border-[#1B7339] bg-[#E8F5E9]"
                    : "border-[#E5E5E5] bg-white hover:bg-[#FAFAFA]",
                )}
              >
                <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1A1A1A]">
                  <f.Icon className="h-3.5 w-3.5 text-[#1B7339]" />
                  {f.label}
                </span>
                <span className="mt-0.5 text-[11px] text-[#7A7A7A]">{f.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-[#1F4A30]">Report period</p>
          <div className="grid grid-cols-1 gap-2">
            {ranges.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRange(r.id)}
                className={cn(
                  "flex items-start justify-between rounded-xl border px-3 py-2.5 text-left transition-colors",
                  range === r.id
                    ? "border-[#1B7339] bg-[#E8F5E9]"
                    : "border-[#E5E5E5] bg-white hover:bg-[#FAFAFA]",
                )}
              >
                <span>
                  <span className="block text-[13px] font-semibold text-[#1A1A1A]">{r.label}</span>
                  <span className="mt-0.5 block text-[11px] text-[#7A7A7A]">{r.hint}</span>
                </span>
                <span
                  className={cn(
                    "mt-1 h-3.5 w-3.5 rounded-full border",
                    range === r.id ? "border-[#1B7339] bg-[#1B7339]" : "border-[#C5C5C5]",
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#E5E5E5] bg-[#F8FBF8] p-3">
          <p className="text-[12px] leading-relaxed text-[#4A4A4A]">
            {format === "pdf"
              ? "PDF uses your saved customer logo and profile details from the admin customer record."
              : "Excel includes Customer Details, Cumulative Impact Summary, Month-wise Impact Details, and calculation notes."}
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="w-full bg-[#1B7339] hover:bg-[#145a2c] sm:w-auto"
          >
            {downloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : format === "excel" ? (
              <FileSpreadsheet className="mr-2 h-4 w-4" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {format === "excel" ? "Download Excel" : "Download PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
