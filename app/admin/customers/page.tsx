"use client"

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus, Search, Users, Download, Table2, Mail, Trash2, Building2, UserCheck, MailWarning } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/admin-list-card"
import {
  CreateCustomerForm,
  EMPTY_CREATE_CUSTOMER_FORM,
  useNextCustomerId,
  type CollectionPocForm,
  type CreateCustomerFormState,
} from "@/components/admin/create-customer-form"
import { Label } from "@/components/ui/label"
import { COLLECTION_FREQUENCY_OPTIONS } from "@/lib/india-locations"
import ExcelJS from "exceljs"

function parseCollectionPocs(raw?: string | null): CollectionPocForm[] {
  if (!raw?.trim()) return [{ name: "", email: "", number: "", designation: "" }]
  try {
    const parsed = JSON.parse(raw) as CollectionPocForm[]
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [{ name: "", email: "", number: "", designation: "" }]
    }
    return parsed.map((p) => ({
      name: String(p?.name || ""),
      email: String(p?.email || ""),
      number: String(p?.number || ""),
      designation: String(p?.designation || ""),
    }))
  } catch {
    return [{ name: "", email: "", number: "", designation: "" }]
  }
}

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
  welcomeEmailSentAt?: string | null
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

function toDateInput(raw?: string | null) {
  if (!raw) return ""
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString().slice(0, 10)
}

