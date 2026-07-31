"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import "./admin.css"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  Package,
  Award,
  Bell,
  LogOut,
  FileBarChart,
  ShoppingBag,
  ClipboardList,
  LifeBuoy,
  ShieldCheck,
  UserCog,
  Menu,
  X,
  ExternalLink,
  ListTree,
  Mail,
  Calculator,
  MessageSquare,
  Coins,
  Newspaper,
  UsersRound,
  BarChart3,
  CalendarClock,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import {
  hasAdminPermission,
  permissionKeyForPath,
  type AdminPermissionKey,
} from "@/lib/admin-permissions"

type AdminMe = {
  id: string
  email: string
  name: string
  role: string
  permissions?: string[]
}

const nav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Portal Analytics", icon: BarChart3 },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/group-clients", label: "Group Clients", icon: UsersRound },
  { href: "/admin/kr-credits", label: "KR Credits", icon: Coins },
  { href: "/admin/dropdowns", label: "Dropdowns", icon: ListTree },
  { href: "/admin/reports", label: "Reports & Email", icon: FileBarChart },
  { href: "/admin/newsletter", label: "Newsletter", icon: Newspaper },
  { href: "/admin/email-templates", label: "Email Templates", icon: Mail },
  { href: "/admin/collections", label: "Collections", icon: Package },
  { href: "/admin/pending-collections", label: "Pending Collections", icon: ClipboardList },
  { href: "/admin/renewals", label: "Renewals", icon: CalendarClock },
  { href: "/admin/shop/products", label: "Shop Products", icon: ShoppingBag },
  { href: "/admin/shop/orders", label: "Shop Orders", icon: ClipboardList },
  { href: "/admin/certificates", label: "Certificates", icon: Award },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/proposals", label: "Proposal Leads", icon: Calculator },
  { href: "/admin/contact", label: "Contact Us", icon: MessageSquare },
  { href: "/admin/support", label: "Support Tickets", icon: LifeBuoy },
]

