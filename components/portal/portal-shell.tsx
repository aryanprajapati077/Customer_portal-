"use client"

import { useState, type ReactNode } from "react"
import Image from "next/image"
import type { Customer } from "@/lib/auth-context"
import { PortalSidebar } from "@/components/portal/portal-sidebar"
import { PortalTopbar } from "@/components/portal/portal-topbar"
import { PortalFooter } from "@/components/portal/portal-footer"
import { Loader2, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import "@/app/portal.css"

interface PortalShellProps {
  customer: Customer | null
  loading?: boolean
  children: ReactNode
  showCart?: boolean
}

export function PortalShell({ customer, loading, children, showCart = false }: PortalShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  if (loading || !customer) {
    return (
      <div className="portal-root min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-9 h-9 animate-spin text-[var(--p-green)]" />
          <p className="text-sm text-[var(--p-muted)]">Loading your portal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="portal-root min-h-screen flex">
      <div className="hidden lg:block sticky top-0 h-screen">
        <PortalSidebar />
      </div>

      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden transition",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/35 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={cn(
            "absolute left-0 top-0 h-full shadow-xl transition-transform bg-white",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex justify-end p-2">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-lg hover:bg-[#F3F3F3]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="h-[calc(100%-48px)]">
            <PortalSidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <div className="sticky top-0 z-40 bg-[var(--p-bg)]/95 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-7 pt-3 pb-1">
            <button
              type="button"
              className="lg:hidden w-9 h-9 rounded-lg border border-[#E0E0E0] bg-white flex items-center justify-center"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="lg:hidden">
              <Image
                src="/logo.svg"
                alt="BuffIndia"
                width={120}
                height={36}
                className="h-8 w-auto object-contain"
                priority
              />
            </div>
            <div className="ml-auto">
              <PortalTopbar customer={customer} showCart={showCart} />
            </div>
          </div>
        </div>

        <main className="flex-1 px-4 sm:px-6 lg:px-7 pb-6 pt-2">{children}</main>
        <PortalFooter />
      </div>
    </div>
  )
}