function EditableCustomerSheet({
  customer,
  onSaved,
}: {
  customer: CustomerRow
  onSaved: (next: CustomerRow) => void
}) {
  const [draft, setDraft] = useState({
    companyName: customer.companyName || "",
    tradeName: customer.tradeName || "",
    gstin: customer.gstin || "",
    state: customer.state || "",
    city: customer.city || "",
    lsuName: customer.lsuName || "",
    lsuTechnicianName: customer.lsuTechnicianName || "",
    operationsIncharge: customer.operationsIncharge || "",
    primaryPocName: customer.primaryPocName || "",
    primaryPocEmail: customer.primaryPocEmail || "",
    primaryPocNumber: customer.primaryPocNumber || "",
    primaryPocDesignation: customer.primaryPocDesignation || "",
    collectionFrequency: customer.collectionFrequency || "Monthly",
    serviceStartDate: toDateInput(customer.serviceStartDate),
    noOfKiosk: String(customer.noOfKiosk ?? 0),
    noOfBasicKiosk: String(customer.noOfBasicKiosk ?? 0),
    noOfAdvanceKiosk: String(customer.noOfAdvanceKiosk ?? 0),
    noOfPanVendorKiosk: String(customer.noOfPanVendorKiosk ?? 0),
    noOfWallMountKiosk: String(customer.noOfWallMountKiosk ?? 0),
    email: customer.email || "",
    status: customer.status || "Active",
    serviceStatus: customer.serviceStatus || "ACTIVE",
    contractEndDate: toDateInput(customer.contractEndDate),
    kraftrebornCredits: String(
      customer.kraftrebornCredits != null ? Math.floor(customer.kraftrebornCredits) : 0,
    ),
  })
  const [collectionPocs, setCollectionPocs] = useState<CollectionPocForm[]>(() =>
    parseCollectionPocs(customer.collectionPocs),
  )
  const [sheetTab, setSheetTab] = useState<"details" | "pocs">("details")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  useEffect(() => {
    setDraft({
      companyName: customer.companyName || "",
      tradeName: customer.tradeName || "",
      gstin: customer.gstin || "",
      state: customer.state || "",
      city: customer.city || "",
      lsuName: customer.lsuName || "",
      lsuTechnicianName: customer.lsuTechnicianName || "",
      operationsIncharge: customer.operationsIncharge || "",
      primaryPocName: customer.primaryPocName || "",
      primaryPocEmail: customer.primaryPocEmail || "",
      primaryPocNumber: customer.primaryPocNumber || "",
      primaryPocDesignation: customer.primaryPocDesignation || "",
      collectionFrequency: customer.collectionFrequency || "Monthly",
      serviceStartDate: toDateInput(customer.serviceStartDate),
      noOfKiosk: String(customer.noOfKiosk ?? 0),
      noOfBasicKiosk: String(customer.noOfBasicKiosk ?? 0),
      noOfAdvanceKiosk: String(customer.noOfAdvanceKiosk ?? 0),
      noOfPanVendorKiosk: String(customer.noOfPanVendorKiosk ?? 0),
      noOfWallMountKiosk: String(customer.noOfWallMountKiosk ?? 0),
      email: customer.email || "",
      status: customer.status || "Active",
      serviceStatus: customer.serviceStatus || "ACTIVE",
      contractEndDate: toDateInput(customer.contractEndDate),
      kraftrebornCredits: String(
        customer.kraftrebornCredits != null ? Math.floor(customer.kraftrebornCredits) : 0,
      ),
    })
    setCollectionPocs(parseCollectionPocs(customer.collectionPocs))
    setError(null)
    setOk(false)
  }, [customer.id])

  const set = (key: keyof typeof draft, value: string) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const updatePoc = (index: number, patch: Partial<CollectionPocForm>) => {
    setCollectionPocs((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)))
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    setOk(false)
    try {
      const cleanedPocs = collectionPocs
        .map((p) => ({
          name: p.name.trim(),
          email: p.email.trim().toLowerCase(),
          number: p.number.trim(),
          designation: p.designation.trim(),
        }))
        .filter((p) => p.name || p.email || p.number)

      const payload = {
        id: customer.id,
        companyName: draft.companyName.trim(),
        tradeName: draft.tradeName.trim(),
        gstin: draft.gstin.trim(),
        state: draft.state.trim(),
        city: draft.city.trim(),
        lsuName: draft.lsuName.trim(),
        lsuTechnicianName: draft.lsuTechnicianName.trim(),
        operationsIncharge: draft.operationsIncharge.trim(),
        primaryPocName: draft.primaryPocName.trim(),
        primaryPocEmail: draft.primaryPocEmail.trim().toLowerCase(),
        primaryPocNumber: draft.primaryPocNumber.trim(),
        primaryPocDesignation: draft.primaryPocDesignation.trim(),
        collectionFrequency: draft.collectionFrequency,
        collectionPocs: cleanedPocs,
        serviceStartDate: draft.serviceStartDate || null,
        noOfKiosk: Number(draft.noOfKiosk) || 0,
        noOfBasicKiosk: Number(draft.noOfBasicKiosk) || 0,
        noOfAdvanceKiosk: Number(draft.noOfAdvanceKiosk) || 0,
        noOfPanVendorKiosk: Number(draft.noOfPanVendorKiosk) || 0,
        noOfWallMountKiosk: Number(draft.noOfWallMountKiosk) || 0,
        email: draft.email.trim().toLowerCase(),
        status: draft.status,
        serviceStatus: draft.serviceStatus,
        contractEndDate: draft.contractEndDate || null,
        kraftrebornCredits: Math.max(0, Math.floor(Number(draft.kraftrebornCredits) || 0)),
      }
      const res = await fetch("/api/admin/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!data?.success) {
        setError(String(data?.error || "Save failed"))
        return
      }
      onSaved({
        ...customer,
        ...payload,
        collectionPocs: cleanedPocs.length ? JSON.stringify(cleanedPocs) : null,
        kraftrebornCredits: payload.kraftrebornCredits,
        serviceStartDate: payload.serviceStartDate,
        contractEndDate: payload.contractEndDate,
      })
      setOk(true)
    } catch {
      setError("Network error")
    } finally {
      setSaving(false)
    }
  }

  const row = (label: string, control: ReactNode) => (
    <tr className="border-b border-[#EAEAEA]">
      <td className="w-[38%] bg-[#F7FBF7] px-3 py-2 align-middle text-[12px] font-semibold text-[#1B7339]">
        {label}
      </td>
      <td className="px-2 py-1.5">{control}</td>
    </tr>
  )

  const inputClass =
    "h-9 w-full rounded-md border border-[#D8D8D8] bg-white px-2.5 text-[13px] text-[#141414] outline-none focus:border-[#1B7339]"

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-full border border-[#ebe9e4] bg-[#fafaf8] p-1">
        <button
          type="button"
          onClick={() => setSheetTab("details")}
          className={`flex-1 rounded-full px-3 py-2 text-[12px] font-semibold transition ${
            sheetTab === "details" ? "bg-white text-[#1b7339] shadow-sm ring-1 ring-[#ebe9e4]" : "text-[#6b6b6b] hover:text-[#141414]"
          }`}
        >
          Details
        </button>
        <button
          type="button"
          onClick={() => setSheetTab("pocs")}
          className={`flex-1 rounded-full px-3 py-2 text-[12px] font-semibold transition ${
            sheetTab === "pocs" ? "bg-white text-[#1b7339] shadow-sm ring-1 ring-[#ebe9e4]" : "text-[#6b6b6b] hover:text-[#141414]"
          }`}
        >
          Update POCs
        </button>
      </div>

      {sheetTab === "details" ? (
      <div className="overflow-hidden rounded-xl border border-[#ebe9e4]">
      <table className="w-full border-collapse text-[13px]">
        <tbody>
          {row("Customer ID", <span className="px-1 font-semibold text-[#1B7339]">{customer.id}</span>)}
          {row(
            "Brand Name",
            <Input className={inputClass} value={draft.companyName} onChange={(e) => set("companyName", e.target.value)} />,
          )}
          {row(
            "Trade Name",
            <Input className={inputClass} value={draft.tradeName} onChange={(e) => set("tradeName", e.target.value)} />,
          )}
          {row(
            "GSTIN",
            <Input className={inputClass} value={draft.gstin} onChange={(e) => set("gstin", e.target.value)} />,
          )}
          {row(
            "State",
            <Input className={inputClass} value={draft.state} onChange={(e) => set("state", e.target.value)} />,
          )}
          {row(
            "City",
            <Input className={inputClass} value={draft.city} onChange={(e) => set("city", e.target.value)} />,
          )}
          {row(
            "LSU Name",
            <Input className={inputClass} value={draft.lsuName} onChange={(e) => set("lsuName", e.target.value)} />,
          )}
          {row(
            "LSU Technician",
            <Input
              className={inputClass}
              value={draft.lsuTechnicianName}
              onChange={(e) => set("lsuTechnicianName", e.target.value)}
            />,
          )}
          {row(
            "Operations Incharge",
            <Input
              className={inputClass}
              value={draft.operationsIncharge}
              onChange={(e) => set("operationsIncharge", e.target.value)}
            />,
          )}
          {row(
            "Collection Frequency",
            <Select value={draft.collectionFrequency} onValueChange={(v) => set("collectionFrequency", v)}>
              <SelectTrigger className="h-9 rounded-md border-[#D8D8D8] bg-white text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLLECTION_FREQUENCY_OPTIONS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>,
          )}
          {row(
            "Service Start",
            <Input
              type="date"
              className={inputClass}
              value={draft.serviceStartDate}
              onChange={(e) => set("serviceStartDate", e.target.value)}
            />,
          )}
          {row(
            "No. of Kiosk",
            <Input
              type="number"
              min={0}
              className={inputClass}
              value={draft.noOfKiosk}
              onChange={(e) => set("noOfKiosk", e.target.value)}
            />,
          )}
          {row(
            "Basic Kiosks",
            <Input
              type="number"
              min={0}
              className={inputClass}
              value={draft.noOfBasicKiosk}
              onChange={(e) => set("noOfBasicKiosk", e.target.value)}
            />,
          )}
          {row(
            "Advance Kiosks",
            <Input
              type="number"
              min={0}
              className={inputClass}
              value={draft.noOfAdvanceKiosk}
              onChange={(e) => set("noOfAdvanceKiosk", e.target.value)}
            />,
          )}
          {row(
            "Pan Vendor Kiosks",
            <Input
              type="number"
              min={0}
              className={inputClass}
              value={draft.noOfPanVendorKiosk}
              onChange={(e) => set("noOfPanVendorKiosk", e.target.value)}
            />,
          )}
          {row(
            "Wall Mount Kiosks",
            <Input
              type="number"
              min={0}
              className={inputClass}
              value={draft.noOfWallMountKiosk}
              onChange={(e) => set("noOfWallMountKiosk", e.target.value)}
            />,
          )}
          {row(
            "Login Email",
            <Input className={inputClass} value={draft.email} onChange={(e) => set("email", e.target.value)} />,
          )}
          {row(
            "Client Status",
            <Select value={draft.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger className="h-9 rounded-md border-[#D8D8D8] bg-white text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>,
          )}
          {row(
            "Service Status",
            <Select value={draft.serviceStatus} onValueChange={(v) => set("serviceStatus", v)}>
              <SelectTrigger className="h-9 rounded-md border-[#D8D8D8] bg-white text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="RENEWAL_DUE">Renewal Due Soon</SelectItem>
                <SelectItem value="PAUSED_RENEWAL">Paused – Renewal Pending</SelectItem>
                <SelectItem value="PAUSED_PAYMENT">Paused – Payment Pending</SelectItem>
                <SelectItem value="INACTIVE">Inactive / Service Ended</SelectItem>
              </SelectContent>
            </Select>,
          )}
          {row(
            "Contract End",
            <Input
              type="date"
              className={inputClass}
              value={draft.contractEndDate}
              onChange={(e) => set("contractEndDate", e.target.value)}
            />,
          )}
          {row(
            "KR Credits",
            <Input
              type="number"
              min={0}
              className={inputClass}
              value={draft.kraftrebornCredits}
              onChange={(e) => set("kraftrebornCredits", e.target.value)}
            />,
          )}
          {row(
            "Total Waste (kg)",
            <span className="px-1 text-[#555]">{Number(customer.totalWasteCollected || 0).toFixed(2)}</span>,
          )}
        </tbody>
      </table>
      </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-[#E2EBE4] bg-[#F7FBF7] p-3">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-[#1B7339]">
              Primary POC (portal login)
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-[#6B6B6B]">Name</Label>
                <Input className={inputClass} value={draft.primaryPocName} onChange={(e) => set("primaryPocName", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-[#6B6B6B]">Email</Label>
                <Input className={inputClass} type="email" value={draft.primaryPocEmail} onChange={(e) => set("primaryPocEmail", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-[#6B6B6B]">Phone</Label>
                <Input className={inputClass} value={draft.primaryPocNumber} onChange={(e) => set("primaryPocNumber", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-[#6B6B6B]">Designation</Label>
                <Input className={inputClass} value={draft.primaryPocDesignation} onChange={(e) => set("primaryPocDesignation", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-[#1B7339]">
                Collection POCs
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() =>
                  setCollectionPocs((p) => [...p, { name: "", email: "", number: "", designation: "" }])
                }
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add POC
              </Button>
            </div>
            {collectionPocs.map((poc, index) => (
              <div key={index} className="space-y-3 rounded-xl border border-[#EAEAEA] bg-white p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-semibold text-[#141414]">Collection POC {index + 1}</p>
                  {collectionPocs.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-red-600"
                      onClick={() => setCollectionPocs((prev) => prev.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#6B6B6B]">Name</Label>
                    <Input className={inputClass} value={poc.name} onChange={(e) => updatePoc(index, { name: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#6B6B6B]">Email</Label>
                    <Input className={inputClass} type="email" value={poc.email} onChange={(e) => updatePoc(index, { email: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#6B6B6B]">Number</Label>
                    <Input className={inputClass} value={poc.number} onChange={(e) => updatePoc(index, { number: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#6B6B6B]">Designation</Label>
                    <Input className={inputClass} value={poc.designation} onChange={(e) => updatePoc(index, { designation: e.target.value })} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {ok && <p className="text-sm text-[#1B7339]">Saved.</p>}
      <Button onClick={save} disabled={saving} className="w-full rounded-full bg-[#1B7339] hover:bg-[#145a2c]">
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {saving ? "Saving…" : sheetTab === "pocs" ? "Save POC updates" : "Save changes"}
      </Button>
    </div>
  )

}

export default function AdminCustomersPage() {
  const [rows, setRows] = useState<CustomerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const PAGE_TAKE = 50
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CreateCustomerFormState>(EMPTY_CREATE_CUSTOMER_FORM)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [selected, setSelected] = useState<CustomerRow | null>(null)
  const [exporting, setExporting] = useState(false)
  const [welcomeSending, setWelcomeSending] = useState(false)
  const [welcomePending, setWelcomePending] = useState<number | null>(null)
  const [welcomeOneSending, setWelcomeOneSending] = useState(false)
  const [isPending, startTransition] = useTransition()
  const nextCustomerId = useNextCustomerId(createOpen)

  const refreshWelcomeStats = () => {
    fetch("/api/admin/customers/welcome-emails")
      .then((r) => r.json())
      .then((d) => {
        if (d?.success) setWelcomePending(d.pending ?? 0)
      })
      .catch(() => {})
  }

  const fetchCustomers = async ({ reset }: { reset: boolean }) => {
    const currentOffset = reset ? 0 : offset
    if (reset) setLoading(true)
    else setLoadingMore(true)
    try {
      const url = q
        ? `/api/admin/customers?take=${PAGE_TAKE}&offset=${currentOffset}&q=${encodeURIComponent(q)}`
        : `/api/admin/customers?take=${PAGE_TAKE}&offset=${currentOffset}`
      const res = await fetch(url)
      const data = await res.json()
      const nextRows = data?.customers || []
      if (reset) setRows(nextRows)
      else setRows((prev) => [...prev, ...nextRows])
      setOffset(currentOffset + nextRows.length)
      setHasMore(nextRows.length === PAGE_TAKE)
    } finally {
      if (reset) setLoading(false)
      else setLoadingMore(false)
    }
  }

  useEffect(() => {
    const t = window.setTimeout(() => {
      fetchCustomers({ reset: true }).catch((err) => console.error("[admin/customers] load failed:", err))
    }, 300)
    return () => window.clearTimeout(t)
  }, [q])

  useEffect(() => {
    refreshWelcomeStats()
  }, [rows.length, createOpen])

  const filtered = rows

  const stats = useMemo(() => {
    const active = rows.filter((r) => String(r.status).toLowerCase() === "active").length
    return {
      loaded: rows.length,
      active,
      inactive: rows.length - active,
    }
  }, [rows])

  const sendWelcomeToCustomer = async (customer: CustomerRow, forceResend = false) => {
    const alreadySent = Boolean(customer.welcomeEmailSentAt)
    const action = forceResend || alreadySent ? "Resend" : "Send"
    if (
      !confirm(
        `${action} welcome email to ${customer.companyName} (${customer.email})?\n\nA new temporary password will be emailed and set on their account.`,
      )
    ) {
      return
    }
    setWelcomeOneSending(true)
    try {
      const res = await fetch("/api/admin/customers/welcome-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id,
          forceResend: forceResend || alreadySent,
          onlyPending: !(forceResend || alreadySent),
        }),
      })
      const data = await res.json()
      if (data?.success) {
        const sentAt = new Date().toISOString()
        setSelected((prev) =>
          prev?.id === customer.id ? { ...prev, welcomeEmailSentAt: sentAt } : prev,
        )
        setRows((prev) =>
          prev.map((r) => (r.id === customer.id ? { ...r, welcomeEmailSentAt: sentAt } : r)),
        )
        refreshWelcomeStats()
        alert(data.message || "Welcome email queued.")
      } else if (data?.alreadySent) {
        if (confirm("Welcome already sent. Resend with a new password?")) {
          await sendWelcomeToCustomer(customer, true)
        }
      } else {
        alert(data?.error || "Failed to send welcome email")
      }
    } catch {
      alert("Network error while sending welcome email")
    } finally {
      setWelcomeOneSending(false)
    }
  }

  const sendWelcomeToAll = async () => {
    const pendingLabel =
      welcomePending == null ? "all pending clients" : `${welcomePending} pending client(s)`
    if (
      !confirm(
        `Send welcome emails to ${pendingLabel}?\n\nEach client gets a new temporary password by email.\nOnly clients who have not received a welcome email yet will be included.`,
      )
    ) {
      return
    }
    setWelcomeSending(true)
    try {
      const res = await fetch("/api/admin/customers/welcome-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onlyPending: true }),
      })
      const data = await res.json()
      if (data?.success) {
        setWelcomePending(0)
        alert(data.message || `Welcome emails queued for ${data.queued} client(s).`)
      } else {
        alert(data?.error || "Failed to send welcome emails")
      }
    } catch {
      alert("Network error while sending welcome emails")
    } finally {
      setWelcomeSending(false)
    }
  }

  const loadMore = async () => {
    if (loading || loadingMore || !hasMore) return
    await fetchCustomers({ reset: false })
  }

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
        await fetchCustomers({ reset: true })
        setCreateForm(EMPTY_CREATE_CUSTOMER_FORM)
        setCreateOpen(false)
        alert(
          `Customer ${data.customer.id} created.\nNo welcome email was sent yet — use “Send welcome emails” after all clients are entered.`,
        )
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

      const allCustomers: CustomerRow[] = []
      let off = 0
      while (true) {
        const url = q
          ? `/api/admin/customers?take=${PAGE_TAKE}&offset=${off}&q=${encodeURIComponent(q)}`
          : `/api/admin/customers?take=${PAGE_TAKE}&offset=${off}`
        const res = await fetch(url)
        const data = await res.json()
        const batch = data?.customers || []
        if (!batch.length) break
        allCustomers.push(...batch)
        if (batch.length < PAGE_TAKE) break
        off += batch.length
      }

      for (const r of allCustomers) {
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
    <div className="space-y-6">
      <AdminPageHeader
        icon={<Users className="h-5 w-5" />}
        title="Customers"
        description="Enter all clients first, then send welcome emails in one click. Click any row to open the full customer sheet."
        actions={
          <>
            <Button
              variant="outline"
              className="rounded-full border-[#dce8dc] text-[#1b7339] hover:bg-[#e8f5e9]"
              onClick={sendWelcomeToAll}
              disabled={welcomeSending || rows.length === 0}
            >
              {welcomeSending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Welcome emails
              {welcomePending != null ? ` (${welcomePending})` : ""}
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={exportExcel}
              disabled={exporting || rows.length === 0}
            >
              {exporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export Excel
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
              <DialogContent className="max-h-[90vh] overflow-y-auto border-[#ebe9e4] sm:max-w-[720px]">
                <DialogHeader>
                  <DialogTitle className="admin-page-title text-xl">Create New Customer</DialogTitle>
                  <DialogDescription>
                    Required fields marked *. Customer ID is auto-assigned.
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
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="admin-stat-card">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a8a8a]">Loaded</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#141414]">{stats.loaded}</p>
          <p className="mt-1 text-[11px] text-[#6b6b6b]">Rows in spreadsheet view</p>
        </div>
        <div className="admin-stat-card">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
            <UserCheck className="h-3.5 w-3.5 text-[#1b7339]" />
            Active
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#1b7339]">{stats.active}</p>
          <p className="mt-1 text-[11px] text-[#6b6b6b]">Among loaded clients</p>
        </div>
        <div className="admin-stat-card">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a8a8a]">Inactive</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#141414]">{stats.inactive}</p>
          <p className="mt-1 text-[11px] text-[#6b6b6b]">Among loaded clients</p>
        </div>
        <div className="admin-stat-card">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
            <MailWarning className="h-3.5 w-3.5 text-amber-600" />
            Welcome pending
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-amber-700">
            {welcomePending ?? "—"}
          </p>
          <p className="mt-1 text-[11px] text-[#6b6b6b]">Not yet emailed portal login</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-[14px] border border-[#ebe9e4] bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1 sm:max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8a8a]" />
          <Input
            value={q}
            onChange={(e) => startTransition(() => setQ(e.target.value))}
            placeholder="Search by ID, brand, GSTIN, city, email..."
            className="h-11 rounded-xl border-[#e8e6e1] pl-9"
          />
          {q ? (
            <button
              type="button"
              onClick={() => setQ("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-[11px] font-semibold text-[#6b6b6b] hover:bg-[#f5f5f3]"
            >
              Clear
            </button>
          ) : null}
        </div>
        <p className="text-[12px] text-[#6b6b6b]">
          <Table2 className="mr-1 inline h-3.5 w-3.5" />
          {filtered.length} row{filtered.length === 1 ? "" : "s"}
          {isPending ? " · filtering…" : ""}
        </p>
      </div>

      <div className="admin-table-wrap overflow-hidden rounded-[14px] border border-[#ebe9e4] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#ebe9e4] bg-[#fafaf8] px-4 py-3">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-[#141414]">
            <Building2 className="h-4 w-4 text-[#1b7339]" />
            Client spreadsheet
          </p>
          <p className="text-[11px] text-[#6b6b6b]">Click a row to edit</p>
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
                <tr className="border-b border-[#ebe9e4] bg-[#fafaf8]">
                  {SHEET_COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className="whitespace-nowrap border-r border-[#f0eeea] px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#777]"
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
                    className={`cursor-pointer border-b border-[#f0eeea] transition-colors hover:bg-[#f3faf4] ${
                      idx % 2 === 0 ? "bg-white" : "bg-[#fcfcfb]"
                    } ${selected?.id === r.id ? "!bg-[#eef7ef]" : ""}`}
                  >
                    {SHEET_COLUMNS.map((col) => (
                      <td
                        key={col.key}
                        className="max-w-[220px] truncate border-r border-[#f7f6f2] px-3 py-2 text-[#141414]"
                        title={cellValue(r, col.key)}
                      >
                        {col.key === "id" ? (
                          <span className="font-semibold text-[#1B7339]">{cellValue(r, col.key)}</span>
                        ) : col.key === "status" ? (
                          <Badge
                            variant="outline"
                            className={
                              String(r.status).toLowerCase() === "active"
                                ? "border-[#c8e6d4] bg-[#e8f5e9] text-[#1b7339]"
                                : "border-[#ebe9e4] bg-[#fafaf8] text-[#6b6b6b]"
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
        {!loading && hasMore && (
          <div className="flex justify-center border-t border-[#ebe9e4] py-4">
            <Button onClick={loadMore} disabled={loadingMore} variant="outline" className="rounded-full">
              {loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {loadingMore ? "Loading..." : "Load more"}
            </Button>
          </div>
        )}
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto border-l border-[#ebe9e4] p-0 sm:max-w-xl">
          {selected && (
            <>
              <div className="border-b border-[#ebe9e4] bg-gradient-to-br from-[#f3faf4] to-white px-6 pb-5 pt-6">
                <SheetHeader className="space-y-3 text-left">
                  <div className="flex items-start gap-4">
                    {selected.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selected.logoUrl}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-xl border border-[#ebe9e4] bg-white object-contain p-1.5"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[#dce8dc] bg-white text-lg font-bold text-[#1b7339]">
                        {selected.companyName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <SheetTitle className="font-[family-name:var(--font-display)] text-xl leading-tight">
                        {selected.companyName}
                      </SheetTitle>
                      <p className="mt-1 text-sm font-semibold text-[#1b7339]">{selected.id}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          className={
                            String(selected.status).toLowerCase() === "active"
                              ? "border-[#c8e6d4] bg-[#e8f5e9] text-[#1b7339]"
                              : ""
                          }
                        >
                          {selected.status}
                        </Badge>
                        {selected.serviceStatus ? (
                          <Badge variant="outline" className="border-[#ebe9e4] bg-white">
                            {selected.serviceStatus}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <SheetDescription className="text-[13px]">
                    Edit customer details and POCs — save to update the database.
                  </SheetDescription>
                </SheetHeader>
              </div>

              <div className="space-y-4 px-6 py-5 pb-10">
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#dce8dc] bg-[#f7fbf7] px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-[#1B7339]">Portal welcome email</p>
                    <p className="text-[11px] text-[#6B6B6B]">
                      {selected.welcomeEmailSentAt
                        ? `Sent ${new Date(selected.welcomeEmailSentAt).toLocaleString("en-IN")}`
                        : "Not sent yet — send after all clients are entered"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-full bg-[#1B7339] hover:bg-[#145a2c]"
                    disabled={welcomeOneSending || !selected.email}
                    onClick={() => sendWelcomeToCustomer(selected)}
                  >
                    {welcomeOneSending ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Mail className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    {selected.welcomeEmailSentAt ? "Resend welcome" : "Send welcome"}
                  </Button>
                </div>
                <EditableCustomerSheet
                  customer={selected}
                  onSaved={(next) => {
                    setSelected(next)
                    setRows((prev) => prev.map((r) => (r.id === next.id ? { ...r, ...next } : r)))
                  }}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