const AUTH_PATHS = ["/admin/login", "/admin/forgot-password", "/admin/reset-password"]

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [admin, setAdmin] = useState<AdminMe | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isAuthPage = AUTH_PATHS.includes(pathname)

  useEffect(() => {
    if (isAuthPage) return
    let cancelled = false
    try {
      const cached = sessionStorage.getItem("buff_admin_me")
      if (cached) {
        const parsed = JSON.parse(cached) as AdminMe
        if (parsed?.id && parsed?.email) setAdmin(parsed)
      }
    } catch {
      /* ignore */
    }
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d.admin) return
        setAdmin(d.admin)
        try {
          sessionStorage.setItem("buff_admin_me", JSON.stringify(d.admin))
        } catch {
          /* ignore */
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [isAuthPage])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const fullNav = useMemo(() => {
    const items = [
      ...nav,
      { href: "/admin/security", label: "Authenticator", icon: ShieldCheck },
      ...(admin?.role === "super_admin"
        ? [{ href: "/admin/users", label: "Admin Users", icon: UserCog }]
        : []),
    ]
    return items.filter((item) => {
      if (item.href === "/admin/security") return true
      const key = permissionKeyForPath(item.href)
      if (!key) return true
      return hasAdminPermission(admin?.role, admin?.permissions, key)
    })
  }, [admin])

  useEffect(() => {
    if (isAuthPage || !admin) return
    const key = permissionKeyForPath(pathname)
    if (!key || key === "users") {
      if (key === "users" && admin.role !== "super_admin") {
        router.replace("/admin")
      }
      return
    }
    if (!hasAdminPermission(admin.role, admin.permissions, key as AdminPermissionKey)) {
      const first = fullNav.find((n) => n.href !== "/admin/security")
      router.replace(first?.href || "/admin")
    }
  }, [admin, pathname, isAuthPage, fullNav, router])

  const logout = async () => {
    setIsLoggingOut(true)
    try {
      sessionStorage.removeItem("buff_admin_me")
      await fetch("/api/admin/logout", { method: "POST", credentials: "include" })
    } finally {
      // Hard navigation avoids stale layout/cookie state after logout
      window.location.assign("/admin/login")
    }
  }

  if (isAuthPage) {
    return <div className="min-h-screen bg-white">{children}</div>
  }

  const crumb = pathname.replace("/admin", "") || "/overview"

  const SidebarNav = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <div className="px-4 pt-4 pb-3">
        <Link href="/admin" onClick={onNavigate} className="block group">
          <Image
            src="/logo.svg"
            alt="BuffIndia"
            width={140}
            height={44}
            className="h-9 w-auto object-contain group-hover:opacity-90 transition-opacity"
            priority
          />
          <p className="mt-1.5 text-[11px] font-medium text-[#8B8B8B]">Admin Console</p>
        </Link>
        {admin && (
          <div className="mt-3 rounded-xl border border-[#E2EBE4] bg-[#F7FBF7] px-3 py-2">
            <p className="truncate text-[13px] font-semibold text-[#1A1A1A]">{admin.name}</p>
            <p className="truncate text-[11px] text-[#6B6B6B]">
              {admin.role === "super_admin" ? "Super Admin" : "Admin"} · {admin.email}
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-[2px] overflow-y-auto px-3 pt-1">
        {fullNav.map((item) => {
          const active = isActive(pathname, item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "relative flex items-center gap-3 rounded-[10px] px-3 py-[9px] text-[13.5px] font-medium transition-all duration-200",
                active
                  ? "bg-[#E8F5E9] text-[#1B7339] shadow-sm"
                  : "text-[#555] hover:bg-[#F5F5F5] hover:translate-x-0.5",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-[22px] w-[3px] -translate-y-1/2 rounded-r-full bg-[#1B7339]" />
              )}
              <Icon
                className={cn("h-[17px] w-[17px]", active ? "text-[#1B7339]" : "text-[#7A7A7A]")}
                strokeWidth={1.7}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="space-y-2 p-3.5 pb-4">
        <button
          type="button"
          onClick={logout}
          disabled={isLoggingOut}
          className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-[#F0D0D0] bg-[#FFF8F8] px-3 py-2.5 text-[13px] font-semibold text-[#C62828] transition-colors hover:bg-[#FFEBEE] disabled:opacity-60"
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut ? "Signing out..." : "Sign Out"}
        </button>
      </div>
    </>
  )

  return (
    <div className="admin-root min-h-screen bg-[#F7F6F2] text-[#141414]">
      <div className="relative z-10 flex">
        <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-r border-[#EAEAEA] bg-white lg:flex">
          <SidebarNav />
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="absolute left-0 top-0 flex h-full w-[280px] flex-col bg-white shadow-xl">
              <div className="flex items-center justify-end p-3">
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#F5F5F5]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-[#EAEAEA] bg-white/90 backdrop-blur-md">
            <div className="flex h-14 items-center justify-between gap-3 px-4 lg:px-8">
              <div className="flex min-w-0 items-center gap-2">
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E5E5] lg:hidden"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu className="h-4 w-4" />
                </button>
                <span className="text-[13px] font-semibold text-[#1A1A1A]">Admin</span>
                <span className="hidden truncate text-[12px] text-[#8A8A8A] sm:inline">
                  / {crumb.replace(/^\//, "")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {admin && (
                  <span className="hidden max-w-[200px] truncate text-[12px] text-[#6B6B6B] md:inline">
                    {admin.email}
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-full border-[#DCE8DC] text-[#1B7339] hover:bg-[#E8F5E9]"
                  onClick={() => router.push("/dashboard")}
                >
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Portal
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-full border-[#F0D0D0] text-[#C62828] hover:bg-[#FFF5F5] sm:hidden"
                  onClick={logout}
                  disabled={isLoggingOut}
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
