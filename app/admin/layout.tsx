"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  LayoutDashboard,
  Home,
  Users,
  Package,
  Award,
  Bell,
  Mail,
  LogOut,
  Sparkles,
  FileBarChart,
  ShoppingBag,
  ClipboardList,
  Database,
  LifeBuoy,
} from "lucide-react"
import { useState } from "react"

const nav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/homepage", label: "Homepage", icon: Home },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reports", label: "Reports & Email", icon: FileBarChart },
  { href: "/admin/collections", label: "Collections", icon: Package },
  { href: "/admin/shop/products", label: "Shop Products", icon: ShoppingBag },
  { href: "/admin/shop/orders", label: "Shop Orders", icon: ClipboardList },
  { href: "/admin/verified-certificates", label: "Verified Certs", icon: Award },
  { href: "/admin/import", label: "Import Data", icon: Database },
  { href: "/admin/certificates", label: "Certificates", icon: Award },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/support", label: "Support Tickets", icon: LifeBuoy },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const logout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch("/api/admin/logout", { method: "POST" })
    } finally {
      router.push("/admin/login")
      router.refresh()
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-[600px] h-[600px] bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-[600px] h-[600px] bg-secondary/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-72 min-h-screen sticky top-0 border-r border-border/50 glass-strong">
          <div className="w-full flex flex-col p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground leading-5">Buffindia Admin</p>
                <p className="text-xs text-muted-foreground">Manage portal + website</p>
              </div>
            </div>

            <Separator className="my-5" />

            <nav className="space-y-1">
              {nav.map((item) => {
                const active = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 group",
                      active
                        ? "bg-primary/10 text-foreground border border-primary/20 shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "w-4 h-4 transition-transform duration-300",
                        active ? "text-primary" : "group-hover:scale-110",
                      )}
                    />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="mt-auto pt-6">
              <Button variant="outline" className="w-full justify-start" onClick={logout} disabled={isLoggingOut}>
                <LogOut className="w-4 h-4 mr-2" />
                {isLoggingOut ? "Signing out..." : "Sign out"}
              </Button>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Tip: deploy this admin on a separate domain by routing only <span className="font-mono">/admin</span>.
              </p>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1">
          {/* Topbar */}
          <header className="sticky top-0 z-40 glass-strong border-b border-border/50">
            <div className="container mx-auto px-4 lg:px-8 h-14 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">Admin</span>
                <span className="text-xs text-muted-foreground hidden sm:inline">/ {pathname.replace("/admin", "") || "overview"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => router.push("/dashboard")}>
                  Go to Portal
                </Button>
              </div>
            </div>
          </header>

          <main className="container mx-auto px-4 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

