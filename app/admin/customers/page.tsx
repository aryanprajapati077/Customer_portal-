"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Loader2, Plus, Save, Search, Users, Check, ChevronsUpDown, X } from "lucide-react"

type CustomerRow = {
  id: string
  email: string
  companyName: string
  contactPerson: string | null
  phone: string | null
  address: string | null
  status: string
  totalWasteCollected: number
  disposalUnitInstalled: number
  monthlyTarget?: number
  updatedAt: string
  isGroup?: boolean
  parentCustomerId?: string | null
}

const INITIAL_FORM = {
  id: "",
  email: "",
  password: "",
  companyName: "",
  contactPerson: "",
  phone: "",
  address: "",
  industry: "",
  employeeCount: "",
  status: "Active",
  disposalUnitInstalled: "0",
  totalWasteCollected: "",
  cigaretteButtsCollected: "",
  microplasticsUpcycled: "",
  waterResourcesProtected: "",
  pendingCollection: "",
  certificatesEarned: "",
  co2Saved: "",
  treesEquivalent: "",
  monthlyTarget: "",
  profileImageUrl: "",
  notes: "",
  isGroup: false,
  parentCustomerId: "__none__",
  selectedChildIds: [] as string[],
}

export default function AdminCustomersPage() {
  const [rows, setRows] = useState<CustomerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [q, setQ] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState(INITIAL_FORM)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/admin/customers")
        const data = await res.json()
        if (cancelled) return
        if (data?.success) setRows(data.customers || [])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return rows
    return rows.filter((r) => {
      return (
        r.id.toLowerCase().includes(s) ||
        r.email.toLowerCase().includes(s) ||
        r.companyName.toLowerCase().includes(s) ||
        (r.contactPerson || "").toLowerCase().includes(s)
      )
    })
  }, [rows, q])

  const updateLocal = (id: string, patch: Partial<CustomerRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const save = async (row: CustomerRow) => {
    setSavingId(row.id)
    try {
      const res = await fetch("/api/admin/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: row.id,
          disposalUnitInstalled: row.disposalUnitInstalled,
          status: row.status,
          monthlyTarget: row.monthlyTarget,
          isGroup: row.isGroup,
          parentCustomerId: row.parentCustomerId,
        }),
      })
      const data = await res.json()
      if (data?.success && data.customer) {
        updateLocal(row.id, data.customer)
      }
    } finally {
      setSavingId(null)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    setCreateLoading(true)
    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: createForm.id.trim() || undefined,
          email: createForm.email.trim(),
          password: createForm.password,
          companyName: createForm.companyName.trim(),
          contactPerson: createForm.contactPerson.trim() || undefined,
          phone: createForm.phone.trim() || undefined,
          address: createForm.address.trim() || undefined,
          industry: createForm.industry.trim() || undefined,
          employeeCount: createForm.employeeCount ? Number(createForm.employeeCount) : undefined,
          status: createForm.status,
          disposalUnitInstalled: Number(createForm.disposalUnitInstalled) || 0,
          totalWasteCollected: createForm.totalWasteCollected ? Number(createForm.totalWasteCollected) : undefined,
          cigaretteButtsCollected: createForm.cigaretteButtsCollected ? Number(createForm.cigaretteButtsCollected) : undefined,
          microplasticsUpcycled: createForm.microplasticsUpcycled ? Number(createForm.microplasticsUpcycled) : undefined,
          waterResourcesProtected: createForm.waterResourcesProtected ? Number(createForm.waterResourcesProtected) : undefined,
          pendingCollection: createForm.pendingCollection ? Number(createForm.pendingCollection) : undefined,
          certificatesEarned: createForm.certificatesEarned ? Number(createForm.certificatesEarned) : undefined,
          co2Saved: createForm.co2Saved ? Number(createForm.co2Saved) : undefined,
          treesEquivalent: createForm.treesEquivalent ? Number(createForm.treesEquivalent) : undefined,
          monthlyTarget: createForm.monthlyTarget ? Number(createForm.monthlyTarget) : undefined,
          profileImageUrl: createForm.profileImageUrl.trim() || undefined,
          notes: createForm.notes.trim() || undefined,
          isGroup: createForm.isGroup,
          parentCustomerId: createForm.isGroup ? undefined : (createForm.parentCustomerId && createForm.parentCustomerId !== "__none__" ? createForm.parentCustomerId : undefined),
        }),
      })
      const data = await res.json()
      if (data?.success && data.customer) {
        const newGroupId = data.customer.id
        if (createForm.isGroup && createForm.selectedChildIds?.length) {
          for (const childId of createForm.selectedChildIds) {
            await fetch("/api/admin/customers", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: childId, parentCustomerId: newGroupId }),
            })
          }
        }
        const refetchRes = await fetch("/api/admin/customers")
        const refetchData = await refetchRes.json()
        if (refetchData?.success) setRows(refetchData.customers || [])
        setCreateForm(INITIAL_FORM)
        setCreateOpen(false)
      } else {
        setCreateError(data?.error || "Failed to create user")
      }
    } catch {
      setCreateError("Network error")
    } finally {
      setCreateLoading(false)
    }
  }

  const groupCustomers = useMemo(() => rows.filter((r) => r.isGroup), [rows])
  const selectableClients = useMemo(
    () => rows.filter((r) => !r.isGroup),
    [rows]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Customers
          </h1>
          <p className="text-sm text-muted-foreground">Manage customer status, targets, and disposal units</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Customer</DialogTitle>
                <DialogDescription>Add a new customer with email, company details, and optional group/parent settings.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                {createError && (
                  <div className="rounded-lg bg-destructive/10 text-destructive text-sm px-3 py-2">{createError}</div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="create-id">ID (optional, auto-generated if empty)</Label>
                  <Input
                    id="create-id"
                    value={createForm.id}
                    onChange={(e) => setCreateForm((p) => ({ ...p, id: e.target.value }))}
                    placeholder="Leave empty for auto-generated"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-email">Email *</Label>
                    <Input
                      id="create-email"
                      type="email"
                      required
                      value={createForm.email}
                      onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="customer@company.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-password">Password *</Label>
                    <Input
                      id="create-password"
                      type="password"
                      required
                      value={createForm.password}
                      onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-company">Company Name *</Label>
                  <Input
                    id="create-company"
                    required
                    value={createForm.companyName}
                    onChange={(e) => setCreateForm((p) => ({ ...p, companyName: e.target.value }))}
                    placeholder="Acme Corp"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-contact">Contact Person</Label>
                    <Input
                      id="create-contact"
                      value={createForm.contactPerson}
                      onChange={(e) => setCreateForm((p) => ({ ...p, contactPerson: e.target.value }))}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-phone">Phone</Label>
                    <Input
                      id="create-phone"
                      value={createForm.phone}
                      onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-address">Address</Label>
                  <Input
                    id="create-address"
                    value={createForm.address}
                    onChange={(e) => setCreateForm((p) => ({ ...p, address: e.target.value }))}
                    placeholder="123 Main St, City"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-industry">Industry</Label>
                    <Input
                      id="create-industry"
                      value={createForm.industry}
                      onChange={(e) => setCreateForm((p) => ({ ...p, industry: e.target.value }))}
                      placeholder="Manufacturing"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-employees">Employee Count</Label>
                    <Input
                      id="create-employees"
                      type="number"
                      min={0}
                      value={createForm.employeeCount}
                      onChange={(e) => setCreateForm((p) => ({ ...p, employeeCount: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={createForm.status} onValueChange={(v) => setCreateForm((p) => ({ ...p, status: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-disposal">Disposal Units Installed</Label>
                    <Input
                      id="create-disposal"
                      type="number"
                      min={0}
                      value={createForm.disposalUnitInstalled}
                      onChange={(e) => setCreateForm((p) => ({ ...p, disposalUnitInstalled: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="space-y-3 rounded-lg border border-border/50 p-4">
                  <p className="text-sm font-medium text-foreground">Impact Metrics</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="create-waste" className="text-xs">Total Waste (kg)</Label>
                      <Input id="create-waste" type="number" min={0} step="0.01" value={createForm.totalWasteCollected} onChange={(e) => setCreateForm((p) => ({ ...p, totalWasteCollected: e.target.value }))} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="create-cigarette" className="text-xs">Cigarette Butts (kg)</Label>
                      <Input id="create-cigarette" type="number" min={0} step="0.01" value={createForm.cigaretteButtsCollected} onChange={(e) => setCreateForm((p) => ({ ...p, cigaretteButtsCollected: e.target.value }))} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="create-micro" className="text-xs">Microplastics (kg)</Label>
                      <Input id="create-micro" type="number" min={0} step="0.01" value={createForm.microplasticsUpcycled} onChange={(e) => setCreateForm((p) => ({ ...p, microplasticsUpcycled: e.target.value }))} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="create-water" className="text-xs">Water Protected (L)</Label>
                      <Input id="create-water" type="number" min={0} step="0.01" value={createForm.waterResourcesProtected} onChange={(e) => setCreateForm((p) => ({ ...p, waterResourcesProtected: e.target.value }))} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="create-pending" className="text-xs">Pending Collection (kg)</Label>
                      <Input id="create-pending" type="number" min={0} step="0.01" value={createForm.pendingCollection} onChange={(e) => setCreateForm((p) => ({ ...p, pendingCollection: e.target.value }))} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="create-certificates" className="text-xs">Certificates Earned</Label>
                      <Input id="create-certificates" type="number" min={0} value={createForm.certificatesEarned} onChange={(e) => setCreateForm((p) => ({ ...p, certificatesEarned: e.target.value }))} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="create-co2" className="text-xs">CO2 Saved (kg)</Label>
                      <Input id="create-co2" type="number" min={0} step="0.01" value={createForm.co2Saved} onChange={(e) => setCreateForm((p) => ({ ...p, co2Saved: e.target.value }))} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="create-trees" className="text-xs">Trees Equivalent</Label>
                      <Input id="create-trees" type="number" min={0} value={createForm.treesEquivalent} onChange={(e) => setCreateForm((p) => ({ ...p, treesEquivalent: e.target.value }))} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="create-monthly" className="text-xs">Monthly Target (kg)</Label>
                      <Input id="create-monthly" type="number" min={0} step="0.01" value={createForm.monthlyTarget} onChange={(e) => setCreateForm((p) => ({ ...p, monthlyTarget: e.target.value }))} placeholder="0" />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-profileUrl">Profile Image URL</Label>
                    <Input
                      id="create-profileUrl"
                      type="url"
                      value={createForm.profileImageUrl}
                      onChange={(e) => setCreateForm((p) => ({ ...p, profileImageUrl: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-notes">Notes</Label>
                    <Textarea
                      id="create-notes"
                      value={createForm.notes}
                      onChange={(e) => setCreateForm((p) => ({ ...p, notes: e.target.value }))}
                      placeholder="Internal notes..."
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>
                <div className="space-y-3 rounded-lg border border-border/50 p-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="create-isGroup"
                      checked={createForm.isGroup}
                      onCheckedChange={(c) =>
                        setCreateForm((p) => ({
                          ...p,
                          isGroup: Boolean(c),
                          selectedChildIds: c ? p.selectedChildIds : [],
                          parentCustomerId: c ? "__none__" : p.parentCustomerId,
                        }))
                      }
                    />
                    <Label htmlFor="create-isGroup" className="font-normal cursor-pointer">
                      Group client (can access all child companies in dashboard)
                    </Label>
                  </div>
                  {!createForm.isGroup && groupCustomers.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <Label htmlFor="create-parent">Parent Company (optional)</Label>
                      <Select
                        value={createForm.parentCustomerId || "__none__"}
                        onValueChange={(v) => setCreateForm((p) => ({ ...p, parentCustomerId: v }))}
                      >
                        <SelectTrigger id="create-parent">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>
                          {groupCustomers.map((g) => (
                            <SelectItem key={g.id} value={g.id}>
                              {g.companyName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {createForm.isGroup && (
                    <div className="space-y-2 pt-2">
                      <Label>Add clients to this group</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between font-normal"
                          >
                            <span className="truncate">
                              {createForm.selectedChildIds?.length
                                ? `${createForm.selectedChildIds.length} client(s) selected`
                                : "Search by name or client ID..."}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search by company name or client ID..." />
                            <CommandList>
                              <CommandEmpty>No clients found.</CommandEmpty>
                              <CommandGroup>
                                {selectableClients.map((c) => {
                                  const selected = createForm.selectedChildIds?.includes(c.id)
                                  return (
                                    <CommandItem
                                      key={c.id}
                                      value={`${c.companyName} ${c.id}`}
                                      onSelect={() => {
                                        setCreateForm((p) => ({
                                          ...p,
                                          selectedChildIds: selected
                                            ? (p.selectedChildIds || []).filter((id) => id !== c.id)
                                            : [...(p.selectedChildIds || []), c.id],
                                        }))
                                      }}
                                    >
                                      <div
                                        className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border ${
                                          selected ? "bg-primary text-primary-foreground" : "opacity-50"
                                        }`}
                                      >
                                        {selected ? <Check className="h-3 w-3" /> : null}
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                        <span className="truncate">{c.companyName}</span>
                                        <span className="text-xs text-muted-foreground truncate">{c.id}</span>
                                      </div>
                                    </CommandItem>
                                  )
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {createForm.selectedChildIds?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {createForm.selectedChildIds.map((id) => {
                            const c = selectableClients.find((r) => r.id === id)
                            return (
                              <Badge
                                key={id}
                                variant="secondary"
                                className="gap-1 pr-1"
                              >
                                {c?.companyName || id}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCreateForm((p) => ({
                                      ...p,
                                      selectedChildIds: (p.selectedChildIds || []).filter((x) => x !== id),
                                    }))
                                  }
                                  className="rounded-full hover:bg-muted p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createLoading}>
                    {createLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create User
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <div className="w-full sm:w-[280px] relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by id, email, company..." className="pl-9" />
          </div>
        </div>
      </div>

      <Card className="glass border-border/50 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Customer List</CardTitle>
          <CardDescription>{filtered.length} customers</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((r, idx) => (
                <div
                  key={r.id}
                  className="p-4 rounded-2xl border border-border/50 bg-muted/20 hover:bg-muted/30 hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${idx * 20}ms`, animationFillMode: "both" }}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground truncate">{r.companyName}</p>
                        <Badge variant="outline" className="bg-muted/30">
                          {r.id}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            r.status.toLowerCase() === "active"
                              ? "bg-secondary/10 text-secondary border-secondary/30"
                              : "bg-primary/10 text-primary border-primary/30"
                          }
                        >
                          {r.status}
                        </Badge>
                        {r.isGroup && (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                            Group
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Updated: {new Date(r.updatedAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:w-[520px]">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Status</p>
                        <Select value={r.status} onValueChange={(v) => updateLocal(r.id, { status: v })}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Disposal Units</p>
                        <Input
                          value={r.disposalUnitInstalled ?? 0}
                          onChange={(e) => updateLocal(r.id, { disposalUnitInstalled: Number(e.target.value) })}
                          inputMode="numeric"
                        />
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Monthly Target</p>
                        <Input
                          value={r.monthlyTarget ?? 0}
                          onChange={(e) => updateLocal(r.id, { monthlyTarget: Number(e.target.value) })}
                          inputMode="decimal"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Total waste (db): <span className="font-medium text-foreground">{Number(r.totalWasteCollected || 0)} kg</span>
                    </p>
                    <Button size="sm" onClick={() => save(r)} disabled={savingId === r.id}>
                      {savingId === r.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

