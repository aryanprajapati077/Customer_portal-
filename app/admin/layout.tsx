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
  Contact,
  ToggleRight,
  MailCheck,
  ChevronRight,
  Search,
  type LucideIcon,
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

type NavItem = { href: string; label: string; icon: LucideIcon }

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/analytics", label: "Portal Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Clients",
    items: [
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/group-clients", label: "Group Clients", icon: UsersRound },
      { href: "/admin/kr-credits", label: "KR Credits", icon: Coins },
      { href: "/admin/customer-pocs", label: "Customer POCs", icon: Contact },
      { href: "/admin/dropdowns", label: "Dropdowns", icon: ListTree },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/collections", label: "Collections", icon: Package },
      { href: "/admin/pending-collections", label: "Pending Collections", icon: ClipboardList },
      { href: "/admin/renewals", label: "Renewals", icon: CalendarClock },
      { href: "/admin/certificates", label: "Certificates", icon: Award },
    ],
  },
  {
    label: "Reports & Email",
    items: [
      { href: "/admin/reports", label: "Reports & Email", icon: FileBarChart },
      { href: "/admin/newsletter", label: "Newsletter", icon: Newspaper },
      { href: "/admin/email-templates", label: "Email Templates", icon: Mail },
      { href: "/admin/email-settings", label: "Email On/Off", icon: ToggleRight },
      { href: "/admin/email-status", label: "Email Status", icon: MailCheck },
    ],
  },
  {
    label: "Commerce",
    items: [
      { href: "/admin/shop/products", label: "Shop Products", icon: ShoppingBag },
      { href: "/admin/shop/orders", label: "Shop Orders", icon: ClipboardList },
    ],
  },
  {
    label: "Engagement",
    items: [
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
      { href: "/admin/proposals", label: "Proposal Leads", icon: Calculator },
      { href: "/admin/contact", label: "Contact Us", icon: MessageSquare },
      { href: "/admin/support", label: "Support Tickets", icon: LifeBuoy },
    ],
  },
]

const AUTH_PATHS = ["/admin/login", "/admin/forgot-password", "/admin/reset-password"]

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin"
  return pathname === href || pathname.startsWith(`${href}/`)
}

