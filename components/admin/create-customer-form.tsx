"use client"

import { useEffect, useMemo, useState } from "react"
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
import {
  COLLECTION_FREQUENCY_OPTIONS,
  getCitiesForState,
  INDIA_STATES,
} from "@/lib/india-locations"
import { Loader2, Plus, Trash2 } from "lucide-react"

export type CollectionPocForm = {
  name: string
  email: string
  number: string
  designation: string
}

export type CreateCustomerFormState = {
  brandName: string
  tradeName: string
  state: string
  city: string
  lsuName: string
  lsuTechnicianName: string
  operationsIncharge: string
  primaryPocName: string
  primaryPocEmail: string
  primaryPocNumber: string
  primaryPocDesignation: string
  collectionPocs: CollectionPocForm[]
  serviceStartDate: string
  noOfKiosk: string
  noOfBasicKiosk: string
  noOfAdvanceKiosk: string
  noOfPanVendorKiosk: string
  noOfWallMountKiosk: string
  collectionFrequency: string
  kraftrebornCredits: string
  gstin: string
  logoBase64: string
  logoPreview: string
}

export const EMPTY_CREATE_CUSTOMER_FORM: CreateCustomerFormState = {
  brandName: "",
  tradeName: "",
  state: "",
  city: "",
  lsuName: "",
  lsuTechnicianName: "",
  operationsIncharge: "",
  primaryPocName: "",
  primaryPocEmail: "",
  primaryPocNumber: "",
  primaryPocDesignation: "",
  collectionPocs: [{ name: "", email: "", number: "", designation: "" }],
  serviceStartDate: "",
  noOfKiosk: "",
  noOfBasicKiosk: "0",
  noOfAdvanceKiosk: "0",
  noOfPanVendorKiosk: "0",
  noOfWallMountKiosk: "0",
  collectionFrequency: "",
  kraftrebornCredits: "",
  gstin: "",
  logoBase64: "",
  logoPreview: "",
}

function Req({ children }: { children: React.ReactNode }) {
  return (
    <Label>
      {children} <span className="text-red-500">*</span>
    </Label>
  )
}

