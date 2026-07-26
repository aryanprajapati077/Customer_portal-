"use client"

import { useEffect, useState, type ReactNode } from "react"
import { Building2, CalendarDays, Loader2, Plus, Trash2, User } from "lucide-react"
import { PortalShell } from "@/components/portal/portal-shell"
import { PageHeader } from "@/components/portal/page-header"
import { usePortalData } from "@/hooks/use-portal-data"
import { formatPortalDate } from "@/lib/portal-metrics"
import {
  SERVICE_STATUS,
  normalizeServiceStatus,
} from "@/lib/service-status"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function InfoRow({ label, value, last }: { label: string; value: ReactNode; last?: boolean }) {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-1 sm:gap-4 py-3.5 ${
        last ? "" : "border-b border-[#F0F0F0]"
      }`}
    >
      <span className="text-[13px] text-[#7A7A7A]">{label}</span>
      <span className="text-[13px] font-medium text-[#1A1A1A]">{value}</span>
    </div>
  )
}

function SectionCard({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: typeof Building2
  title: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="portal-card p-5">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#E8F5E9] flex items-center justify-center">
            <Icon className="w-4 h-4 text-[#1B7339]" />
          </div>
          <h2 className="text-[15px] font-semibold text-[#1A1A1A]">{title}</h2>
        </div>
        {action}
      </div>
      <div>{children}</div>
    </div>
  )
}

type PortalUserRow = {
  id: string
  name: string
  email: string
  createdAt?: string
}

export default function OrganizationPage() {
  const { customer, authLoading, dataLoading } = usePortalData()
  const statusCode = normalizeServiceStatus(
    (customer as { serviceStatus?: string } | null)?.serviceStatus || customer?.status,
  )
  const statusMeta = SERVICE_STATUS[statusCode]
  const [users, setUsers] = useState<PortalUserRow[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", password: "" })
  const [error, setError] = useState("")

  const loadUsers = async () => {
    setUsersLoading(true)
    try {
      const res = await fetch("/api/customer/portal-users")
      const data = await res.json()
      if (data?.success) setUsers(data.users || [])
    } finally {
      setUsersLoading(false)
    }
  }

  useEffect(() => {
    if (customer?.id) loadUsers()
  }, [customer?.id])

  const addUser = async () => {
    setError("")
    if (!form.email.trim() || form.password.length < 6) {
      setError("Email and password (min 6 characters) are required.")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/customer/portal-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!data?.success) {
        setError(data?.error || "Could not add user")
        return
      }
      setForm({ name: "", email: "", password: "" })
      setShowAdd(false)
      await loadUsers()
    } finally {
      setSaving(false)
    }
  }

  const removeUser = async (id: string) => {
    if (!confirm("Remove this user's dashboard access?")) return
    await fetch(`/api/customer/portal-users?id=${id}`, { method: "DELETE" })
    await loadUsers()
  }

  const actionHref =
    statusMeta.action === "contact"
      ? "mailto:support@buffindia.com"
      : statusMeta.action === "pay"
        ? "mailto:support@buffindia.com?subject=Payment%20pending"
        : "mailto:support@buffindia.com?subject=Service%20renewal"

  return (
    <PortalShell customer={customer} loading={authLoading || (!customer && dataLoading)}>
      <div className="space-y-5">
        <PageHeader
          icon={Building2}
          title="Organization"
          subtitle="View your organization and service information."
        />

        <SectionCard icon={Building2} title="Organization Details">
          <InfoRow label="Organization Name" value={customer?.companyName || "—"} />
          <InfoRow label="GSTIN" value={(customer as { gstin?: string } | null)?.gstin || "—"} />
          <InfoRow label="Industry" value={customer?.industry || "—"} />
          <InfoRow label="Head Office Address" value={customer?.address || "—"} last />
        </SectionCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard
            icon={User}
            title="Primary Contact"
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-[12px]"
                onClick={() => setShowAdd((v) => !v)}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add user
              </Button>
            }
          >
            <InfoRow label="Contact Person" value={customer?.contactPerson || "—"} />
            <InfoRow label="Email Address" value={customer?.email || "—"} />
            <InfoRow label="Phone Number" value={customer?.phone || "—"} last={!showAdd && users.length === 0} />

            {showAdd && (
              <div className="mt-4 rounded-xl border border-[#E8E8E8] bg-[#F8FBF8] p-3 space-y-2.5">
                <p className="text-[12px] font-semibold text-[#1A1A1A]">
                  Grant dashboard access (Main POC)
                </p>
                <div className="grid grid-cols-1 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Name</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Email</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Password</Label>
                    <Input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      className="h-9"
                    />
                  </div>
                </div>
                {error && <p className="text-[12px] text-red-600">{error}</p>}
                <Button
                  type="button"
                  onClick={addUser}
                  disabled={saving}
                  className="h-9 bg-[#1B7339] hover:bg-[#145a2c]"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create access"}
                </Button>
              </div>
            )}

            {(usersLoading || users.length > 0) && (
              <div className="mt-4 space-y-2">
                <p className="text-[12px] font-semibold text-[#4A4A4A]">Dashboard users</p>
                {usersLoading ? (
                  <p className="text-[12px] text-[#8A8A8A]">Loading…</p>
                ) : (
                  users.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-[#F0F0F0] px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-[#1A1A1A] truncate">
                          {u.name || "User"}
                        </p>
                        <p className="text-[11px] text-[#7A7A7A] truncate">{u.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeUser(u.id)}
                        className="p-1.5 rounded-md text-[#C62828] hover:bg-[#FFEBEE]"
                        aria-label="Remove user"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </SectionCard>

          <SectionCard icon={CalendarDays} title="Service Details">
            <InfoRow
              label="Service Start Date"
              value={
                formatPortalDate(customer?.joinDate) === "—"
                  ? "—"
                  : formatPortalDate(customer?.joinDate)
              }
            />
            <InfoRow
              label="Service Status"
              value={
                <span className="inline-flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold ${statusMeta.badgeClass}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`} />
                    {statusMeta.label}
                  </span>
                  {statusMeta.action && statusMeta.actionLabel && (
                    <a
                      href={actionHref}
                      className="inline-flex h-7 items-center rounded-full border border-[#D8D8D8] px-2.5 text-[11px] font-semibold text-[#1A1A1A] hover:border-[#1B7339] hover:text-[#1B7339]"
                    >
                      {statusMeta.actionLabel}
                    </a>
                  )}
                </span>
              }
            />
            <InfoRow
              label="Collection Frequency"
              value={(customer as { collectionFrequency?: string } | null)?.collectionFrequency || "Fortnightly"}
            />
            <InfoRow
              label="Number of Kiosks Installed"
              value={String(customer?.disposalUnitInstalled ?? 0)}
            />
            <InfoRow label="Kiosk Type" value="Wall-mounted + Floor-standing" last />
          </SectionCard>
        </div>
      </div>
    </PortalShell>
  )
}
