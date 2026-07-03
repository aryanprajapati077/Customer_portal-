"use client"

import { useAuth, type Customer } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut, User, Bell, Settings, Building2, ChevronDown, ShoppingBag, LifeBuoy } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

type ChildCompany = { id: string; companyName: string; email: string }

interface DashboardHeaderProps {
  customer: Customer
  /** When customer is a group, list of child companies they can switch to */
  childCompanies?: ChildCompany[]
  /** Currently viewed company id (customer.id or a child's id) */
  viewingAsId?: string
  /** Callback when user switches company */
  onCompanySwitch?: (customerId: string) => void
}

type NotificationItem = {
  id: string
  title: string
  body: string | null
  createdAt: string
  readAt: string | null
}

export function DashboardHeader({
  customer,
  childCompanies = [],
  viewingAsId,
  onCompanySwitch,
}: DashboardHeaderProps) {
  const { logout } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const isGroup = customer?.isGroup
  const effectiveId = viewingAsId || customer?.id
  const displayName =
    effectiveId === customer?.id
      ? customer.companyName
      : childCompanies.find((c) => c.id === effectiveId)?.companyName || customer.companyName

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/notifications?customerId=${effectiveId}`)
        const data = await res.json()
        if (cancelled) return
        if (data?.success) setNotifications(data.notifications || [])
      } catch {
        // ignore
      }
    })()
    return () => {
      cancelled = true
    }
  }, [effectiveId])

  const unreadCount = useMemo(() => notifications.filter((n) => !n.readAt).length, [notifications])

  return (
    <header className="sticky top-0 z-50 glass-strong border-b border-border/50">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Image
                  src="/logo.svg"
                  alt="Buffindia Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-foreground">
                Buff<span className="text-primary">india</span>
              </span>
              <span className="text-xs text-muted-foreground -mt-1">Customer Portal</span>
            </div>
          </Link>

          {/* Company Switcher (for group clients) */}
          {isGroup && onCompanySwitch && (
            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 bg-background/50 border-border/50">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="max-w-[160px] truncate">{displayName}</span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-64 glass border-border/50">
                  <DropdownMenuLabel>Switch Company</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => onCompanySwitch(customer.id)}
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    {customer.companyName} (My company)
                  </DropdownMenuItem>
                  {childCompanies.length > 0 ? (
                    childCompanies.map((child) => (
                      <DropdownMenuItem
                        key={child.id}
                        className="cursor-pointer"
                        onClick={() => onCompanySwitch(child.id)}
                      >
                        <Building2 className="w-4 h-4 mr-2" />
                        {child.companyName}
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="px-2 py-3 text-sm text-muted-foreground">
                      No child companies yet. Add clients in admin panel.
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 glass border-border/50">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No notifications</div>
                ) : (
                  <div className="max-h-72 overflow-auto">
                    {notifications.slice(0, 10).map((n) => (
                      <div key={n.id} className="px-3 py-2 border-b border-border/30 last:border-b-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className={`text-sm font-medium ${n.readAt ? "text-foreground" : "text-foreground"}`}>
                              {n.title}
                            </p>
                            {n.body && <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                          </div>
                          {!n.readAt && <span className="mt-1 w-2 h-2 bg-primary rounded-full shrink-0" />}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 px-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium text-foreground">{customer.contactPerson || customer.companyName}</span>
                    <span className="text-xs text-muted-foreground">{displayName}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass border-border/50">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/dashboard/shop")}>
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Kraft Reborn Shop
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/settings")}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/support")}>
                  <LifeBuoy className="w-4 h-4 mr-2" />
                  Help & Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
