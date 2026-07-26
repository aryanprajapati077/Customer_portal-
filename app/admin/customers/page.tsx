"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Loader2, Plus, Search, Users, Download, Table2 } from "lucide-react"
import {
  CreateCustomerForm,
  EMPTY_CREATE_CUSTOMER_FORM,
  useNextCustomerId,
  type CreateCustomerFormState,
} from "@/components/admin/create-customer-form"
import ExcelJS from "exceljs"

type CustomerRow = {
  id: string
  email: string
  companyName: string
  tradeName?: string | null
  city?: string | null
  state?: string | null
  gstin?: string | null
  logoUrl?: string | null
  lsuName?: string | null
  lsuTechnicianName?: string | null
  operationsIncharge?: string | null
  contactPerson: string | null
  phone: string | null
  address: string | null
  status: string
  serviceStatus?: string | null
  contractEndDate?: string | null
  primaryPocName?: string | null
  primaryPocEmail?: string | null
  primaryPocNumber?: string | null
  primaryPocDesignation?: string | null
  collectionPocs?: string | null
  collectionFrequency?: string | null
  noOfKiosk?: number
  noOfBasicKiosk?: number
  noOfAdvanceKiosk?: number
  noOfPanVendorKiosk?: number
  noOfWallMountKiosk?: number
  serviceStartDate?: string | null
  totalWasteCollected: number
  disposalUnitInstalled: number
  monthlyTarget?: number
  kraftrebornCredits?: number
  updatedAt: string
}

const SHEET_COLUMNS: { key: keyof CustomerRow | "collectionPocSummary"; label: string; width: number }[] = [
  { key: "id", label: "Customer ID", width: 110 },
  { key: "companyName", label: "Brand Name", width: 160 },
  { key: "tradeName", label: "Trade Name", width: 150 },
  { key: "gstin", label: "GSTIN", width: 140 },
  { key: "state", label: "State", width: 120 },
  { key: "city", label: "City", width: 110 },
  { key: "lsuName", label: "LSU Name", width: 140 },
  { key: "lsuTechnicianName", label: "LSU Technician", width: 140 },
  { key: "operationsIncharge", label: "Ops Incharge", width: 130 },
  { key: "primaryPocName", label: "Primary POC", width: 130 },
  { key: "primaryPocEmail", label: "POC Email", width: 180 },
  { key: "primaryPocNumber", label: "POC Phone", width: 120 },
  { key: "collectionFrequency", label: "Frequency", width: 120 },
  { key: "noOfKiosk", label: "Kiosks", width: 80 },
  { key: "serviceStartDate", label: "Service Start", width: 110 },
  { key: "status", label: "Status", width: 90 },
  { key: "email", label: "Login Email", width: 180 },
]

function cellValue(row: CustomerRow, key: (typeof SHEET_COLUMNS)[number]["key"]): string {
  if (key === "collectionPocSummary") {
    try {
      const pocs = JSON.parse(row.collectionPocs || "[]") as { name?: string }[]
      return pocs.map((p) => p.name).filter(Boolean).join(", ")
    } catch {
      return ""
    }
  }
  const v = row[key as keyof CustomerRow]
  if (v == null || v === "") return ""
  if (key === "serviceStartDate" && typeof v === "string") {
    return new Date(v).toLocaleDateString("en-IN")
  }
  return String(v)
}

