"use client"

import { useEffect, useState } from "react"
import { Bell, CheckCheck, Loader2 } from "lucide-react"
import { PortalShell } from "@/components/portal/portal-shell"
import { PageHeader } from "@/components/portal/page-header"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

type NotificationItem = {
  id: string
  title: string
  body: string | null
  createdAt: string
  readAt: string | null
}

export default function NotificationsPage() {
  const { customer, isLoading: authLoading } = useAuth()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)

  const load = async () => {
    if (!customer?.id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/notifications?customerId=${customer.id}&limit=100`)
      const data = await res.json()
      if (data?.success) setNotifications(data.notifications || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.id])

  const markAllRead = async () => {
    if (!customer?.id) return
    setMarking(true)
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: customer.id, markAllRead: true }),
      })
      await load()
    } finally {
      setMarking(false)
    }
  }

  return (
    <PortalShell customer={customer} loading={authLoading || (!customer && loading)}>
      <div className="space-y-5">
        <PageHeader
          icon={Bell}
          title="Notifications"
          subtitle="All updates for your account — reports, certificates, orders, and more."
          actions={
            <button
              type="button"
              onClick={markAllRead}
              disabled={marking || notifications.every((n) => n.readAt)}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-[#DCE8DC] bg-white px-3.5 text-[12.5px] font-semibold text-[#1B7339] hover:bg-[#E8F5E9] disabled:opacity-50"
            >
              {marking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
              Mark all read
            </button>
          }
        />

        <div className="rounded-2xl border border-[#E5E5E5] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#1B7339]" />
            </div>
          ) : notifications.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-[#8A8A8A]">No notifications yet.</p>
          ) : (
            <ul className="divide-y divide-[#F0F0F0]">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={cn("px-5 py-4", !n.readAt && "bg-[#F7FBF7]")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "text-[14px] text-[#1A1A1A]",
                          !n.readAt ? "font-semibold" : "font-medium",
                        )}
                      >
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="mt-1 text-[13px] leading-relaxed text-[#5A5A5A]">{n.body}</p>
                      )}
                    </div>
                    <time className="shrink-0 text-[11px] text-[#8A8A8A]">
                      {new Date(n.createdAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PortalShell>
  )
}
