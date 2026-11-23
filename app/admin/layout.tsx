"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import "./admin.css"
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
  ListChecks,
  Search,
  Zap,
  MapPinned,
  Images,
  FileText,
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

type NavItem = { href: string; label: string; icon: LucideIcon; keywords?: string[] }

function navItemMatchesQuery(item: NavItem, groupLabel: string, q: string) {
  if (!q) return true
  const hay = [item.label, item.href, groupLabel, ...(item.keywords || [])].join(" ").toLowerCase()
  const tokens = q.split(/\s+/).filter(Boolean)
  return tokens.every((t) => hay.includes(t) || hay.replace(/\s+/g, "-").includes(t))
}

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/analytics", label: "Portal Analytics", icon: BarChart3 },
      {
        href: "/admin/report-status",
        label: "Report Status",
        icon: ListChecks,
        keywords: ["report", "status", "delivery", "bounce", "pending", "esg", "email"],
      },
    ],
  },
  {
    label: "Clients",
    items: [
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/group-clients", label: "Group Clients", icon: UsersRound },
      { href: "/admin/kr-credits", label: "KR Credits", icon: Coins },
      {
        href: "/admin/kr-credits/unlock-requests",
        label: "KR Support",
        icon: LifeBuoy,
        keywords: ["kr", "unlock", "lock", "payment", "credits", "kraftreborn"],
      },
      { href: "/admin/customer-pocs", label: "Customer POCs", icon: Contact },
      { href: "/admin/dropdowns", label: "Dropdowns", icon: ListTree },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/collections", label: "Collections", icon: Package },
      {
        href: "/admin/reverify-collections",
        label: "Reverify Collections",
        icon: ShieldCheck,
        keywords: ["verify", "verification", "reverify", "operations", "pending"],
      },
      { href: "/admin/pending-collections", label: "Pending Collections", icon: ClipboardList },
      {
        href: "/admin/lsu-assign",
        label: "LSU Assign",
        icon: MapPinned,
        keywords: ["lsu", "assign", "operations", "manager"],
      },
      { href: "/admin/renewals", label: "Renewals", icon: CalendarClock },
      {
        href: "/admin/renewal-responses",
        label: "Renewal Responses",
        icon: CalendarClock,
        keywords: ["renew", "response", "interest", "renew now"],
      },
      { href: "/admin/certificates", label: "Certificates", icon: Award },
      {
        href: "/admin/presets",
        label: "Presets",
        icon: Images,
        keywords: ["preset", "poster", "logo", "sign", "template"],
      },
    ],
  },
  {
    label: "Reports & Email",
    items: [
      { href: "/admin/reports", label: "Reports & Email", icon: FileBarChart },
      {
        href: "/admin/quick-report",
        label: "Quick Report",
        icon: Zap,
        keywords: ["quick", "download", "impact", "pdf", "excel", "month"],
      },
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
      { href: "/admin/quotations", label: "Quotations", icon: FileText },
      { href: "/admin/preservice-proposals", label: "Pre-Service Proposal", icon: FileText },
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
  const [scrolled, setScrolled] = useState(false)

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

  // Portalled dialogs/menus render outside .admin-root; tag <body> so they share the admin look.
  useEffect(() => {
    if (isAuthPage) return
    document.body.classList.add("admin-body")
    return () => document.body.classList.remove("admin-body")
  }, [isAuthPage])

  // Toolbar shows its hairline + compact title only once content scrolls under it.
  useEffect(() => {
    if (isAuthPage) return
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [isAuthPage])

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
          if (admin?.role === "super_admin") return true
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
    if (admin.role === "super_admin") return
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

  const initials = (admin?.name || admin?.email || "A")
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("")

  const NavLink = ({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) => {
    const Icon = item.icon
    const active = isActive(pathname, item.href)
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className="admin-nav-item"
      >
        <Icon strokeWidth={1.8} aria-hidden />
        <span className="truncate">{item.label}</span>
      </Link>
    )
  }

  const SidebarNav = ({ onNavigate }: { onNavigate?: () => void }) => {
    const q = navQuery.trim().toLowerCase()
    const visibleGroups = filteredGroups.groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => navItemMatchesQuery(item, group.label, q)),
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
        <div className="px-4 pb-3 pt-5">
          <Link href="/admin" onClick={onNavigate} className="flex items-center gap-2.5 rounded-lg">
            <Image
              src="/logo.svg"
              alt="BuffIndia"
              width={120}
              height={36}
              className="h-7 w-auto object-contain"
              priority
            />
            <span className="rounded-md bg-[rgba(118,118,128,0.12)] px-1.5 py-0.5 text-[11px] font-semibold text-[#6e6e73]">
              Admin
            </span>
          </Link>
        </div>

        <div className="px-3 pb-1">
          <label className="sr-only" htmlFor="admin-nav-search">
            Search admin menu
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#86868b]"
              aria-hidden
            />
            <input
              id="admin-nav-search"
              type="search"
              value={navQuery}
              onChange={(e) => setNavQuery(e.target.value)}
              placeholder="Search"
              className="admin-nav-search"
            />
          </div>
        </div>

        <nav className="admin-sidebar-scroll flex-1 overflow-y-auto px-2.5 pb-3" aria-label="Admin navigation">
          {visibleGroups.map((group) => (
            <div key={group.label}>
              <p className="admin-nav-label">{group.label}</p>
              <div className="space-y-px">
                {group.items.map((item) => (
                  <NavLink key={item.href} item={item} onNavigate={onNavigate} />
                ))}
              </div>
            </div>
          ))}

          {visibleSystem.length > 0 && (
            <div>
              <p className="admin-nav-label">System</p>
              <div className="space-y-px">
                {visibleSystem.map((item) => (
                  <NavLink key={item.href} item={item} onNavigate={onNavigate} />
                ))}
              </div>
            </div>
          )}

          {q && visibleGroups.length === 0 && visibleSystem.length === 0 ? (
            <p className="px-3 py-8 text-center text-[13px] text-[#86868b]">No results for “{navQuery.trim()}”</p>
          ) : null}
        </nav>

        <div className="border-t-[0.5px] border-[rgba(0,0,0,0.1)] p-2.5">
          <div className="flex items-center gap-2.5 rounded-[10px] px-1.5 py-1.5">
            <span
              aria-hidden
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#a1a1a6] to-[#7c7c80] text-[12px] font-semibold text-white"
            >
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold leading-tight text-[#1d1d1f]">
                {admin?.name || "Admin"}
              </p>
              <p className="truncate text-[11.5px] leading-tight text-[#86868b]">
                {admin ? (admin.role === "super_admin" ? "Super Admin" : "Admin") : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={logout}
              disabled={isLoggingOut}
              className="admin-toolbar-btn !h-8 !w-8 !px-0 !bg-transparent hover:!bg-[rgba(118,118,128,0.12)] disabled:opacity-50"
              aria-label={isLoggingOut ? "Signing out" : "Sign out"}
              title="Sign out"
            >
              <LogOut aria-hidden />
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="admin-root">
      <a href="#admin-main" className="admin-skip-link">
        Skip to main content
      </a>
      <div className="relative flex min-h-screen">
        <aside className="admin-sidebar sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col lg:flex">
          <SidebarNav />
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
            <button
              type="button"
              className="admin-scrim absolute inset-0 bg-black/20"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="admin-sidebar admin-drawer absolute left-0 top-0 flex h-full w-[284px] flex-col shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
              <div className="flex items-center justify-end px-3 pt-3">
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="admin-toolbar-btn !px-0"
                  aria-label="Close menu"
                >
                  <X aria-hidden />
                </button>
              </div>
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        <div className="admin-canvas flex min-w-0 flex-1 flex-col">
          <header className="admin-toolbar" data-scrolled={scrolled ? "true" : "false"}>
            <div className="flex h-[52px] items-center justify-between gap-3 px-4 lg:px-8">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="lg:hidden">
                  <button
                    type="button"
                    className="admin-toolbar-btn !px-0"
                    onClick={() => setMobileOpen(true)}
                    aria-label="Open navigation menu"
                  >
                    <Menu aria-hidden />
                  </button>
                </div>
                <p
                  className={cn(
                    "truncate text-[13px] font-semibold tracking-[-0.01em] text-[#1d1d1f] transition-opacity duration-200",
                    scrolled ? "opacity-100" : "opacity-0 lg:opacity-0",
                  )}
                  aria-hidden={!scrolled}
                >
                  {pageTitle}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/dashboard" className="admin-toolbar-btn">
                  <ExternalLink aria-hidden />
                  <span className="hidden sm:inline">Customer portal</span>
                </Link>
              </div>
            </div>
          </header>

          <main id="admin-main" className="flex flex-1 flex-col px-4 pb-8 pt-4 lg:px-8 lg:pt-6">
            <div key={pathname} className="admin-content admin-page admin-page-enter flex-1">
              {children}
            </div>
            <footer className="admin-footer admin-content mt-12">
              <div className="flex flex-col gap-2 border-t-[0.5px] border-[rgba(0,0,0,0.1)] pt-4 text-[12px] text-[#86868b] sm:flex-row sm:items-center sm:justify-between">
                <span>BuffIndia Admin</span>
                <nav aria-label="Admin footer links" className="flex flex-wrap gap-x-4 gap-y-1">
                  <Link href="/admin/support">Support inbox</Link>
                  <Link href="/admin/report-status">Report status</Link>
                  <Link href="/admin/email-status">Email delivery</Link>
                  <Link href="/admin/pending-collections">Pending collections</Link>
                  <Link href="/admin/security">Authenticator</Link>
                </nav>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </div>
  )
}
