"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Building2, Loader2, Mail, Plus, Trash2, Users } from "lucide-react"
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

type GroupLocation = {
  id: string
  companyName: string
  city: string | null
  state: string | null
  tradeName: string | null
}

type GroupRow = {
  id: string
  email: string
  companyName: string
  locations: GroupLocation[]
}

type AvailableCustomer = {
  id: string
  companyName: string
  city: string | null
  state: string | null
  email: string
}

export default function AdminGroupClientsPage() {
  const [groups, setGroups] = useState<GroupRow[]>([])
  const [available, setAvailable] = useState<AvailableCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [creating, setCreating] = useState(false)
  const [linking, setLinking] = useState(false)
  const [selected, setSelected] = useState<GroupRow | null>(null)
  const [pickCustomerId, setPickCustomerId] = useState("")
  const [draft, setDraft] = useState({ companyName: "", email: "", password: "" })
  const [lastPassword, setLastPassword] = useState<string | null>(null)
  const [emailNote, setEmailNote] = useState<string | null>(null)
  const [resending, setResending] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/group-clients")
      const data = await res.json()
      if (data?.success) {
        setGroups(data.groups || [])
        setAvailable(data.availableCustomers || [])
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
    if (!s) return groups
    return groups.filter(
      (g) =>
        g.companyName.toLowerCase().includes(s) ||
        g.email.toLowerCase().includes(s) ||
        g.id.toLowerCase().includes(s) ||
        g.locations.some((l) => l.companyName.toLowerCase().includes(s)),
    )
  }, [groups, q])

  const createGroup = async () => {
    if (!draft.companyName.trim() || !draft.email.trim()) return
    setCreating(true)
    setLastPassword(null)
    setEmailNote(null)
    try {
      const res = await fetch("/api/admin/group-clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createGroup",
          companyName: draft.companyName.trim(),
          email: draft.email.trim(),
          password: draft.password.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (data?.success) {
        if (data.generatedPassword) setLastPassword(data.generatedPassword)
        setEmailNote(
          data.welcomeEmailQueued
            ? `Welcome email queued to ${draft.email.trim()} (Group Portal Welcome template).`
            : "Group created. Welcome email was not queued.",
        )
        setDraft({ companyName: "", email: "", password: "" })
        await load()
      } else {
        alert(data?.error || "Failed to create group")
      }
    } finally {
      setCreating(false)
    }
  }

  const resendWelcome = async (groupId: string) => {
    setResending(true)
    setEmailNote(null)
    try {
      const res = await fetch("/api/admin/group-clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resendWelcome", groupId }),
      })
      const data = await res.json()
      if (data?.success) {
        if (data.generatedPassword) setLastPassword(data.generatedPassword)
        setEmailNote("Credentials email resent using Group Portal Welcome template. Password was rotated.")
      } else {
        alert(data?.error || "Failed to resend email")
      }
    } finally {
      setResending(false)
    }
  }

  const addLocation = async (groupId: string, customerId: string) => {
    if (!customerId) return
    setLinking(true)
    try {
      const res = await fetch("/api/admin/group-clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addLocation", groupId, customerId }),
      })
      const data = await res.json()
      if (data?.success) {
        setPickCustomerId("")
        await load()
        if (selected?.id === groupId) {
          setSelected((s) => (s ? { ...s, locations: data.locations } : s))
        }
      } else {
        alert(data?.error || "Failed to add location")
      }
    } finally {
      setLinking(false)
    }
  }

  const removeLocation = async (groupId: string, customerId: string) => {
    setLinking(true)
    try {
      const res = await fetch("/api/admin/group-clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "removeLocation", groupId, customerId }),
      })
      const data = await res.json()
      if (data?.success) {
        await load()
        if (selected?.id === groupId) {
          setSelected((s) => (s ? { ...s, locations: data.locations } : s))
        }
      } else {
        alert(data?.error || "Failed to remove location")
      }
    } finally {
      setLinking(false)
    }
  }

  const sheetAvailable = available.filter(
    (c) => !selected?.locations.some((l) => l.id === c.id),
  )

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={<Users className="h-6 w-6 text-primary" />}
        title="Group Clients"
        description="Create group logins and link location customers — group users see all locations in one portal"
        search={
          <AdminSearchInput value={q} onChange={setQ} placeholder="Search group or location..." />
        }
      />

      <Card className="glass border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4" />
            Create group client
          </CardTitle>
          <CardDescription>
            Group login credentials are emailed automatically via the Group Portal Welcome template.
            Leave password blank to auto-generate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Group / brand name</Label>
              <Input
                value={draft.companyName}
                onChange={(e) => setDraft((d) => ({ ...d, companyName: e.target.value }))}
                placeholder="e.g. Adani Group"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Login email</Label>
              <Input
                type="email"
                value={draft.email}
                onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                placeholder="group@company.com"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Password (optional)</Label>
              <Input
                type="text"
                value={draft.password}
                onChange={(e) => setDraft((d) => ({ ...d, password: e.target.value }))}
                placeholder="Auto-generated if empty"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={createGroup}
              disabled={creating || !draft.companyName.trim() || !draft.email.trim()}
              className="rounded-lg bg-[#1B7339] hover:bg-[#145a2c]"
            >
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Create group
            </Button>
            <Button variant="outline" onClick={load} disabled={loading}>
              Refresh
            </Button>
          </div>
          {lastPassword && (
            <p className="rounded-lg border border-[#C8E6C9] bg-[#E8F5E9] px-3 py-2 text-[13px] text-[#1B7339]">
              Temporary password: <strong>{lastPassword}</strong> — also emailed to the group admin.
            </p>
          )}
          {emailNote && (
            <p className="rounded-lg border border-[#DCE8DC] bg-[#F7FBF7] px-3 py-2 text-[13px] text-[#1B7339]">
              {emailNote}
            </p>
          )}
        </CardContent>
      </Card>

      <AdminListCard
        title="Group accounts"
        description="Click a row to manage locations"
        count={filtered.length}
        loading={loading}
        isEmpty={filtered.length === 0}
        emptyMessage="No group clients yet. Create one above."
      >
        {filtered.map((row) => (
          <AdminListRow key={row.id} onClick={() => setSelected(row)}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">{row.companyName}</p>
                  <Badge variant="outline" className="border-[#C8E6C9] bg-[#E8F5E9] text-[#1B7339]">
                    Group
                  </Badge>
                  <Badge variant="outline" className="bg-muted/30">
                    {row.id}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{row.email}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">{row.locations.length}</p>
                <p className="text-xs text-muted-foreground">locations linked</p>
              </div>
            </div>
          </AdminListRow>
        ))}
      </AdminListCard>

      <AdminDetailSheet
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        title={selected?.companyName || ""}
        description={selected ? `${selected.id} · group sheet` : undefined}
      >
        {selected && (
          <>
            <AdminSheetSection title="Group login">
              <AdminSheetField label="Group ID" value={selected.id} />
              <AdminSheetField label="Email" value={selected.email} />
              <Button
                variant="outline"
                disabled={resending}
                onClick={() => resendWelcome(selected.id)}
                className="w-full rounded-lg border-[#DCE8DC] text-[#1B7339] hover:bg-[#E8F5E9]"
              >
                {resending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                Email credentials (welcome template)
              </Button>
              <p className="text-[11px] text-muted-foreground">
                Resends the Group Portal Welcome template and rotates the temporary password.
              </p>
            </AdminSheetSection>

            <AdminSheetSection title="Add location from customer sheet">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select value={pickCustomerId} onValueChange={setPickCustomerId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select customer location..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sheetAvailable.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.companyName} ({c.id})
                        {c.city ? ` · ${c.city}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  disabled={linking || !pickCustomerId}
                  onClick={() => addLocation(selected.id, pickCustomerId)}
                  className="shrink-0 rounded-lg bg-[#1B7339] hover:bg-[#145a2c]"
                >
                  {linking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Pick any standalone customer — they appear in the group portal with location-wise filters.
              </p>
            </AdminSheetSection>

            <AdminSheetSection title="Linked locations">
              {selected.locations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No locations linked yet.</p>
              ) : (
                selected.locations.map((loc) => (
                  <div
                    key={loc.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-[#E2EBE4] px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-[13px] font-semibold">
                        <Building2 className="h-3.5 w-3.5 text-[#1B7339]" />
                        {loc.companyName}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {loc.id}
                        {loc.city || loc.state ? ` · ${[loc.city, loc.state].filter(Boolean).join(", ")}` : ""}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={linking}
                      onClick={() => removeLocation(selected.id, loc.id)}
                      className="shrink-0 text-[#C62828] hover:bg-[#FFEBEE]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </AdminSheetSection>
          </>
        )}
      </AdminDetailSheet>
    </div>
  )
}
