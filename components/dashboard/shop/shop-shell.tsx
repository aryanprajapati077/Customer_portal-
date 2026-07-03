"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { creditsToRupees } from "@/lib/kraftreborn"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, ShoppingCart, Sparkles } from "lucide-react"

interface ShopShellProps {
  children: React.ReactNode
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
  backHref = "/dashboard",
}: ShopShellProps) {
  const { customer, isLoading } = useAuth()
  const { itemCount } = useCart()
  const router = useRouter()
  const credits = creditsToRupees(Number(customer?.kraftrebornCredits) || 0)

  useEffect(() => {
    if (!isLoading && !customer) router.push("/login")
  }, [customer, isLoading, router])

  if (isLoading || !customer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f5f0]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <DashboardHeader customer={customer} />

        <div className="border-b border-stone-200/50 bg-white/70 backdrop-blur-md sticky top-16 z-40 shadow-sm">
          <div className="container mx-auto px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {showBack && (
                <Button variant="ghost" size="sm" asChild className="shrink-0">
                  <Link href={backHref}>
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                  </Link>
                </Button>
              )}
              <div className="min-w-0">
                <Link href="/dashboard/shop" className="font-serif text-xl font-bold hover:text-primary transition-colors">
                  Kraft Reborn Shop
                </Link>
                {(title || subtitle) && (
                  <p className="text-xs text-muted-foreground truncate">
                    {title}
                    {subtitle ? ` · ${subtitle}` : ""}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="bg-white/60 gap-1 hidden sm:flex">
                <Sparkles className="w-3 h-3" />
                {credits.toLocaleString("en-IN")} KR credits
              </Badge>
              <Button variant="outline" size="sm" asChild className="relative bg-white/60">
                <Link href="/dashboard/shop/cart">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Cart
                  {itemCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                      {itemCount > 99 ? "99+" : itemCount}
                    </span>
                  )}
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <main className="container mx-auto px-4 lg:px-8 py-8">{children}</main>
      </div>
    </div>
  )
}
