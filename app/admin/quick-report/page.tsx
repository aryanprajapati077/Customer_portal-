"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AdminPageHeader } from "@/components/admin/admin-list-card"
import { Download, FileSpreadsheet, FileText, Loader2, Search, Zap } from "lucide-react"

type CustomerOption = {
  id: string
  companyName: string
  email?: string
  status?: string
}

function defaultPeriod() {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export default function AdminQuickReportPage() {
  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [customerId, setCustomerId] = useState("")
  const [period, setPeriod] = useState(defaultPeriod)
  const [downloading, setDownloading] = useState<"pdf" | "excel" | null>(null)
  const [error, setError] = useState("")
  const [clientSearch, setClientSearch] = useState("")

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoadingCustomers(true)
      try {
        const res = await fetch("/api/admin/customers?fields=options&take=1000")
        const data = await res.json()
        if (cancelled) return
        setCustomers(data.customers || [])
      } catch {
        if (!cancelled) setCustomers([])
      } finally {
        if (!cancelled) setLoadingCustomers(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const s = clientSearch.trim().toLowerCase()
    if (!s) return customers
    return customers.filter(
      (c) =>
        c.id.toLowerCase().includes(s) ||
        c.companyName.toLowerCase().includes(s) ||
        (c.email || "").toLowerCase().includes(s),
    )
  }, [customers, clientSearch])

  const selected = customers.find((c) => c.id === customerId)

  const download = async (format: "pdf" | "excel") => {
    if (!customerId || !/^\d{4}-\d{2}$/.test(period)) {
      setError("Select a client and a valid month.")
      return
    }
    setDownloading(format)
    setError("")
    try {
      const url = `/api/admin/reports/download?customerId=${encodeURIComponent(customerId)}&period=${encodeURIComponent(period)}&format=${format}`
      const res = await fetch(url)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Download failed")
      }
      const blob = await res.blob()
      const cd = res.headers.get("Content-Disposition") || ""
      const match = cd.match(/filename="?([^"]+)"?/i)
      const filename =
        match?.[1] ||
        `${customerId}-${period}-impact-report.${format === "excel" ? "xlsx" : "pdf"}`
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(a.href)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed")
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <AdminPageHeader
        title="Quick Report"
        description="Pick a client and month, then download PDF or Excel."
        icon={<Zap className="h-5 w-5 text-[#1B7339]" />}
      />

      <div className="space-y-5 rounded-2xl border border-[#E5E5E5] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="space-y-1.5">
          <Label>Client *</Label>
          <Select
            value={customerId || undefined}
            onValueChange={(v) => {
              setCustomerId(v)
              setClientSearch("")
            }}
            disabled={loadingCustomers}
          >
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue
                placeholder={loadingCustomers ? "Loading clients…" : "Select client"}
              />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              <div className="sticky top-0 z-10 border-b border-[#EAEAEA] bg-white p-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8A8A8A]" />
                  <Input
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Search by ID or name…"
                    className="h-9 rounded-lg pl-8"
                    onKeyDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              {filtered.length === 0 ? (
                <p className="px-3 py-4 text-center text-[13px] text-[#6B6B6B]">No clients match</p>
              ) : (
                filtered.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.id} — {c.companyName}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {selected ? (
            <p className="text-[12px] text-[#6B6B6B]">
              {selected.companyName}
              {selected.email ? ` · ${selected.email}` : ""}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="period">Month *</Label>
          <Input
            id="period"
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="h-11 rounded-xl"
          />
        </div>

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            onClick={() => download("pdf")}
            disabled={!!downloading || !customerId || !period}
            className="h-11 rounded-full bg-[#1B7339] hover:bg-[#145a2c]"
          >
            {downloading === "pdf" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            {downloading === "pdf" ? "Preparing…" : "Download PDF"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => download("excel")}
            disabled={!!downloading || !customerId || !period}
            className="h-11 rounded-full border-[#DCE8DC] text-[#1B7339] hover:bg-[#E8F5E9]"
          >
            {downloading === "excel" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-2 h-4 w-4" />
            )}
            {downloading === "excel" ? "Preparing…" : "Download Excel"}
          </Button>
        </div>

        <p className="text-center text-[11px] text-[#8A8A8A]">
          <Download className="mr-1 inline h-3 w-3" />
          Both formats download the monthly impact report for the selected client.
        </p>
      </div>
    </div>
  )
}
