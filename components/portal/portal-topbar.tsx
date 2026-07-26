"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, ChevronDown, LogOut, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { useAuth, type Customer } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { firstName } from "@/lib/portal-metrics"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type NotificationItem = {
  id: string
  title: string
  body: string | null
  createdAt: string
  readAt: string | null
}

interface PortalTopbarProps {
  customer: Customer
  showCart?: boolean
}

export function PortalTopbar({ customer, showCart = false }: PortalTopbarProps) {
  const { logout } = useAuth()
  const router = useRouter()
  const { itemCount } = useCart()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/notifications?customerId=${customer.id}`)
        const data = await res.json()
        if (!cancelled && data?.success) setNotifications(data.notifications || [])
      } catch {
        // ignore
      }
    })()
    return () => {
      cancelled = true
    }
  }, [customer.id])

  const unreadCount = useMemo(() => notifications.filter((n) => !n.readAt).length, [notifications])
  const initial = (firstName(customer.contactPerson) || customer.companyName || "U").charAt(0).toUpperCase()
  const displayName = firstName(customer.contactPerson)

  return (
    <div className="flex items-center justify-end gap-3">
      {showCart && (
        <Link
          href="/dashboard/shop/cart"
          className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg border border-[#D0D0D0] bg-white text-[13px] font-medium text-[#1A1A1A] hover:bg-[#FAFAFA]"
        >
          <ShoppingBag className="w-4 h-4" />
          Cart
          {itemCount > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#2E7D32] text-white text-[11px] font-semibold flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </Link>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="relative w-9 h-9 rounded-full flex items-center justify-center text-[#4A4A4A] hover:bg-[#F3F3F3]"
            aria-label="Notifications"
          >
            <Bell className="w-[18px] h-[18px]" strokeWidth={1.75} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E53935] ring-2 ring-white" />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 p-0">
          <DropdownMenuLabel className="px-3 py-2.5">Notifications</DropdownMenuLabel>
          <DropdownMenuSeparator className="m-0" />
          {notifications.length === 0 ? (
            <div className="px-3 py-4 text-sm text-muted-foreground">No notifications yet</div>
          ) : (
            <div className="max-h-[320px] overflow-y-auto py-1">
              {notifications.slice(0, 6).map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className={cn(
                    "mx-1 flex flex-col items-start gap-0.5 rounded-lg py-2.5",
                    !n.readAt && "bg-[#E8F5E9]",
                  )}
                  onClick={() => router.push("/dashboard/notifications")}
                >
                  <span className={cn("text-sm", !n.readAt && "font-semibold text-[#1B7339]")}>
                    {n.title}
                  </span>
                  {n.body && <span className="text-xs text-muted-foreground line-clamp-2">{n.body}</span>}
                </DropdownMenuItem>
              ))}
            </div>
          )}
          <DropdownMenuSeparator className="m-0" />
          <div className="p-1.5">
            <DropdownMenuItem
              className="justify-center rounded-lg text-[13px] font-semibold text-[#1B7339]"
              onClick={() => router.push("/dashboard/notifications")}
            >
              View all notifications
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        type="button"
        onClick={() => {
          logout()
          router.push("/")
        }}
        className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-[#E8D0D0] bg-white text-[12.5px] font-semibold text-[#C62828] hover:bg-[#FFF5F5] transition-colors"
      >
        <LogOut className="w-3.5 h-3.5" />
        Sign Out
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2.5 rounded-full pl-1 pr-2 py-1 hover:bg-[#F3F3F3]"
          >
            <span className="w-9 h-9 rounded-full bg-[#C4A484] text-white text-sm font-semibold flex items-center justify-center">
              {initial}
            </span>
            <span className="hidden sm:flex flex-col items-start leading-tight">
              <span className="text-[13px] font-semibold text-[#1A1A1A]">{displayName}</span>
              <span className="text-[11px] text-[#8A8A8A]">{customer.companyName}</span>
            </span>
            <ChevronDown className="w-4 h-4 text-[#8A8A8A] hidden sm:block" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/dashboard/account")}>Account</DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/dashboard/shop")}>KraftReborn Shop</DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/dashboard/support")}>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => {
              logout()
              router.push("/")
            }}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
