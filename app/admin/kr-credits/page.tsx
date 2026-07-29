"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Coins, Loader2, Plus, RefreshCw } from "lucide-react"
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
  const [adding, setAdding] = useState(false)
  const [selected, setSelected] = useState<CustomerRow | null>(null)
  const [sheetAmount, setSheetAmount] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/customers?fields=options")
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

  const applyCredits = async (id: string, delta: number, closeSheet?: boolean) => {
    const res = await fetch("/api/admin/customers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, kraftrebornCreditsDelta: delta }),
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
    alert(data?.error || "Failed to add KR credits")
    return false
  }

  const addCredits = async () => {
    const delta = Math.max(0, Math.floor(Number(amount)))
    if (!customerId || !Number.isFinite(delta) || delta <= 0) return
    setAdding(true)
    try {
      const ok = await applyCredits(customerId, delta)
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
      await applyCredits(selected.id, delta, true)
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
            <Plus className="h-4 w-4" />
            Give extra KR amount
          </CardTitle>
          <CardDescription>Add redeemable balance for the KraftReborn shop</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Customer</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.companyName} ({c.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {draftCustomer && (
                <p className="pt-1 text-[11px] text-muted-foreground">
                  Current balance: ₹{Math.floor(Number(draftCustomer.kraftrebornCredits) || 0)}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Amount to add (₹)</Label>
              <Input
                type="number"
                min={1}
                step={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 500"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={addCredits}
              disabled={adding || !amount || !customerId}
              className="rounded-lg bg-[#1B7339] hover:bg-[#145a2c]"
            >
              {adding ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Add credits
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

            <AdminSheetSection title="Add extra KR amount">
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={sheetAmount}
                  onChange={(e) => setSheetAmount(e.target.value)}
                  placeholder="Amount in ₹"
                />
                <Button
                  onClick={addCreditsFromSheet}
                  disabled={adding || !sheetAmount}
                  className="shrink-0 rounded-lg bg-[#1B7339] hover:bg-[#145a2c]"
                >
                  {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Client receives an email when extra credits are added.
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
