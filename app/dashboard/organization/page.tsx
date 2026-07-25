"use client"

import type { ReactNode } from "react"
import { Building2, CalendarDays, User } from "lucide-react"
import { PortalShell } from "@/components/portal/portal-shell"
import { PageHeader } from "@/components/portal/page-header"
import { usePortalData } from "@/hooks/use-portal-data"
import { formatPortalDate } from "@/lib/portal-metrics"

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
}: {
  icon: typeof Building2
  title: string
  children: ReactNode
}) {
  return (
    <div className="portal-card p-5">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-8 h-8 rounded-full bg-[#E8F5E9] flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#1B7339]" />
        </div>
        <h2 className="text-[15px] font-semibold text-[#1A1A1A]">{title}</h2>
      </div>
      <div>{children}</div>
    </div>
  )
}

export default function OrganizationPage() {
  const { customer, authLoading, dataLoading } = usePortalData()
  const status = customer?.status === "Active" || !customer?.status ? "Running" : customer?.status

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
          <InfoRow label="GSTIN" value="—" />
          <InfoRow label="Industry" value={customer?.industry || "—"} />
          <InfoRow label="Head Office Address" value={customer?.address || "—"} last />
        </SectionCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard icon={User} title="Primary Contact">
            <InfoRow label="Contact Person" value={customer?.contactPerson || "—"} />
            <InfoRow label="Email Address" value={customer?.email || "—"} />
            <InfoRow label="Phone Number" value={customer?.phone || "—"} last />
          </SectionCard>

          <SectionCard icon={CalendarDays} title="Service Details">
            <InfoRow
              label="Service Start Date"
              value={formatPortalDate(customer?.joinDate) === "—" ? "—" : formatPortalDate(customer?.joinDate)}
            />
            <InfoRow
              label="Service Status"
              value={
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F5E9] text-[#1B7339] text-[12px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1B7339]" />
                  {status}
                </span>
              }
            />
            <InfoRow label="Collection Frequency" value="Fortnightly" />
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
