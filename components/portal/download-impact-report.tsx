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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Download, FileSpreadsheet, Loader2 } from "lucide-react"
import type { ReportRangeKey } from "@/lib/report-date-range"

export type ReportRange = ReportRangeKey
type ReportFormat = "pdf" | "excel"

interface DownloadImpactReportProps {
  customerId?: string
  /** Group location filter — aggregates linked locations when omitted. */
  locationId?: string | null
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
  locationId,
  period,
  defaultRange = "installation",
  children,
}: DownloadImpactReportProps) {
  const [open, setOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [range, setRange] = useState<ReportRange>(defaultRange)
  const [format, setFormat] = useState<ReportFormat>("pdf")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const ranges: { id: ReportRange; label: string; hint: string }[] = useMemo(
    () => [
      { id: "this-year", label: "Current Year", hint: "Jan–today of current year" },
      { id: "quarterly", label: "Quarterly", hint: "Current quarter to date" },
      { id: "installation", label: "Installation till date", hint: "Full partnership history" },
      { id: "month", label: "This month", hint: "Latest monthly snapshot" },
      { id: "custom", label: "Start date to end date", hint: "Pick a custom date range" },
    ],
    [],
  )

  const handleDownload = async () => {
    if (!customerId) return
    if (range === "custom" && (!startDate || !endDate)) {
      alert("Please select both start and end dates.")
      return
    }
    setDownloading(true)
    try {
      const resolved = resolvePeriod(range, period)
      const payload = {
        customerId,
        locationId: locationId || undefined,
        period: resolved,
        range,
        startDate: range === "custom" ? startDate : undefined,
        endDate: range === "custom" ? endDate : undefined,
      }

      if (format === "excel") {
        const res = await fetch("/api/customer/impact-report-excel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
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
        body: JSON.stringify(payload),
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
          <Select value={format} onValueChange={(v) => setFormat(v as ReportFormat)}>
            <SelectTrigger className="h-10 rounded-xl border-[#E5E5E5] bg-white text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF Report — branded 4-page ESG PDF</SelectItem>
              <SelectItem value="excel">Excel (.xlsx) — customer + month-wise data</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-[#1F4A30]">Report period</p>
          <Select value={range} onValueChange={(v) => setRange(v as ReportRange)}>
            <SelectTrigger className="h-10 rounded-xl border-[#E5E5E5] bg-white text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ranges.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.label} — {r.hint}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {range === "custom" && (
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-[#E5E5E5] bg-[#F8FBF8] p-3">
              <div className="space-y-1.5">
                <Label className="text-[12px] text-[#5A5A5A]">Start date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] text-[#5A5A5A]">End date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          )}
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
