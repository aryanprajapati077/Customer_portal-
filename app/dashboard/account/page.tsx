"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import {
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  Headphones,
  Lock,
  Mail,
  Pencil,
  Shield,
  User,
  Bell,
  Zap,
} from "lucide-react"
import { PortalShell } from "@/components/portal/portal-shell"
import { PageHeader } from "@/components/portal/page-header"
import { usePortalData } from "@/hooks/use-portal-data"
import { Switch } from "@/components/ui/switch"
import { firstName } from "@/lib/portal-metrics"

function AccountCard({
  icon: Icon,
  title,
  action,
  children,
}: {
  icon: typeof User
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="portal-card p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#E8F5E9] flex items-center justify-center">
            <Icon className="w-4 h-4 text-[#1B7339]" />
          </div>
          <h2 className="text-[15px] font-semibold text-[#1A1A1A]">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

export default function AccountPage() {
  const { customer, authLoading, dataLoading } = usePortalData()
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [supportNotifs, setSupportNotifs] = useState(true)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      setPasswordMsg("New password must be at least 6 characters.")
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg("New passwords do not match.")
      return
    }
    setPasswordMsg("Password update request received. Please use Forgot Password if you need a reset.")
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  return (
    <PortalShell customer={customer} loading={authLoading || (!customer && dataLoading)}>
      <div className="space-y-5">
        <PageHeader
          icon={User}
          title="Account"
          subtitle="Manage your profile and account settings."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AccountCard
            icon={User}
            title="Profile Information"
            action={
              <button type="button" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1B7339]">
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
            }
          >
            {[
              { label: "Name", value: customer?.contactPerson || firstName(customer?.contactPerson) },
              { label: "Email", value: customer?.email },
              { label: "Role", value: customer?.isGroup ? "Group Admin" : "Admin" },
              { label: "Phone", value: customer?.phone || "—" },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                className={`flex items-center justify-between py-3 ${
                  i < arr.length - 1 ? "border-b border-[#F0F0F0]" : ""
                }`}
              >
                <span className="text-[13px] text-[#7A7A7A]">{row.label}</span>
                <span className="text-[13px] font-medium text-[#1A1A1A]">{row.value}</span>
              </div>
            ))}
          </AccountCard>

          <AccountCard icon={Lock} title="Change Password">
            <form onSubmit={handlePasswordUpdate} className="space-y-3">
              {[
                {
                  label: "Current Password",
                  value: currentPassword,
                  set: setCurrentPassword,
                  show: showCurrent,
                  toggle: () => setShowCurrent((v) => !v),
                },
                {
                  label: "New Password",
                  value: newPassword,
                  set: setNewPassword,
                  show: showNew,
                  toggle: () => setShowNew((v) => !v),
                },
                {
                  label: "Confirm New Password",
                  value: confirmPassword,
                  set: setConfirmPassword,
                  show: showConfirm,
                  toggle: () => setShowConfirm((v) => !v),
                },
              ].map((field) => (
                <div key={field.label} className="relative">
                  <input
                    type={field.show ? "text" : "password"}
                    value={field.value}
                    onChange={(e) => field.set(e.target.value)}
                    placeholder={field.label}
                    className="w-full h-10 rounded-lg border border-[#D8D8D8] bg-white px-3 pr-10 text-[13px]"
                  />
                  <button
                    type="button"
                    onClick={field.toggle}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]"
                  >
                    {field.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              ))}
              {passwordMsg && <p className="text-[12px] text-[#1B7339]">{passwordMsg}</p>}
              <button
                type="submit"
                className="w-full h-11 rounded-lg bg-[#1B7339] text-white text-[14px] font-semibold hover:bg-[#145a2c]"
              >
                Update Password
              </button>
            </form>
          </AccountCard>

          <AccountCard icon={Bell} title="Notifications">
            {[
              {
                title: "Email Notifications",
                desc: "Receive updates about collections, reports and support",
                value: emailNotifs,
                set: setEmailNotifs,
              },
              {
                title: "Support Updates",
                desc: "Get notified about your support tickets",
                value: supportNotifs,
                set: setSupportNotifs,
              },
            ].map((row, i, arr) => (
              <div
                key={row.title}
                className={`flex items-center justify-between gap-4 py-3.5 ${
                  i < arr.length - 1 ? "border-b border-[#F0F0F0]" : ""
                }`}
              >
                <div>
                  <p className="text-[13px] font-medium text-[#1A1A1A]">{row.title}</p>
                  <p className="text-[12px] text-[#8A8A8A] mt-0.5">{row.desc}</p>
                </div>
                <Switch
                  checked={row.value}
                  onCheckedChange={row.set}
                  className="data-[state=checked]:bg-[#1B7339]"
                />
              </div>
            ))}
          </AccountCard>

          <AccountCard icon={Zap} title="Quick Actions">
            {[
              { icon: Headphones, label: "View Support Tickets", href: "/dashboard/support" },
              { icon: Mail, label: "Contact BuffIndia", href: "/dashboard/support" },
              { icon: Shield, label: "Privacy Policy", href: "/privacy-policy" },
              { icon: FileText, label: "Terms & Conditions", href: "/terms-of-service" },
            ].map((row, i, arr) => (
              <Link
                key={row.label}
                href={row.href}
                className={`flex items-center gap-3 py-3.5 hover:bg-[#FAFAFA] -mx-2 px-2 rounded-lg ${
                  i < arr.length - 1 ? "border-b border-[#F0F0F0]" : ""
                }`}
              >
                <row.icon className="w-4 h-4 text-[#1B7339]" />
                <span className="flex-1 text-[13px] font-medium text-[#1A1A1A]">{row.label}</span>
                <ChevronRight className="w-4 h-4 text-[#B0B0B0]" />
              </Link>
            ))}
          </AccountCard>
        </div>
      </div>
    </PortalShell>
  )
}
