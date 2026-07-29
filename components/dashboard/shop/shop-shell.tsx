"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"
import { useAuth } from "@/lib/auth-context"
import { PortalShell } from "@/components/portal/portal-shell"
import { ArrowLeft } from "lucide-react"

interface ShopShellProps {
  children: ReactNode
  title?: string
  subtitle?: string
  showBack?: boolean
  backHref?: string
}

export function ShopShell({
  children,
  title,
  subtitle,
  showBack = false,
  backHref = "/dashboard/shop",
}: ShopShellProps) {
  const { customer, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !customer) router.push("/login")
  }, [customer, isLoading, router])

  return (
    <PortalShell customer={customer} loading={isLoading || !customer} showCart>
      <div className="space-y-5">
        {(showBack || title || subtitle) && (
          <div className="flex items-center gap-3">
            {showBack && (
              <Link
                href={backHref}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#5A5A5A] transition-colors hover:text-[#1B7339] -ml-0.5"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            )}
            {(title || subtitle) && (
              <div className="min-w-0">
                {title && <h1 className="text-[20px] font-bold text-[#1A1A1A] truncate">{title}</h1>}
                {subtitle && <p className="text-[13px] text-[#7A7A7A]">{subtitle}</p>}
              </div>
            )}
          </div>
        )}
        {children}
      </div>
    </PortalShell>
  )
}