export default function AdminCustomersPage() {
  const [rows, setRows] = useState<CustomerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CreateCustomerFormState>(EMPTY_CREATE_CUSTOMER_FORM)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [selected, setSelected] = useState<CustomerRow | null>(null)
  const [exporting, setExporting] = useState(false)
  const [isPending, startTransition] = useTransition()
  const nextCustomerId = useNextCustomerId(createOpen)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/customers")
      const data = await res.json()
      if (data?.success) setRows(data.customers || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return rows
    return rows.filter((r) =>
      [
        r.id,
        r.email,
        r.companyName,
        r.tradeName,
        r.city,
        r.state,
        r.gstin,
        r.lsuName,
        r.primaryPocName,
        r.primaryPocEmail,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s)),
    )
  }, [rows, q])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    if (!createForm.state || !createForm.city) {
      setCreateError("State and City are required")
      return
    }
    if (!createForm.collectionFrequency) {
      setCreateError("Collection Frequency is required")
      return
    }
    if (createForm.noOfKiosk === "") {
      setCreateError("No. Of Kiosk is required")
      return
    }
    if (createForm.kraftrebornCredits === "" || Number(createForm.kraftrebornCredits) < 0) {
      setCreateError("KR Amount is required (₹) so the customer can redeem in the shop")
      return
    }

    setCreateLoading(true)
    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: createForm.brandName.trim(),
          tradeName: createForm.tradeName.trim(),
          state: createForm.state,
          city: createForm.city,
          lsuName: createForm.lsuName.trim(),
          lsuTechnicianName: createForm.lsuTechnicianName.trim(),
          operationsIncharge: createForm.operationsIncharge.trim(),
          primaryPocName: createForm.primaryPocName.trim(),
          primaryPocEmail: createForm.primaryPocEmail.trim(),
          primaryPocNumber: createForm.primaryPocNumber.trim(),
          primaryPocDesignation: createForm.primaryPocDesignation.trim() || undefined,
          collectionPocs: createForm.collectionPocs,
          serviceStartDate: createForm.serviceStartDate,
          noOfKiosk: Number(createForm.noOfKiosk),
          noOfBasicKiosk: Number(createForm.noOfBasicKiosk) || 0,
          noOfAdvanceKiosk: Number(createForm.noOfAdvanceKiosk) || 0,
          noOfPanVendorKiosk: Number(createForm.noOfPanVendorKiosk) || 0,
          noOfWallMountKiosk: Number(createForm.noOfWallMountKiosk) || 0,
          collectionFrequency: createForm.collectionFrequency,
          kraftrebornCredits: Number(createForm.kraftrebornCredits),
          gstin: createForm.gstin.trim() || undefined,
          logoBase64: createForm.logoBase64 || undefined,
        }),
      })
      const data = await res.json()
      if (data?.success && data.customer) {
        await load()
        setCreateForm(EMPTY_CREATE_CUSTOMER_FORM)
        setCreateOpen(false)
        if (data.welcomeEmailSent) {
          alert(`Customer ${data.customer.id} created.\nWelcome email sent to ${data.customer.email}.`)
        } else {
          const reason = data.welcomeEmailError ? `\nReason: ${data.welcomeEmailError}` : ""
          const tempPw = data.temporaryPassword
            ? `\n\nUsername: ${data.customer.email}\nPassword: ${data.temporaryPassword}`
            : ""
          alert(`Customer ${data.customer.id} created, but welcome email was not sent.${reason}${tempPw}`)
        }
      } else {
        setCreateError(data?.error || "Failed to create customer")
      }
    } catch {
      setCreateError("Network error")
    } finally {
      setCreateLoading(false)
    }
  }

  const exportExcel = async () => {
    setExporting(true)
    try {
      const wb = new ExcelJS.Workbook()
      const sheet = wb.addWorksheet("Customers")
      const headers = [
        ...SHEET_COLUMNS.map((c) => c.label),
        "Collection POCs",
        "Basic Kiosk",
        "Advance Kiosk",
        "Pan Vendor Kiosk",
        "Wall Mount Kiosk",
        "Ops Incharge",
        "Logo URL",
      ]
      sheet.addRow(headers)
      sheet.getRow(1).font = { bold: true }
      sheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFC6EFCE" },
      }

      for (const r of filtered) {
        let pocSummary = ""
        try {
          const pocs = JSON.parse(r.collectionPocs || "[]") as { name?: string; email?: string }[]
          pocSummary = pocs.map((p) => `${p.name || ""} <${p.email || ""}>`).join("; ")
        } catch {
          pocSummary = ""
        }
        sheet.addRow([
          ...SHEET_COLUMNS.map((c) => cellValue(r, c.key)),
          pocSummary,
          r.noOfBasicKiosk ?? 0,
          r.noOfAdvanceKiosk ?? 0,
          r.noOfPanVendorKiosk ?? 0,
          r.noOfWallMountKiosk ?? 0,
          r.operationsIncharge || "",
          r.logoUrl || "",
        ])
      }

      SHEET_COLUMNS.forEach((c, i) => {
        sheet.getColumn(i + 1).width = Math.max(12, Math.round(c.width / 8))
      })

      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `BuffIndia-Customers-${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#DCE8DC] bg-[#E8F5E9] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1B7339]">
            <Table2 className="h-3.5 w-3.5" />
            Spreadsheet view
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-[clamp(1.8rem,3vw,2.4rem)] leading-tight tracking-tight">
            Customers
          </h1>
          <p className="mt-1 text-[14px] text-[#6B6B6B]">
            Excel-style grid — click a row for the full sheet. Export anytime.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={exportExcel}
            disabled={exporting || filtered.length === 0}
          >
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export as Excel
          </Button>
          <Dialog
            open={createOpen}
            onOpenChange={(open) => {
              setCreateOpen(open)
              if (!open) {
                setCreateForm(EMPTY_CREATE_CUSTOMER_FORM)
                setCreateError(null)
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-full bg-[#1B7339] hover:bg-[#145a2c]">
                <Plus className="h-4 w-4" />
                Create Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[720px]">
              <DialogHeader>
                <DialogTitle>Create New Customer</DialogTitle>
                <DialogDescription>
                  Required fields marked *. Customer ID auto-assigned.
                </DialogDescription>
              </DialogHeader>
              <CreateCustomerForm
                form={createForm}
                setForm={setCreateForm}
                nextId={nextCustomerId}
                error={createError}
                loading={createLoading}
                onSubmit={handleCreateUser}
                onCancel={() => setCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A8A]" />
        <Input
          value={q}
          onChange={(e) => startTransition(() => setQ(e.target.value))}
          placeholder="Filter sheet by ID, brand, GSTIN, city..."
          className="pl-9"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-[#C8E6D4] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between border-b border-[#DCE8DC] bg-[#E8F5E9] px-3 py-2">
          <p className="text-[12px] font-semibold text-[#1B7339]">
            <Users className="mr-1.5 inline h-3.5 w-3.5" />
            {filtered.length} row{filtered.length === 1 ? "" : "s"}
            {isPending ? " · filtering…" : ""}
          </p>
          <p className="text-[11px] text-[#6B6B6B]">Click any row to open full sheet</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-[#1B7339]" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-[#6B6B6B]">No customers found.</p>
        ) : (
          <div className="max-h-[min(70vh,720px)] overflow-auto">
            <table className="w-max min-w-full border-collapse text-left text-[12px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#C8E6D4]">
                  {SHEET_COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className="whitespace-nowrap border-b border-r border-[#A5D6A7] px-2.5 py-2 font-semibold text-[#1B4332]"
                      style={{ minWidth: col.width }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, idx) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className={`cursor-pointer border-b border-[#EAEAEA] transition-colors hover:bg-[#F1F8E9] ${
                      idx % 2 === 0 ? "bg-white" : "bg-[#FAFCFA]"
                    }`}
                  >
                    {SHEET_COLUMNS.map((col) => (
                      <td
                        key={col.key}
                        className="max-w-[220px] truncate border-r border-[#F0F0F0] px-2.5 py-1.5 text-[#141414]"
                        title={cellValue(r, col.key)}
                      >
                        {col.key === "id" ? (
                          <span className="font-semibold text-[#1B7339]">{cellValue(r, col.key)}</span>
                        ) : col.key === "status" ? (
                          <Badge
                            variant="outline"
                            className={
                              String(r.status).toLowerCase() === "active"
                                ? "border-[#C8E6D4] bg-[#E8F5E9] text-[#1B7339]"
                                : ""
                            }
                          >
                            {cellValue(r, col.key)}
                          </Badge>
                        ) : (
                          cellValue(r, col.key) || "—"
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-[family-name:var(--font-display)] text-2xl">
                  {selected.id} · {selected.companyName}
                </SheetTitle>
                <SheetDescription>Full customer sheet (Excel-style fields)</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-3 pb-8">
                {selected.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selected.logoUrl}
                    alt="Customer logo"
                    className="h-16 w-auto max-w-[200px] rounded-lg border border-[#E5E5E5] bg-white object-contain p-2"
                  />
                )}
                <table className="w-full border-collapse text-[13px]">
                  <tbody>
                    {[
                      ["Customer ID", selected.id],
                      ["Brand Name", selected.companyName],
                      ["Trade Name", selected.tradeName],
                      ["GSTIN", selected.gstin],
                      ["State", selected.state],
                      ["City", selected.city],
                      ["LSU Name", selected.lsuName],
                      ["LSU Technician", selected.lsuTechnicianName],
                      ["Operations Incharge", selected.operationsIncharge],
                      ["Primary POC", selected.primaryPocName],
                      ["POC Email", selected.primaryPocEmail],
                      ["POC Number", selected.primaryPocNumber],
                      ["POC Designation", selected.primaryPocDesignation],
                      ["Collection Frequency", selected.collectionFrequency],
                      ["Service Start", selected.serviceStartDate ? new Date(selected.serviceStartDate).toLocaleDateString("en-IN") : ""],
                      ["No. of Kiosk", selected.noOfKiosk],
                      ["Basic / Advance / Pan / Wall", `${selected.noOfBasicKiosk ?? 0} / ${selected.noOfAdvanceKiosk ?? 0} / ${selected.noOfPanVendorKiosk ?? 0} / ${selected.noOfWallMountKiosk ?? 0}`],
                      ["Login Email", selected.email],
                      ["Status", selected.status],
                      ["Service Status", selected.serviceStatus || "ACTIVE"],
                      [
                        "Contract End",
                        selected.contractEndDate
                          ? new Date(selected.contractEndDate).toLocaleDateString("en-IN")
                          : "",
                      ],
                      ["KR Credits", selected.kraftrebornCredits],
                      ["Total Waste (kg)", selected.totalWasteCollected],
                    ].map(([label, value]) => (
                      <tr key={String(label)} className="border-b border-[#EAEAEA]">
                        <td className="w-[42%] bg-[#F7FBF7] px-3 py-2 font-semibold text-[#1B7339]">
                          {label}
                        </td>
                        <td className="px-3 py-2 text-[#141414]">{value == null || value === "" ? "—" : String(value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="rounded-xl border border-[#E2EBE4] p-3 space-y-2">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-[#1B7339]">
                    Update service lifecycle
                  </p>
                  <select
                    className="w-full h-10 rounded-lg border border-[#D8D8D8] bg-white px-3 text-[13px]"
                    value={selected.serviceStatus || "ACTIVE"}
                    onChange={async (e) => {
                      const serviceStatus = e.target.value
                      const res = await fetch("/api/admin/customers", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: selected.id, serviceStatus }),
                      })
                      const data = await res.json()
                      if (data?.success) {
                        setSelected((s) => (s ? { ...s, serviceStatus } : s))
                      }
                    }}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="RENEWAL_DUE">Renewal Due Soon</option>
                    <option value="PAUSED_RENEWAL">Paused – Renewal Pending</option>
                    <option value="PAUSED_PAYMENT">Paused – Payment Pending</option>
                    <option value="INACTIVE">Inactive / Service Ended</option>
                  </select>
                  <Input
                    type="date"
                    defaultValue={
                      selected.contractEndDate
                        ? new Date(selected.contractEndDate).toISOString().slice(0, 10)
                        : ""
                    }
                    onBlur={async (e) => {
                      const contractEndDate = e.target.value || null
                      await fetch("/api/admin/customers", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: selected.id, contractEndDate }),
                      })
                      setSelected((s) => (s ? { ...s, contractEndDate } : s))
                    }}
                  />
                  <p className="text-[11px] text-[#7A7A7A]">Contract / renewal end date</p>
                </div>
                <div className="rounded-xl border border-[#E2EBE4] p-3 space-y-2">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-[#1B7339]">
                    KR Amount (₹) — redeemable balance
                  </p>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    key={`kr-${selected.id}-${selected.kraftrebornCredits ?? 0}`}
                    defaultValue={
                      selected.kraftrebornCredits != null ? String(Math.floor(selected.kraftrebornCredits)) : ""
                    }
                    placeholder="Required for shop redemption"
                    onBlur={async (e) => {
                      const raw = e.target.value.trim()
                      if (raw === "") return
                      const kraftrebornCredits = Math.max(0, Math.floor(Number(raw)))
                      if (!Number.isFinite(kraftrebornCredits)) return
                      const res = await fetch("/api/admin/customers", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: selected.id, kraftrebornCredits }),
                      })
                      const data = await res.json()
                      if (data?.success) {
                        setSelected((s) => (s ? { ...s, kraftrebornCredits } : s))
                        await load()
                      }
                    }}
                  />
                  <p className="text-[11px] text-[#7A7A7A]">
                    Save on blur. Customer can redeem this balance in the KraftReborn shop.
                  </p>
                </div>
                {selected.collectionPocs && (
                  <div className="rounded-xl border border-[#E2EBE4] p-3">
                    <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#1B7339]">
                      Collection POCs
                    </p>
                    <pre className="whitespace-pre-wrap text-[12px] text-[#555]">
                      {(() => {
                        try {
                          return JSON.stringify(JSON.parse(selected.collectionPocs), null, 2)
                        } catch {
                          return selected.collectionPocs
                        }
                      })()}
                    </pre>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