export function CreateCustomerForm({
  form,
  setForm,
  nextId,
  error,
  loading,
  onSubmit,
  onCancel,
}: {
  form: CreateCustomerFormState
  setForm: React.Dispatch<React.SetStateAction<CreateCustomerFormState>>
  nextId: string
  error: string | null
  loading: boolean
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}) {
  const cities = useMemo(() => getCitiesForState(form.state), [form.state])
  const [lsuTeams, setLsuTeams] = useState<{ lsuName: string; technicianName: string }[]>([])
  const [dropdownsLoading, setDropdownsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setDropdownsLoading(true)
      try {
        const res = await fetch("/api/admin/lsu-teams")
        const data = await res.json()
        if (cancelled) return
        setLsuTeams(
          (data.teams || []).map((t: { lsuName: string; technicianName: string }) => ({
            lsuName: t.lsuName,
            technicianName: t.technicianName,
          })),
        )
      } catch {
        if (!cancelled) setLsuTeams([])
      } finally {
        if (!cancelled) setDropdownsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const selectLsu = (lsuName: string) => {
    const team = lsuTeams.find((t) => t.lsuName === lsuName)
    setForm((p) => ({
      ...p,
      lsuName,
      lsuTechnicianName: team?.technicianName || "",
    }))
  }

  const updatePoc = (index: number, patch: Partial<CollectionPocForm>) => {
    setForm((p) => ({
      ...p,
      collectionPocs: p.collectionPocs.map((poc, i) => (i === index ? { ...poc, ...patch } : poc)),
    }))
  }

  const addPoc = () => {
    setForm((p) => ({
      ...p,
      collectionPocs: [...p.collectionPocs, { name: "", email: "", number: "", designation: "" }],
    }))
  }

  const removePoc = (index: number) => {
    setForm((p) => ({
      ...p,
      collectionPocs:
        p.collectionPocs.length <= 1
          ? p.collectionPocs
          : p.collectionPocs.filter((_, i) => i !== index),
    }))
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      )}

      <div className="space-y-2">
        <Label>Customer ID</Label>
        <Input value={nextId || "BI01"} readOnly className="bg-[#F7FBF7] font-semibold text-[#1B7339]" />
        <p className="text-[11px] text-[#6B6B6B]">Auto-generated (starts BI01, increments by 1)</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Req>Customer Brand Name</Req>
          <Input
            required
            value={form.brandName}
            onChange={(e) => setForm((p) => ({ ...p, brandName: e.target.value }))}
            placeholder="Brand name"
          />
        </div>
        <div className="space-y-2">
          <Req>Customer Trade Name</Req>
          <Input
            required
            value={form.tradeName}
            onChange={(e) => setForm((p) => ({ ...p, tradeName: e.target.value }))}
            placeholder="Trade / legal name"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>GSTIN</Label>
          <Input
            value={form.gstin}
            onChange={(e) => setForm((p) => ({ ...p, gstin: e.target.value.toUpperCase() }))}
            placeholder="22AAAAA0000A1Z5"
            maxLength={15}
          />
        </div>
        <div className="space-y-2">
          <Label>Customer Logo</Label>
          <Input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) {
                setForm((p) => ({ ...p, logoBase64: "", logoPreview: "" }))
                return
              }
              if (file.size > 2 * 1024 * 1024) {
                alert("Logo must be under 2MB")
                return
              }
              const reader = new FileReader()
              reader.onload = () => {
                const result = String(reader.result || "")
                setForm((p) => ({ ...p, logoBase64: result, logoPreview: result }))
              }
              reader.readAsDataURL(file)
            }}
          />
          {form.logoPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.logoPreview}
              alt="Logo preview"
              className="mt-2 h-14 w-auto max-w-[160px] rounded-lg border border-[#E5E5E5] bg-white object-contain p-1"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Req>State</Req>
          <Select
            value={form.state || undefined}
            onValueChange={(v) => setForm((p) => ({ ...p, state: v, city: "" }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {INDIA_STATES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Req>City</Req>
          <Select
            value={form.city || undefined}
            onValueChange={(v) => setForm((p) => ({ ...p, city: v }))}
            disabled={!form.state}
          >
            <SelectTrigger>
              <SelectValue placeholder={form.state ? "Select city" : "Select state first"} />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {cities.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Req>LSU Name</Req>
          <Select
            value={form.lsuName || undefined}
            onValueChange={selectLsu}
            disabled={dropdownsLoading || lsuTeams.length === 0}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  dropdownsLoading
                    ? "Loading…"
                    : lsuTeams.length
                      ? "Select LSU name"
                      : "Add LSU teams in Dropdowns"
                }
              />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {lsuTeams.map((team) => (
                <SelectItem key={team.lsuName} value={team.lsuName}>
                  {team.lsuName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!dropdownsLoading && lsuTeams.length === 0 && (
            <p className="text-[11px] text-[#C62828]">
              No active LSU teams yet. Add them under Admin → Dropdowns.
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Req>LSU Technician Name</Req>
          <Input
            readOnly
            required
            value={form.lsuTechnicianName}
            placeholder="Auto-filled from LSU"
            className="bg-[#F7FBF7]"
          />
          <p className="text-[11px] text-[#6B6B6B]">Filled automatically when you select an LSU.</p>
        </div>
      </div>

      <div className="space-y-2">
        <Req>Operations Incharge</Req>
        <Input
          required
          value={form.operationsIncharge}
          onChange={(e) => setForm((p) => ({ ...p, operationsIncharge: e.target.value }))}
        />
      </div>

      <div className="space-y-3 rounded-xl border border-[#E2EBE4] bg-[#F7FBF7] p-4">
        <p className="text-sm font-semibold text-[#141414]">Primary POC</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Req>Primary POC name</Req>
            <Input
              required
              value={form.primaryPocName}
              onChange={(e) => setForm((p) => ({ ...p, primaryPocName: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Req>Primary POC Email</Req>
            <Input
              type="email"
              required
              value={form.primaryPocEmail}
              onChange={(e) => setForm((p) => ({ ...p, primaryPocEmail: e.target.value }))}
              placeholder="name@company.com"
            />
          </div>
          <div className="space-y-2">
            <Req>Primary POC Number</Req>
            <Input
              required
              value={form.primaryPocNumber}
              onChange={(e) => setForm((p) => ({ ...p, primaryPocNumber: e.target.value }))}
              placeholder="+91 ..."
            />
          </div>
          <div className="space-y-2">
            <Label>Primary POC Designation</Label>
            <Input
              value={form.primaryPocDesignation}
              onChange={(e) => setForm((p) => ({ ...p, primaryPocDesignation: e.target.value }))}
            />
          </div>
        </div>
        <p className="text-[11px] text-[#6B6B6B]">
          Portal username = Primary POC Email. A random 10-character password is emailed to them with a welcome message.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-[#E2EBE4] p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[#141414]">Collection POC details</p>
          <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={addPoc}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add more
          </Button>
        </div>

        {form.collectionPocs.map((poc, index) => (
          <div
            key={index}
            className="space-y-3 rounded-lg border border-[#EAEAEA] bg-white p-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#1B7339]">
                Collection POC {index + 1}
              </p>
              {form.collectionPocs.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-red-600 hover:text-red-700"
                  onClick={() => removePoc(index)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Req>Collection POC name</Req>
                <Input
                  required
                  value={poc.name}
                  onChange={(e) => updatePoc(index, { name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Req>Collection POC Email</Req>
                <Input
                  type="email"
                  required
                  value={poc.email}
                  onChange={(e) => updatePoc(index, { email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Req>Collection POC Number</Req>
                <Input
                  required
                  value={poc.number}
                  onChange={(e) => updatePoc(index, { number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Collection POC Designation</Label>
                <Input
                  value={poc.designation}
                  onChange={(e) => updatePoc(index, { designation: e.target.value })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Req>Service Start Date</Req>
          <Input
            type="date"
            required
            value={form.serviceStartDate}
            onChange={(e) => setForm((p) => ({ ...p, serviceStartDate: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Req>Collection Frequency</Req>
          <Select
            value={form.collectionFrequency || undefined}
            onValueChange={(v) => setForm((p) => ({ ...p, collectionFrequency: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              {COLLECTION_FREQUENCY_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <Req>No. Of Kiosk</Req>
          <Input
            type="number"
            min={0}
            required
            value={form.noOfKiosk}
            onChange={(e) => setForm((p) => ({ ...p, noOfKiosk: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>No. of Basic Kiosk</Label>
          <Input
            type="number"
            min={0}
            value={form.noOfBasicKiosk}
            onChange={(e) => setForm((p) => ({ ...p, noOfBasicKiosk: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>No. of Advance Kiosk</Label>
          <Input
            type="number"
            min={0}
            value={form.noOfAdvanceKiosk}
            onChange={(e) => setForm((p) => ({ ...p, noOfAdvanceKiosk: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>No. of Pan Vendor Kiosk</Label>
          <Input
            type="number"
            min={0}
            value={form.noOfPanVendorKiosk}
            onChange={(e) => setForm((p) => ({ ...p, noOfPanVendorKiosk: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>No. of wall mount Kiosk</Label>
          <Input
            type="number"
            min={0}
            value={form.noOfWallMountKiosk}
            onChange={(e) => setForm((p) => ({ ...p, noOfWallMountKiosk: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-[#E2EBE4] bg-[#F7FBF7] p-4">
        <div className="space-y-2">
          <Req>KR Amount (₹)</Req>
          <Input
            type="number"
            min={0}
            step={1}
            required
            value={form.kraftrebornCredits}
            onChange={(e) => setForm((p) => ({ ...p, kraftrebornCredits: e.target.value }))}
            placeholder="e.g. 30000"
          />
          <p className="text-[11px] text-[#6B6B6B]">
            KraftReborn credit balance in rupees. Required so the customer can redeem products in the
            shop.
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            loading ||
            !form.state ||
            !form.city ||
            !form.lsuName ||
            !form.lsuTechnicianName ||
            !form.collectionFrequency ||
            form.kraftrebornCredits === ""
          }
          className="bg-[#1B7339] hover:bg-[#145a2c]"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Customer
        </Button>
      </div>
    </form>
  )
}

export function useNextCustomerId(open: boolean) {
  const [nextId, setNextId] = useState("BI01")

  useEffect(() => {
    if (!open) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/admin/customers?nextId=1")
        const data = await res.json()
        if (!cancelled && data?.nextId) setNextId(data.nextId)
      } catch {
        if (!cancelled) setNextId("BI01")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open])

  return nextId
}
