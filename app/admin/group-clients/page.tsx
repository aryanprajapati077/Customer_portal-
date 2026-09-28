"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Building2, Loader2, Mail, Plus, Search, Trash2, Users, UserRound } from "lucide-react"
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
import { PocEmailStatusControls } from "@/components/admin/poc-email-status-controls"
import {
  defaultEmailEnabled,
  defaultPocStatus,
  emptyCollectionPocForm,
  parseCollectionPocForms,
  type CollectionPocForm,
  type PocStatus,
} from "@/lib/poc-config"
import { cn } from "@/lib/utils"

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
  primaryPocName?: string | null
  primaryPocEmail?: string | null
  primaryPocNumber?: string | null
  primaryPocDesignation?: string | null
  primaryPocEmailEnabled?: boolean | null
  primaryPocStatus?: string | null
  collectionPocs?: string | null
  welcomeEmailSentAt?: string | null
  locations: GroupLocation[]
}

type AvailableCustomer = {
  id: string
  companyName: string
  city: string | null
  state: string | null
  email: string
}

type SheetTab = "locations" | "pocs" | "login"

export default function AdminGroupClientsPage() {
  const [groups, setGroups] = useState<GroupRow[]>([])
  const [available, setAvailable] = useState<AvailableCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [creating, setCreating] = useState(false)
  const [linking, setLinking] = useState(false)
  const [savingPocs, setSavingPocs] = useState(false)
  const [selected, setSelected] = useState<GroupRow | null>(null)
  const [sheetTab, setSheetTab] = useState<SheetTab>("locations")
  const [pickCustomerId, setPickCustomerId] = useState("")
  const [locationSearch, setLocationSearch] = useState("")
  const [draft, setDraft] = useState({
    companyName: "",
    primaryPocName: "",
    primaryPocEmail: "",
    primaryPocNumber: "",
    password: "",
  })
  const [lastPassword, setLastPassword] = useState<string | null>(null)
  const [emailNote, setEmailNote] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [pocOk, setPocOk] = useState(false)
  const [pocError, setPocError] = useState<string | null>(null)

  const [pocDraft, setPocDraft] = useState({
    companyName: "",
    primaryPocName: "",
    primaryPocEmail: "",
    primaryPocNumber: "",
    primaryPocDesignation: "",
    primaryPocEmailEnabled: true,
    primaryPocStatus: "Active" as PocStatus,
  })
  const [collectionPocs, setCollectionPocs] = useState<CollectionPocForm[]>([emptyCollectionPocForm()])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/group-clients")
      const data = await res.json()
      if (data?.success) {
        setGroups(data.groups || [])
        setAvailable(data.availableCustomers || [])
        if (selected?.id) {
          const next = (data.groups || []).find((g: GroupRow) => g.id === selected.id)
          if (next) setSelected(next)
        }
      }
    } finally {
      setLoading(false)
    }
  }, [selected?.id])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selected) return
    setPocDraft({
      companyName: selected.companyName || "",
      primaryPocName: selected.primaryPocName || "",
      primaryPocEmail: selected.primaryPocEmail || selected.email || "",
      primaryPocNumber: selected.primaryPocNumber || "",
      primaryPocDesignation: selected.primaryPocDesignation || "",
      primaryPocEmailEnabled: defaultEmailEnabled(selected.primaryPocEmailEnabled),
      primaryPocStatus: defaultPocStatus(selected.primaryPocStatus),
    })
    setCollectionPocs(parseCollectionPocForms(selected.collectionPocs))
    setPocOk(false)
    setPocError(null)
    setSheetTab("locations")
    setPickCustomerId("")
    setLocationSearch("")
  }, [selected?.id])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return groups
    return groups.filter(
      (g) =>
        g.companyName.toLowerCase().includes(s) ||
        g.email.toLowerCase().includes(s) ||
        g.id.toLowerCase().includes(s) ||
        (g.primaryPocName || "").toLowerCase().includes(s) ||
        (g.primaryPocEmail || "").toLowerCase().includes(s) ||
        g.locations.some((l) => l.companyName.toLowerCase().includes(s) || l.id.toLowerCase().includes(s)),
    )
  }, [groups, q])

  const sheetAvailable = useMemo(() => {
    const base = available.filter((c) => !selected?.locations.some((l) => l.id === c.id))
    const s = locationSearch.trim().toLowerCase()
    if (!s) return base
    return base.filter(
      (c) =>
        c.id.toLowerCase().includes(s) ||
        c.companyName.toLowerCase().includes(s) ||
        (c.city || "").toLowerCase().includes(s) ||
        (c.email || "").toLowerCase().includes(s),
    )
  }, [available, selected?.locations, locationSearch])

  const createGroup = async () => {
    if (!draft.companyName.trim() || !draft.primaryPocEmail.trim()) return
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
          email: draft.primaryPocEmail.trim(),
          primaryPocName: draft.primaryPocName.trim(),
          primaryPocEmail: draft.primaryPocEmail.trim(),
          primaryPocNumber: draft.primaryPocNumber.trim(),
          password: draft.password.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (data?.success) {
        if (data.generatedPassword) setLastPassword(data.generatedPassword)
        setEmailNote(
          "Group created. No welcome email was sent yet — open the group sheet and use Send welcome after POCs are set.",
        )
        setDraft({ companyName: "", primaryPocName: "", primaryPocEmail: "", primaryPocNumber: "", password: "" })
        await load()
        if (data.group) {
          setSelected(data.group)
          setSheetTab("pocs")
        }
      } else {
        alert(data?.error || "Failed to create group")
      }
    } finally {
      setCreating(false)
    }
  }

  const sendWelcome = async (group: GroupRow, forceResend = false) => {
    const alreadySent = Boolean(group.welcomeEmailSentAt)
    const action = forceResend || alreadySent ? "Resend" : "Send"
    if (
      !confirm(
        `${action} group welcome email for ${group.companyName}?\n\nTo: primary POC\nCC: collection POCs\nA new temporary password will be set.`,
      )
    ) {
      return
    }
    setResending(true)
    setEmailNote(null)
    try {
      const res = await fetch("/api/admin/group-clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sendWelcome",
          groupId: group.id,
          forceResend: forceResend || alreadySent,
        }),
      })
      const data = await res.json()
      if (data?.success) {
        if (data.generatedPassword) setLastPassword(data.generatedPassword)
        const sentAt = data.welcomeEmailSentAt || new Date().toISOString()
        setSelected((prev) =>
          prev?.id === group.id ? { ...prev, welcomeEmailSentAt: sentAt } : prev,
        )
        setGroups((prev) =>
          prev.map((g) => (g.id === group.id ? { ...g, welcomeEmailSentAt: sentAt } : g)),
        )
        setEmailNote(
          data.message ||
            `Welcome queued to ${data.to || "primary POC"}${
              Array.isArray(data.cc) && data.cc.length ? ` (CC: ${data.cc.join(", ")})` : ""
            }.`,
        )
      } else if (data?.alreadySent) {
        if (confirm("Welcome already sent. Resend with a new password?")) {
          await sendWelcome(group, true)
        }
      } else {
        alert(data?.error || "Failed to send welcome email")
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

  const savePocs = async () => {
    if (!selected) return
    setSavingPocs(true)
    setPocOk(false)
    setPocError(null)
    try {
      const cleaned = collectionPocs
        .map((p) => ({
          name: p.name.trim(),
          email: p.email.trim().toLowerCase(),
          number: p.number.trim(),
          designation: p.designation.trim(),
          emailEnabled: p.emailEnabled,
          status: p.status,
        }))
        .filter((p) => p.name || p.email || p.number)

      const res = await fetch("/api/admin/group-clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updatePocs",
          groupId: selected.id,
          companyName: pocDraft.companyName.trim(),
          primaryPocName: pocDraft.primaryPocName.trim(),
          primaryPocEmail: pocDraft.primaryPocEmail.trim(),
          primaryPocNumber: pocDraft.primaryPocNumber.trim(),
          primaryPocDesignation: pocDraft.primaryPocDesignation.trim(),
          primaryPocEmailEnabled: pocDraft.primaryPocEmailEnabled,
          primaryPocStatus: pocDraft.primaryPocStatus,
          collectionPocs: cleaned,
        }),
      })
      const data = await res.json()
      if (!data?.success) {
        setPocError(data?.error || "Failed to save POCs")
        return
      }
      setPocOk(true)
      if (data.group) {
        setSelected(data.group)
        setGroups((prev) => prev.map((g) => (g.id === data.group.id ? data.group : g)))
      } else {
        await load()
      }
    } catch {
      setPocError("Network error while saving POCs")
    } finally {
      setSavingPocs(false)
    }
  }

  const deleteGroup = async (group: GroupRow) => {
    if (
      !confirm(
        `Delete group ${group.id} (${group.companyName})?\n\nLinked locations will be unlinked (not deleted).`,
      )
    ) {
      return
    }
    const res = await fetch("/api/admin/group-clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteGroup", groupId: group.id }),
    })
    const data = await res.json()
    if (!data?.success) {
      alert(data?.error || "Failed to delete group")
      return
    }
    setSelected(null)
    await load()
  }

  const updateCollectionPoc = (index: number, patch: Partial<CollectionPocForm>) => {
    setCollectionPocs((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)))
  }

  const pocCount = (g: GroupRow) => {
    const primary = g.primaryPocName || g.primaryPocEmail ? 1 : 0
    let extra = 0
    try {
      const parsed = g.collectionPocs ? JSON.parse(g.collectionPocs) : []
      if (Array.isArray(parsed)) extra = parsed.filter((p) => p?.name || p?.email || p?.number).length
    } catch {
      extra = 0
    }
    return primary + extra
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={<Users className="h-6 w-6 text-primary" />}
        title="Group Clients"
        description="Create a group login, add primary + collection POCs, then link location customers."
        search={
          <AdminSearchInput value={q} onChange={setQ} placeholder="Search group, POC, or location…" />
        }
      />

      <Card className="border-[#E5E5E5] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4 text-[#1B7339]" />
            Create group client
          </CardTitle>
          <CardDescription>
            Primary POC email becomes the group portal login. Welcome email is not sent
            automatically — use Send welcome after you add POCs (To = primary, CC = other POCs).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-[12px]">Group / brand name *</Label>
              <Input
                value={draft.companyName}
                onChange={(e) => setDraft((d) => ({ ...d, companyName: e.target.value }))}
                placeholder="e.g. Adani Group"
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px]">Primary POC name</Label>
              <Input
                value={draft.primaryPocName}
                onChange={(e) => setDraft((d) => ({ ...d, primaryPocName: e.target.value }))}
                placeholder="Contact person"
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px]">Primary POC email (login) *</Label>
              <Input
                type="email"
                value={draft.primaryPocEmail}
                onChange={(e) => setDraft((d) => ({ ...d, primaryPocEmail: e.target.value }))}
                placeholder="group@company.com"
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px]">Primary POC mobile</Label>
              <Input
                value={draft.primaryPocNumber}
                onChange={(e) => setDraft((d) => ({ ...d, primaryPocNumber: e.target.value }))}
                placeholder="+91 …"
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px]">Password (optional)</Label>
              <Input
                type="text"
                value={draft.password}
                onChange={(e) => setDraft((d) => ({ ...d, password: e.target.value }))}
                placeholder="Auto-generated if empty"
                className="h-10 rounded-xl"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={createGroup}
              disabled={creating || !draft.companyName.trim() || !draft.primaryPocEmail.trim()}
              className="rounded-full bg-[#1B7339] hover:bg-[#145a2c]"
            >
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Create group
            </Button>
            <Button variant="outline" onClick={load} disabled={loading} className="rounded-full">
              Refresh
            </Button>
          </div>
          {lastPassword && (
            <p className="rounded-xl border border-[#C8E6C9] bg-[#E8F5E9] px-3 py-2 text-[13px] text-[#1B7339]">
              Temporary password: <strong>{lastPassword}</strong> — also emailed to the primary POC.
            </p>
          )}
          {emailNote && (
            <p className="rounded-xl border border-[#DCE8DC] bg-[#F7FBF7] px-3 py-2 text-[13px] text-[#1B7339]">
              {emailNote}
            </p>
          )}
        </CardContent>
      </Card>

      <AdminListCard
        title="Group accounts"
        description="Open a group to manage locations and POCs"
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
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {row.primaryPocName ? `${row.primaryPocName} · ` : ""}
                  {row.primaryPocEmail || row.email}
                </p>
              </div>
              <div className="flex items-center gap-4 text-right">
                <div>
                  <p className="text-lg font-bold text-foreground">{row.locations.length}</p>
                  <p className="text-[11px] text-muted-foreground">locations</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#1B7339]">{pocCount(row)}</p>
                  <p className="text-[11px] text-muted-foreground">POCs</p>
                </div>
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
            <div className="flex gap-1 rounded-xl border border-[#E8E6E1] bg-[#F7F7F5] p-1">
              {(
                [
                  { id: "locations", label: "Locations" },
                  { id: "pocs", label: "POCs" },
                  { id: "login", label: "Login" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSheetTab(tab.id)}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-2 text-[12px] font-semibold transition",
                    sheetTab === tab.id
                      ? "bg-white text-[#1B7339] shadow-sm"
                      : "text-[#6B6B6B] hover:text-[#141414]",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {sheetTab === "locations" && (
              <>
                <AdminSheetSection title="Add location">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8A8A8A]" />
                    <Input
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      placeholder="Search customers to link…"
                      className="mb-2 h-9 rounded-lg pl-8"
                    />
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Select value={pickCustomerId || undefined} onValueChange={setPickCustomerId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select customer location…" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {sheetAvailable.length === 0 ? (
                          <div className="px-3 py-4 text-center text-[12px] text-[#6B6B6B]">
                            No available customers
                          </div>
                        ) : (
                          sheetAvailable.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.companyName} ({c.id})
                              {c.city ? ` · ${c.city}` : ""}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      disabled={linking || !pickCustomerId}
                      onClick={() => addLocation(selected.id, pickCustomerId)}
                      className="shrink-0 rounded-full bg-[#1B7339] hover:bg-[#145a2c]"
                    >
                      {linking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                    </Button>
                  </div>
                </AdminSheetSection>

                <AdminSheetSection title={`Linked locations (${selected.locations.length})`}>
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
                            {loc.city || loc.state
                              ? ` · ${[loc.city, loc.state].filter(Boolean).join(", ")}`
                              : ""}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={linking}
                          onClick={() => removeLocation(selected.id, loc.id)}
                          className="shrink-0 rounded-full text-[#C62828] hover:bg-[#FFEBEE]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </AdminSheetSection>
              </>
            )}

            {sheetTab === "pocs" && (
              <>
                <AdminSheetSection title="Group name">
                  <Input
                    value={pocDraft.companyName}
                    onChange={(e) => setPocDraft((d) => ({ ...d, companyName: e.target.value }))}
                    className="h-9 rounded-lg"
                  />
                </AdminSheetSection>

                <AdminSheetSection title="Primary POC">
                  <p className="mb-2 text-[11px] text-muted-foreground">
                    Primary POC email is the group portal login.
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-[11px]">Name</Label>
                      <Input
                        value={pocDraft.primaryPocName}
                        onChange={(e) => setPocDraft((d) => ({ ...d, primaryPocName: e.target.value }))}
                        className="h-9 rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Email (login)</Label>
                      <Input
                        type="email"
                        value={pocDraft.primaryPocEmail}
                        onChange={(e) =>
                          setPocDraft((d) => ({ ...d, primaryPocEmail: e.target.value }))
                        }
                        className="h-9 rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Mobile</Label>
                      <Input
                        value={pocDraft.primaryPocNumber}
                        onChange={(e) =>
                          setPocDraft((d) => ({ ...d, primaryPocNumber: e.target.value }))
                        }
                        className="h-9 rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Designation</Label>
                      <Input
                        value={pocDraft.primaryPocDesignation}
                        onChange={(e) =>
                          setPocDraft((d) => ({ ...d, primaryPocDesignation: e.target.value }))
                        }
                        className="h-9 rounded-lg"
                      />
                    </div>
                    <PocEmailStatusControls
                      emailEnabled={pocDraft.primaryPocEmailEnabled}
                      status={pocDraft.primaryPocStatus}
                      onEmailEnabledChange={(value) =>
                        setPocDraft((d) => ({ ...d, primaryPocEmailEnabled: value }))
                      }
                      onStatusChange={(value) =>
                        setPocDraft((d) => ({ ...d, primaryPocStatus: value }))
                      }
                    />
                  </div>
                </AdminSheetSection>

                <AdminSheetSection title="Collection POCs">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground">
                      Extra contacts for the group (same as customer collection POCs).
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-full"
                      onClick={() => setCollectionPocs((prev) => [...prev, emptyCollectionPocForm()])}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Add POC
                    </Button>
                  </div>

                  {collectionPocs.map((poc, index) => (
                    <div
                      key={index}
                      className="mb-3 space-y-2 rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] p-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1B7339]">
                          <UserRound className="h-3.5 w-3.5" />
                          Collection POC {index + 1}
                        </p>
                        {collectionPocs.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 text-red-600 hover:text-red-700"
                            onClick={() =>
                              setCollectionPocs((prev) => prev.filter((_, i) => i !== index))
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input
                          placeholder="Name"
                          value={poc.name}
                          onChange={(e) => updateCollectionPoc(index, { name: e.target.value })}
                          className="h-9 rounded-lg bg-white"
                        />
                        <Input
                          placeholder="Email"
                          type="email"
                          value={poc.email}
                          onChange={(e) => updateCollectionPoc(index, { email: e.target.value })}
                          className="h-9 rounded-lg bg-white"
                        />
                        <Input
                          placeholder="Mobile"
                          value={poc.number}
                          onChange={(e) => updateCollectionPoc(index, { number: e.target.value })}
                          className="h-9 rounded-lg bg-white"
                        />
                        <Input
                          placeholder="Designation"
                          value={poc.designation}
                          onChange={(e) =>
                            updateCollectionPoc(index, { designation: e.target.value })
                          }
                          className="h-9 rounded-lg bg-white"
                        />
                        <PocEmailStatusControls
                          compact
                          emailEnabled={poc.emailEnabled}
                          status={poc.status}
                          onEmailEnabledChange={(value) =>
                            updateCollectionPoc(index, { emailEnabled: value })
                          }
                          onStatusChange={(value) => updateCollectionPoc(index, { status: value })}
                        />
                      </div>
                    </div>
                  ))}
                </AdminSheetSection>

                {pocError && <p className="text-sm text-red-600">{pocError}</p>}
                {pocOk && <p className="text-sm text-[#1B7339]">POCs saved.</p>}
                <Button
                  onClick={savePocs}
                  disabled={savingPocs}
                  className="w-full rounded-full bg-[#1B7339] hover:bg-[#145a2c]"
                >
                  {savingPocs ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {savingPocs ? "Saving…" : "Save POC updates"}
                </Button>
              </>
            )}

            {sheetTab === "login" && (
              <>
                <AdminSheetSection title="Group login">
                  <AdminSheetField label="Group ID" value={selected.id} />
                  <AdminSheetField label="Login email" value={selected.email} />
                  <AdminSheetField
                    label="Primary POC"
                    value={
                      [selected.primaryPocName, selected.primaryPocEmail, selected.primaryPocNumber]
                        .filter(Boolean)
                        .join(" · ") || "—"
                    }
                  />
                  <p className="text-[12px] text-muted-foreground">
                    Welcome:{" "}
                    {selected.welcomeEmailSentAt
                      ? `Sent ${new Date(selected.welcomeEmailSentAt).toLocaleString("en-IN")}`
                      : "Not sent yet"}
                  </p>
                  <Button
                    disabled={resending}
                    onClick={() => sendWelcome(selected)}
                    className="w-full rounded-full bg-[#1B7339] hover:bg-[#145a2c]"
                  >
                    {resending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="mr-2 h-4 w-4" />
                    )}
                    {selected.welcomeEmailSentAt ? "Resend welcome" : "Send welcome"}
                  </Button>
                  <p className="text-[11px] text-muted-foreground">
                    To = Primary POC · CC = Collection POCs. Sets a new temporary password.
                  </p>
                  {emailNote && selected ? (
                    <p className="rounded-xl border border-[#DCE8DC] bg-[#F7FBF7] px-3 py-2 text-[12px] text-[#1B7339]">
                      {emailNote}
                    </p>
                  ) : null}
                  {lastPassword && (
                    <p className="rounded-xl border border-[#C8E6C9] bg-[#E8F5E9] px-3 py-2 text-[12px] text-[#1B7339]">
                      Temporary password: <strong>{lastPassword}</strong>
                    </p>
                  )}
                </AdminSheetSection>

                <AdminSheetSection title="Danger zone">
                  <Button
                    variant="outline"
                    onClick={() => deleteGroup(selected)}
                    className="w-full rounded-full border-[#F0D0D0] text-[#C62828] hover:bg-[#FFF5F5]"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete group
                  </Button>
                  <p className="text-[11px] text-muted-foreground">
                    Linked locations are only unlinked — customer records stay in the sheet.
                  </p>
                </AdminSheetSection>
              </>
            )}
          </>
        )}
      </AdminDetailSheet>
    </div>
  )
}
