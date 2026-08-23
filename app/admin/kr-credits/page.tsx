"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Coins, Loader2, Plus, RefreshCw, Pencil } from "lucide-react"
import {
  AdminListCard,
  AdminListRow,
  AdminPageHeader,
  AdminSearchInput,
} from "@/components/admin/admin-list-card"
import {
  AdminDetailSheet,
  AdminSheetField,
  AdminSheetSection,
} from "@/components/admin/admin-detail-sheet"
import { CustomerSearchSelect } from "@/components/admin/customer-search-select"

type CustomerRow = {
  id: string
  companyName: string
  email: string
  kraftrebornCredits?: number
  updatedAt?: string
}

export default function AdminKrCreditsPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [customerId, setCustomerId] = useState("")
  const [amount, setAmount] = useState("")
  const [creditMode, setCreditMode] = useState<"add" | "set">("add")
  const [adding, setAdding] = useState(false)
  const [selected, setSelected] = useState<CustomerRow | null>(null)
  const [sheetAmount, setSheetAmount] = useState("")
  const [sheetMode, setSheetMode] = useState<"add" | "set">("add")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/customers?fields=options&take=1000")
      const data = await res.json()
      if (data?.success && data.customers?.length) {
        setCustomers(data.customers)
        setCustomerId((prev) => prev || data.customers[0].id)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    const list = [...customers].sort(
      (a, b) => Number(b.kraftrebornCredits || 0) - Number(a.kraftrebornCredits || 0),
    )
    if (!s) return list
    return list.filter(
      (c) =>
        c.companyName.toLowerCase().includes(s) ||
        c.email.toLowerCase().includes(s) ||
        c.id.toLowerCase().includes(s),
    )
  }, [customers, q])

  const draftCustomer = customers.find((c) => c.id === customerId)

  const applyCredits = async (
    id: string,
    opts: { delta?: number; absolute?: number },
    closeSheet?: boolean,
  ) => {
    const body =
      opts.absolute !== undefined
        ? { id, kraftrebornCredits: opts.absolute }
        : { id, kraftrebornCreditsDelta: opts.delta }

    const res = await fetch("/api/admin/customers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (data?.success && data.customer) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, kraftrebornCredits: data.customer.kraftrebornCredits, updatedAt: data.customer.updatedAt }
            : c,
        ),
      )
      setSelected((s) =>
        s?.id === id ? { ...s, kraftrebornCredits: data.customer.kraftrebornCredits } : s,
      )
      if (closeSheet) setSheetAmount("")
      return true
    }
    alert(data?.error || "Failed to update KR credits")
    return false
  }

  const addCredits = async () => {
    const delta = Math.max(0, Math.floor(Number(amount)))
    if (!customerId || !Number.isFinite(delta) || delta <= 0) return
    setAdding(true)
    try {
      const ok = await applyCredits(customerId, { delta })
      if (ok) setAmount("")
    } finally {
      setAdding(false)
    }
  }

  const setCredits = async () => {
    const next = Math.max(0, Math.floor(Number(amount)))
    if (!customerId || !Number.isFinite(next)) return
    const current = Math.floor(Number(draftCustomer?.kraftrebornCredits) || 0)
    if (
      next < current &&
      !confirm(`Change balance from ₹${current} to ₹${next}? The client will have less redeemable amount.`)
    ) {
      return
    }
    setAdding(true)
    try {
      const ok = await applyCredits(customerId, { absolute: next })
      if (ok) setAmount("")
    } finally {
      setAdding(false)
    }
  }

  const addCreditsFromSheet = async () => {
    if (!selected) return
    const delta = Math.max(0, Math.floor(Number(sheetAmount)))
    if (!Number.isFinite(delta) || delta <= 0) return
    setAdding(true)
    try {
      await applyCredits(selected.id, { delta }, true)
    } finally {
      setAdding(false)
    }
  }

  const setCreditsFromSheet = async () => {
    if (!selected) return
    const next = Math.max(0, Math.floor(Number(sheetAmount)))
    if (!Number.isFinite(next)) return
    const current = Math.floor(Number(selected.kraftrebornCredits) || 0)
    if (
      next < current &&
      !confirm(`Change balance from ₹${current} to ₹${next}? The client will have less redeemable amount.`)
    ) {
      return
    }
    setAdding(true)
    try {
      await applyCredits(selected.id, { absolute: next }, true)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={<Coins className="h-6 w-6 text-primary" />}
        title="KR Credits"
        description="Give extra KraftReborn rupee amount — click a row to open the client sheet"
        search={
          <AdminSearchInput
            value={q}
            onChange={setQ}
            placeholder="Search client name or email..."
          />
        }
      />

      <Card className="glass border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {creditMode === "add" ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            {creditMode === "add" ? "Give extra KR amount" : "Change KR balance"}
          </CardTitle>
          <CardDescription>
            {creditMode === "add"
              ? "Add redeemable balance for the KraftReborn shop"
              : "Set the client’s exact redeemable balance (increase or decrease)"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={creditMode === "add" ? "default" : "outline"}
              className={creditMode === "add" ? "rounded-full bg-[#1B7339] hover:bg-[#145a2c]" : "rounded-full"}
              onClick={() => {
                setCreditMode("add")
                setAmount("")
              }}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add credits
            </Button>
            <Button
              type="button"
              variant={creditMode === "set" ? "default" : "outline"}
              className={creditMode === "set" ? "rounded-full bg-[#1B7339] hover:bg-[#145a2c]" : "rounded-full"}
              onClick={() => {
                setCreditMode("set")
                setAmount(
                  draftCustomer ? String(Math.floor(Number(draftCustomer.kraftrebornCredits) || 0)) : "",
                )
              }}
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Set balance
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Customer</Label>
              <CustomerSearchSelect
                customers={customers}
                value={customerId}
                onChange={(id) => {
                  setCustomerId(id)
                  if (creditMode === "set") {
                    const row = customers.find((c) => c.id === id)
                    setAmount(row ? String(Math.floor(Number(row.kraftrebornCredits) || 0)) : "")
                  }
                }}
              />
              {draftCustomer && (
                <p className="pt-1 text-[11px] text-muted-foreground">
                  Current balance: ₹{Math.floor(Number(draftCustomer.kraftrebornCredits) || 0)}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {creditMode === "add" ? "Amount to add (₹)" : "New balance (₹)"}
              </Label>
              <Input
                type="number"
                min={0}
                step={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={creditMode === "add" ? "e.g. 500" : "e.g. 24950"}
              />
              {creditMode === "set" && draftCustomer && amount !== "" ? (
                <p className="pt-1 text-[11px] text-muted-foreground">
                  {(() => {
                    const current = Math.floor(Number(draftCustomer.kraftrebornCredits) || 0)
                    const next = Math.max(0, Math.floor(Number(amount) || 0))
                    const diff = next - current
                    if (diff === 0) return "No change from current balance"
                    if (diff > 0) return `Increases by ₹${diff}`
                    return `Decreases by ₹${Math.abs(diff)}`
                  })()}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={creditMode === "add" ? addCredits : setCredits}
              disabled={adding || !amount || !customerId}
              className="rounded-lg bg-[#1B7339] hover:bg-[#145a2c]"
            >
              {adding ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : creditMode === "add" ? (
                <Plus className="mr-2 h-4 w-4" />
              ) : (
                <Pencil className="mr-2 h-4 w-4" />
              )}
              {creditMode === "add" ? "Add credits" : "Set balance"}
            </Button>
            <Button variant="outline" onClick={load} disabled={loading} className="rounded-lg">
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <AdminListCard
        title="Client balances"
        description="Click any row to open sheet"
        count={filtered.length}
        loading={loading}
        isEmpty={filtered.length === 0}
        emptyMessage="No clients found."
      >
        {filtered.map((row) => (
          <AdminListRow key={row.id} onClick={() => setSelected(row)}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">{row.companyName}</p>
                  <Badge variant="outline" className="bg-muted/30">
                    {row.id}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{row.email}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">
                  ₹{Math.floor(Number(row.kraftrebornCredits) || 0)}
                </p>
                <p className="text-xs text-muted-foreground">KR balance</p>
              </div>
            </div>
          </AdminListRow>
        ))}
      </AdminListCard>

      <AdminDetailSheet
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null)
            setSheetAmount("")
            setSheetMode("add")
          }
        }}
        title={selected ? `${selected.companyName}` : ""}
        description={selected ? `${selected.id} · client sheet` : undefined}
      >
        {selected && (
          <>
            <AdminSheetSection title="Client">
              <AdminSheetField label="Company" value={selected.companyName} />
              <AdminSheetField label="Customer ID" value={selected.id} />
              <AdminSheetField label="Email" value={selected.email} />
              <AdminSheetField
                label="KR balance (₹)"
                value={
                  <span className="text-lg font-bold text-[#1B7339]">
                    ₹{Math.floor(Number(selected.kraftrebornCredits) || 0)}
                  </span>
                }
              />
            </AdminSheetSection>

            <AdminSheetSection title="Update KR balance">
              <div className="flex flex-wrap gap-2 pb-2">
                <Button
                  type="button"
                  size="sm"
                  variant={sheetMode === "add" ? "default" : "outline"}
                  className={sheetMode === "add" ? "rounded-full bg-[#1B7339] hover:bg-[#145a2c]" : "rounded-full"}
                  onClick={() => {
                    setSheetMode("add")
                    setSheetAmount("")
                  }}
                >
                  Add
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={sheetMode === "set" ? "default" : "outline"}
                  className={sheetMode === "set" ? "rounded-full bg-[#1B7339] hover:bg-[#145a2c]" : "rounded-full"}
                  onClick={() => {
                    setSheetMode("set")
                    setSheetAmount(String(Math.floor(Number(selected.kraftrebornCredits) || 0)))
                  }}
                >
                  Set balance
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={sheetAmount}
                  onChange={(e) => setSheetAmount(e.target.value)}
                  placeholder={sheetMode === "add" ? "Amount to add (₹)" : "New balance (₹)"}
                />
                <Button
                  onClick={sheetMode === "add" ? addCreditsFromSheet : setCreditsFromSheet}
                  disabled={adding || !sheetAmount}
                  className="shrink-0 rounded-lg bg-[#1B7339] hover:bg-[#145a2c]"
                >
                  {adding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : sheetMode === "add" ? (
                    "Add"
                  ) : (
                    "Set"
                  )}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {sheetMode === "add"
                  ? "Client receives an email when extra credits are added."
                  : "Set the exact balance. Email is sent only when the balance increases."}
              </p>
            </AdminSheetSection>

            <Link
              href="/admin/customers"
              className="inline-flex text-[13px] font-semibold text-[#1B7339] hover:underline"
              onClick={() => setSelected(null)}
            >
              Open full customer sheet →
            </Link>
          </>
        )}
      </AdminDetailSheet>
    </div>
  )
}
