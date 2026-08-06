"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Download, Loader2, RefreshCw, Search } from "lucide-react"

type CollectionPoc = {
  name?: string
  email?: string
  number?: string
  designation?: string
}

type CustomerPocRow = {
  id: string
  companyName: string
  city: string
  state: string
  status: string
  loginEmail: string
  phone: string
  primaryPocName: string
  primaryPocEmail: string
  primaryPocNumber: string
  primaryPocDesignation: string
  collectionPocs: CollectionPoc[]
  serviceStartDate: string
}

function escapeCsv(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function downloadCsv(rows: CustomerPocRow[]) {
  const headers = [
    "Customer ID",
    "Company",
    "City",
    "State",
    "Status",
    "Login Email",
    "Primary POC Name",
    "Primary POC Email",
    "Primary POC Phone",
    "Primary POC Designation",
    "Collection POC Name",
    "Collection POC Email",
    "Collection POC Phone",
    "Collection POC Designation",
    "Service Start",
  ]
  const lines = [headers.join(",")]

  for (const c of rows) {
    const base = [
      c.id,
      c.companyName,
      c.city,
      c.state,
      c.status,
      c.loginEmail,
      c.primaryPocName,
      c.primaryPocEmail,
      c.primaryPocNumber,
      c.primaryPocDesignation,
      c.serviceStartDate,
    ]
    if (c.collectionPocs.length === 0) {
      lines.push([...base, "", "", "", ""].map(escapeCsv).join(","))
      continue
    }
    for (const p of c.collectionPocs) {
      lines.push(
        [
          ...base,
          p.name || "",
          p.email || "",
          p.number || "",
          p.designation || "",
        ]
          .map(escapeCsv)
          .join(","),
      )
    }
  }

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `customer-pocs-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminCustomerPocsPage() {
  const [rows, setRows] = useState<CustomerPocRow[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")

  const load = useCallback(async (query?: string) => {
    setLoading(true)
    try {
      const search = (query ?? q).trim()
      const qs = search ? `?q=${encodeURIComponent(search)}` : ""
      const res = await fetch(`/api/admin/customer-pocs${qs}`, { credentials: "include" })
      const data = await res.json()
      if (data?.success) setRows(data.customers || [])
    } finally {
      setLoading(false)
    }
  }, [q])

  useEffect(() => {
    void load("")
  }, [])

  const sheetRows = useMemo(() => {
    const out: {
      key: string
      customerId: string
      companyName: string
      city: string
      state: string
      pocType: string
      name: string
      email: string
      phone: string
      designation: string
    }[] = []

    for (const c of rows) {
      out.push({
        key: `${c.id}-primary`,
        customerId: c.id,
        companyName: c.companyName,
        city: c.city,
        state: c.state,
        pocType: "Primary",
        name: c.primaryPocName,
        email: c.primaryPocEmail,
        phone: c.primaryPocNumber,
        designation: c.primaryPocDesignation,
      })
      for (const [i, p] of c.collectionPocs.entries()) {
        out.push({
          key: `${c.id}-col-${i}`,
          customerId: c.id,
          companyName: c.companyName,
          city: c.city,
          state: c.state,
          pocType: "Collection",
          name: p.name || "",
          email: p.email || "",
          phone: p.number || "",
          designation: p.designation || "",
        })
      }
    }
    return out
  }, [rows])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="admin-page-title">Customer POCs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Spreadsheet view of primary and collection point-of-contact details.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => load()} disabled={loading} className="rounded-full">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={() => downloadCsv(rows)}
            disabled={!rows.length}
            className="rounded-full bg-[#1B7339] hover:bg-[#145a2c]"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card className="border-[#E5E5E5] bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">POC sheet</CardTitle>
          <CardDescription>{sheetRows.length} POC rows across {rows.length} customers</CardDescription>
          <div className="relative mt-3 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              placeholder="Search company, ID, POC email..."
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#1B7339]" />
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-auto border-t border-[#EEE]">
              <table className="w-full min-w-[1100px] text-left text-[12px]">
                <thead className="sticky top-0 z-10 bg-[#EAF6EC] text-[11px] font-semibold uppercase tracking-wide text-[#1F4A30]">
                  <tr>
                    <th className="px-3 py-2.5">Customer ID</th>
                    <th className="px-3 py-2.5">Company</th>
                    <th className="px-3 py-2.5">City</th>
                    <th className="px-3 py-2.5">State</th>
                    <th className="px-3 py-2.5">POC Type</th>
                    <th className="px-3 py-2.5">Name</th>
                    <th className="px-3 py-2.5">Email</th>
                    <th className="px-3 py-2.5">Phone</th>
                    <th className="px-3 py-2.5">Designation</th>
                  </tr>
                </thead>
                <tbody>
                  {sheetRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-3 py-10 text-center text-muted-foreground">
                        No customers found.
                      </td>
                    </tr>
                  ) : (
                    sheetRows.map((r) => (
                      <tr key={r.key} className="border-b border-[#F0F0F0] hover:bg-[#FAFAFA]">
                        <td className="px-3 py-2 font-mono text-[11px]">{r.customerId}</td>
                        <td className="px-3 py-2 font-medium">{r.companyName}</td>
                        <td className="px-3 py-2">{r.city || "—"}</td>
                        <td className="px-3 py-2">{r.state || "—"}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              r.pocType === "Primary"
                                ? "bg-[#E8F5E9] text-[#1B7339]"
                                : "bg-[#E3F2FD] text-[#1565C0]"
                            }`}
                          >
                            {r.pocType}
                          </span>
                        </td>
                        <td className="px-3 py-2">{r.name || "—"}</td>
                        <td className="px-3 py-2">{r.email || "—"}</td>
                        <td className="px-3 py-2">{r.phone || "—"}</td>
                        <td className="px-3 py-2">{r.designation || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
