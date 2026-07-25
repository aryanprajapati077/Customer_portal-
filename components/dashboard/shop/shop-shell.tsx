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
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#D0D0D0] bg-white text-[13px] font-medium text-[#1A1A1A] hover:bg-[#FAFAFA]"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
            )}
            <div>
              {title && <h1 className="text-[20px] font-bold text-[#1A1A1A]">{title}</h1>}
              {subtitle && <p className="text-[13px] text-[#7A7A7A]">{subtitle}</p>}
            </div>
          </div>
        )}
        {children}
      </div>
    </PortalShell>
  )
}