function pageTitleFromPath(pathname: string, items: NavItem[]): string {
  const match = items.find((item) => isActive(pathname, item.href))
  if (match) return match.label
  if (pathname.startsWith("/admin/users")) return "Admin Users"
  if (pathname.startsWith("/admin/security")) return "Authenticator"
  return "Admin"
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [admin, setAdmin] = useState<AdminMe | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [navQuery, setNavQuery] = useState("")

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
    fetch("/api/admin/me", { credentials: "include" })
      .then(async (r) => {
        if (cancelled) return
        if (r.status === 401) {
          setAdmin(null)
          try {
            sessionStorage.removeItem("buff_admin_me")
          } catch {
            /* ignore */
          }
          return
        }
        const d = await r.json()
        if (!d.admin) return
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

  const flatNav = useMemo(() => navGroups.flatMap((g) => g.items), [])

  const filteredGroups = useMemo(() => {
    const systemItems: NavItem[] = [
      { href: "/admin/security", label: "Authenticator", icon: ShieldCheck },
      ...(admin?.role === "super_admin"
        ? [{ href: "/admin/users", label: "Admin Users", icon: UserCog }]
        : []),
    ]

    const groups = navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          const key = permissionKeyForPath(item.href)
          if (!key) return true
          return hasAdminPermission(admin?.role, admin?.permissions, key)
        }),
      }))
      .filter((group) => group.items.length > 0)

  const systemFiltered = systemItems.filter((item) => {
      if (item.href === "/admin/security") return true
      return admin?.role === "super_admin"
    })

    return { groups, system: systemFiltered }
  }, [admin])

  const allNavItems = useMemo(
    () => [...flatNav, ...filteredGroups.system],
    [flatNav, filteredGroups.system],
  )

  const pageTitle = pageTitleFromPath(pathname, allNavItems)

  useEffect(() => {
    document.title = `${pageTitle} · BuffIndia Admin`
  }, [pageTitle])

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
      const first = allNavItems.find((n) => n.href !== "/admin/security")
      router.replace(first?.href || "/admin")
    }
  }, [admin, pathname, isAuthPage, allNavItems, router])

  const logout = async () => {
    setIsLoggingOut(true)
    try {
      sessionStorage.removeItem("buff_admin_me")
      await fetch("/api/admin/logout", { method: "POST", credentials: "include" })
    } finally {
      window.location.assign("/admin/login")
    }
  }

  if (isAuthPage) {
    return <div className="admin-auth min-h-screen bg-white">{children}</div>
  }

  const SidebarNav = ({ onNavigate }: { onNavigate?: () => void }) => {
    const q = navQuery.trim().toLowerCase()
    const visibleGroups = filteredGroups.groups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            !q ||
            item.label.toLowerCase().includes(q) ||
            group.label.toLowerCase().includes(q) ||
            item.href.toLowerCase().includes(q),
        ),
      }))
      .filter((group) => group.items.length > 0)

    const visibleSystem = filteredGroups.system.filter(
      (item) =>
        !q ||
        item.label.toLowerCase().includes(q) ||
        item.href.toLowerCase().includes(q),
    )

    return (
    <>
      <div className="border-b border-[#ebe9e4] px-4 pb-4 pt-5">
        <Link href="/admin" onClick={onNavigate} className="group block">
          <Image
            src="/logo.svg"
            alt="BuffIndia"
            width={140}
            height={44}
            className="h-9 w-auto object-contain transition-opacity group-hover:opacity-90"
            priority
          />
          <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a9a9a]">
            Admin Console
          </p>
        </Link>
        {admin && (
          <div className="mt-3 rounded-xl border border-[#dce8dc] bg-[#f7fbf7] px-3 py-2.5">
            <p className="truncate text-[13px] font-semibold text-[#141414]">{admin.name}</p>
            <p className="truncate text-[11px] text-[#6b6b6b]">
              {admin.role === "super_admin" ? "Super Admin" : "Admin"} · {admin.email}
            </p>
          </div>
        )}
      </div>

      <div className="px-3 pb-2">
        <label className="sr-only" htmlFor="admin-nav-search">
          Search admin menu
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9a9a9a]" aria-hidden />
          <input
            id="admin-nav-search"
            type="search"
            value={navQuery}
            onChange={(e) => setNavQuery(e.target.value)}
            placeholder="Search menu…"
            className="admin-nav-search h-9 w-full rounded-[10px] border border-[#ebe9e4] bg-[#fafaf8] pl-8 pr-2 text-[12px] text-[#141414] placeholder:text-[#9a9a9a]"
          />
        </div>
      </div>

      <nav className="admin-sidebar-scroll flex-1 overflow-y-auto px-2.5 py-2" aria-label="Admin navigation">
        {visibleGroups.map((group) => (
          <div key={group.label} className="mb-1">
            <p className="admin-nav-label">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex min-h-[42px] items-center gap-2.5 rounded-[10px] px-3 py-2 text-[13.5px] font-medium transition-colors duration-150",
                      active
                        ? "bg-[#e8f5e9] text-[#1b7339] shadow-sm"
                        : "text-[#4a4a4a] hover:bg-[#f5f5f3] hover:text-[#141414]",
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-[22px] w-[3px] -translate-y-1/2 rounded-r-full bg-[#1b7339]" />
                    )}
                    <Icon
                      className={cn(
                        "h-[17px] w-[17px] shrink-0",
                        active ? "text-[#1b7339]" : "text-[#8a8a8a]",
                      )}
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}

        {visibleSystem.length > 0 && (
          <div className="mb-1 mt-2 border-t border-[#ebe9e4] pt-2">
            <p className="admin-nav-label">System</p>
            <div className="space-y-0.5">
              {visibleSystem.map((item) => {
                const active = isActive(pathname, item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex min-h-[42px] items-center gap-2.5 rounded-[10px] px-3 py-2 text-[13.5px] font-medium transition-colors duration-150",
                      active
                        ? "bg-[#e8f5e9] text-[#1b7339]"
                        : "text-[#4a4a4a] hover:bg-[#f5f5f3] hover:text-[#141414]",
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-[22px] w-[3px] -translate-y-1/2 rounded-r-full bg-[#1b7339]" />
                    )}
                    <Icon className="h-[17px] w-[17px] shrink-0" strokeWidth={1.75} aria-hidden />
                    <span className="truncate">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {q && visibleGroups.length === 0 && visibleSystem.length === 0 ? (
          <p className="px-3 py-6 text-center text-[12px] text-[#8a8a8a]">No menu items match.</p>
        ) : null}
      </nav>

      <div className="border-t border-[#ebe9e4] p-3">
        <button
          type="button"
          onClick={logout}
          disabled={isLoggingOut}
          className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-[10px] border border-[#f0d0d0] bg-[#fff8f8] px-3 py-2.5 text-[13px] font-semibold text-[#c62828] transition-colors hover:bg-[#ffebee] disabled:opacity-60"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          {isLoggingOut ? "Signing out..." : "Sign Out"}
        </button>
      </div>
    </>
    )
  }

  return (
    <div className="admin-root min-h-screen text-[#141414]">
      <a href="#admin-main" className="admin-skip-link">
        Skip to main content
      </a>
      <div className="relative z-10 flex min-h-screen">
        <aside className="admin-sidebar sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col lg:flex">
          <SidebarNav />
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
            <button
              type="button"
              className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="admin-sidebar absolute left-0 top-0 flex h-full w-[280px] flex-col shadow-xl">
              <div className="flex items-center justify-end p-3">
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#f5f5f3]"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        <div className="admin-canvas flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-[#ebe9e4] bg-white/92 backdrop-blur-md">
            <div className="flex min-h-[3.75rem] items-center justify-between gap-3 px-4 lg:px-8">
              <div className="flex min-w-0 items-center gap-2">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e5e5e5] bg-white lg:hidden"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-4 w-4" />
                </button>
                <div className="min-w-0">
                  <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] text-[#8a8a8a]">
                    <span>Admin</span>
                    <ChevronRight className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
                    <span className="truncate font-medium text-[#1b7339]">{pageTitle}</span>
                  </nav>
                  <p className="truncate text-[15px] font-semibold tracking-tight text-[#141414]">{pageTitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {admin && (
                  <span className="hidden max-w-[200px] truncate rounded-full border border-[#ebe9e4] bg-[#fafaf8] px-3 py-1.5 text-[11px] text-[#6b6b6b] md:inline">
                    {admin.email}
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-full border-[#dce8dc] bg-white px-4 text-[#1b7339] hover:bg-[#e8f5e9]"
                  onClick={() => router.push("/dashboard")}
                >
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  Portal
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-full border-[#f0d0d0] text-[#c62828] hover:bg-[#fff5f5] sm:hidden"
                  onClick={logout}
                  disabled={isLoggingOut}
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          <main id="admin-main" className="flex flex-1 flex-col px-4 py-6 lg:px-8 lg:py-8">
            <div className="admin-content admin-page flex-1">{children}</div>
            <footer className="admin-footer mt-8 border-t border-[#ebe9e4] pt-4">
              <div className="flex flex-col gap-2 text-[11px] text-[#8a8a8a] sm:flex-row sm:items-center sm:justify-between">
                <span>BuffIndia Admin Console</span>
                <nav aria-label="Admin footer links" className="flex flex-wrap gap-x-4 gap-y-1">
                  <Link href="/admin/support" className="hover:text-[#1b7339]">
                    Support inbox
                  </Link>
                  <Link href="/admin/email-status" className="hover:text-[#1b7339]">
                    Email delivery
                  </Link>
                  <Link href="/admin/pending-collections" className="hover:text-[#1b7339]">
                    Pending collections
                  </Link>
                  <Link href="/admin/security" className="hover:text-[#1b7339]">
                    Authenticator
                  </Link>
                </nav>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </div>
  )
}
