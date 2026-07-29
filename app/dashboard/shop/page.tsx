"use client"

import { useEffect, useMemo, useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  Box,
  CheckCircle2,
  Gift,
  Heart,
  Leaf,
  Loader2,
  Package,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react"
import { PortalShell } from "@/components/portal/portal-shell"
import { PageHeader } from "@/components/portal/page-header"
import { WhatsNewBanner } from "@/components/portal/whats-new-banner"
import { HowItWorksDialog } from "@/components/dashboard/shop/how-it-works-dialog"
import { ProductCard } from "@/components/dashboard/shop/product-card"
import { usePortalData } from "@/hooks/use-portal-data"
import type { ShopProduct } from "@/lib/cart-context"
import { SHOP_FILTER_CATEGORIES, formatInr } from "@/lib/kraftreborn-products"
import { formatIndianNumber, formatKg } from "@/lib/portal-metrics"
import { creditsToRupees } from "@/lib/kraftreborn"
import { useShopFavourites } from "@/hooks/use-shop-favourites"
import { cn } from "@/lib/utils"

const CATEGORIES = [
  { id: "favourites", label: "Favourites", icon: Heart },
  ...SHOP_FILTER_CATEGORIES.map((c) => ({ ...c, icon: Gift })),
] as const

function ShopContent() {
  const { customer, authLoading, dataLoading, metrics } = usePortalData()
  const { favouriteIds } = useShopFavourites()
  const searchParams = useSearchParams()
  const orderedId = searchParams.get("ordered")
  const [category, setCategory] = useState<string>("all")
  const [apiProducts, setApiProducts] = useState<ShopProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [ordersInProgress, setOrdersInProgress] = useState(0)
  const [ordersCompleted, setOrdersCompleted] = useState(0)
  const [showOrderedBanner, setShowOrderedBanner] = useState(Boolean(orderedId))

  useEffect(() => {
    if (orderedId) setShowOrderedBanner(true)
  }, [orderedId])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const [productsRes, ordersRes] = await Promise.all([
          fetch("/api/customer/products"),
          customer?.id
            ? fetch(`/api/customer/orders?customerId=${customer.id}`)
            : Promise.resolve(null),
        ])
        const productsData = await productsRes.json()
        if (productsData?.success) setApiProducts(productsData.products || [])
        if (ordersRes) {
          const ordersData = await ordersRes.json()
          if (ordersData?.success && Array.isArray(ordersData.orders)) {
            const orders = ordersData.orders as { status?: string }[]
            const norm = (s?: string) => (s || "").toLowerCase()
            const inProg = orders.filter((o) =>
              ["pending", "processing", "shipped"].includes(norm(o.status)),
            ).length
            const done = orders.filter((o) => norm(o.status) === "completed").length
            setOrdersInProgress(inProg)
            setOrdersCompleted(done)
          }
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [customer?.id])

  const catalog = apiProducts

  const filtered = useMemo(() => {
    if (category === "all") return catalog
    if (category === "favourites") return catalog.filter((p) => favouriteIds.includes(p.id))
    return catalog.filter((p) => (p.category || "").toLowerCase() === category.toLowerCase())
  }, [category, catalog, favouriteIds])

  const visible = showAll ? filtered : filtered.slice(0, 10)
  const rupeeAmount = creditsToRupees(Number(metrics.kraftrebornCredits) || 0)
  const productsClaimed = ordersCompleted

  return (
    <PortalShell customer={customer} loading={authLoading || (!customer && dataLoading)} showCart>
      <div className="space-y-5">
        {showOrderedBanner && orderedId ? (
          <div className="flex flex-col gap-2 rounded-2xl border border-[#C8E6D4] bg-[#E8F5E9] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1B7339]" />
              <div>
                <p className="text-[14px] font-semibold text-[#1A1A1A]">
                  Order {orderedId} placed successfully
                </p>
                <p className="text-[12px] text-[#5A5A5A]">
                  Track it anytime under Order & Claim History.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard/shop/orders" className="portal-btn-outline-green !h-9 text-[12px]">
                View orders
              </Link>
              <button
                type="button"
                className="h-9 rounded-full px-3 text-[12px] text-[#5A5A5A] hover:bg-white/70"
                onClick={() => setShowOrderedBanner(false)}
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : null}
        <PageHeader
          icon={Gift}
          title="Kraftreborn"
          subtitle="Sustainable products upcycled from cigarette waste — redeem with your rupee amount."
          actions={
            <>
              <HowItWorksDialog />
              <Link
                href="/dashboard/shop/store"
                className="portal-btn-outline-green inline-flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                Open Shop
              </Link>
            </>
          }
        />

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
          <div className="space-y-4 min-w-0">
            <WhatsNewBanner variant="kraft" />

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {[
                {
                  icon: Sparkles,
                  bg: "bg-[#E8F5E9]",
                  color: "text-[#1B7339]",
                  value: formatInr(rupeeAmount),
                  desc: "Rupee amount available",
                },
                {
                  icon: ShoppingBag,
                  bg: "bg-[#FFF3E0]",
                  color: "text-[#8D6E63]",
                  value: `₹${formatIndianNumber(rupeeAmount)}`,
                  desc: "Claim value (1:1 INR)",
                },
                {
                  icon: Package,
                  bg: "bg-[#E8F5E9]",
                  color: "text-[#1B7339]",
                  value: `${productsClaimed} Products Claimed`,
                  desc: "Completed orders",
                },
                {
                  icon: Truck,
                  bg: "bg-[#E3F2FD]",
                  color: "text-[#1565C0]",
                  value: `${ordersInProgress} Orders in Progress`,
                  descLink: "Track your orders",
                },
              ].map((card) => (
                <div key={card.value + (card.desc || "")} className="portal-card p-4 h-full min-h-[112px] flex flex-col">
                  <div className={`w-9 h-9 rounded-full ${card.bg} flex items-center justify-center mb-2.5`}>
                    <card.icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                  <p className="text-[13.5px] font-bold text-[#1A1A1A] leading-snug">{card.value}</p>
                  {"descLink" in card && card.descLink ? (
                    <Link href="/dashboard/shop/orders" className="portal-link text-[12px] mt-auto pt-1 inline-block">
                      {card.descLink}
                    </Link>
                  ) : (
                    <p className="text-[12px] text-[#8A8A8A] mt-auto pt-1">{card.desc}</p>
                  )}
                </div>
              ))}
            </div>

            <div>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <h2 className="text-[15px] font-semibold text-[#1A1A1A]">Shop by Category</h2>
                <Link
                  href="/dashboard/shop/store"
                  className="text-[12.5px] font-semibold text-[#1B7339] hover:underline"
                >
                  Full store →
                </Link>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {CATEGORIES.map((cat) => {
                  const active = category === cat.id
                  const Icon = "icon" in cat ? cat.icon : null
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setCategory(cat.id)
                        setShowAll(false)
                      }}
                      className={cn(
                        "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border text-[12.5px] font-medium transition-colors bg-white",
                        active
                          ? "border-[#1B7339] text-[#1B7339] bg-[#E8F5E9]"
                          : "border-[#D8D8D8] text-[#4A4A4A] hover:bg-[#FAFAFA]",
                      )}
                    >
                      {Icon && <Icon className="w-3.5 h-3.5" />}
                      {cat.label}
                    </button>
                  )
                })}
              </div>

              {loading && apiProducts.length === 0 ? (
                <div className="py-16 flex justify-center">
                  <Loader2 className="w-7 h-7 animate-spin text-[#1B7339]" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 auto-rows-fr">
                    {visible.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        forceImage={product.imageUrl || undefined}
                      />
                    ))}
                  </div>
                  {filtered.length === 0 && (
                    <p className="text-sm text-[#8A8A8A] text-center py-10">No products in this category yet.</p>
                  )}
                  {filtered.length > 10 && !showAll && (
                    <div className="flex justify-center mt-5">
                      <Link href="/dashboard/shop/store" className="portal-btn-outline-green">
                        View All Products →
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <aside className="space-y-3 xl:sticky xl:top-20">
            <div className="portal-card p-4">
              <h3 className="text-[13.5px] font-semibold text-[#1A1A1A] mb-3">Your Rupee Amount</h3>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#E8F5E9] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#1B7339]" />
                </div>
                <p className="text-[14px] font-bold text-[#1A1A1A]">{formatInr(rupeeAmount)}</p>
              </div>
              <Link
                href="/dashboard/shop/store"
                className="flex items-center justify-center w-full h-11 rounded-full bg-[#1B7339] text-white text-[13.5px] font-semibold hover:bg-[#145a2c]"
              >
                Redeem Now
              </Link>
              <Link
                href="/dashboard/shop/orders"
                className="mt-2.5 inline-block portal-link text-[12px]"
              >
                View claim history →
              </Link>
            </div>

            <div className="portal-card p-4">
              <h3 className="text-[13.5px] font-semibold text-[#1A1A1A] mb-3">Your Impact in Action</h3>
              <div className="space-y-2.5">
                {[
                  { icon: Leaf, text: `${formatKg(metrics.totalWasteKg)} Cigarette waste collected` },
                  { icon: Sparkles, text: `${formatKg(metrics.microplasticsKg)} Microplastics upcycled` },
                  { icon: Box, text: `${productsClaimed} Products created` },
                  { icon: Sparkles, text: `${formatInr(rupeeAmount)} Rupee amount` },
                ].map((row) => (
                  <div key={row.text} className="flex items-center gap-2.5 text-[12px] text-[#4A4A4A]">
                    <row.icon className="w-3.5 h-3.5 text-[#1B7339] shrink-0" />
                    {row.text}
                  </div>
                ))}
              </div>
              <Link href="/dashboard/impact" className="inline-block mt-3 portal-link text-[12px]">
                View Impact Summary →
              </Link>
            </div>

            <div className="portal-card p-4">
              <h3 className="text-[13.5px] font-semibold text-[#1A1A1A] mb-3">Order & Claim History</h3>
              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-[#7A7A7A]">Orders in Progress</span>
                  <span className="font-semibold">{ordersInProgress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7A7A7A]">Completed Orders</span>
                  <span className="font-semibold">{ordersCompleted}</span>
                </div>
              </div>
              <Link href="/dashboard/shop/orders" className="inline-block mt-3 portal-link text-[12px]">
                View All Orders →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </PortalShell>
  )
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F6F7F6] flex items-center justify-center text-sm text-[#7A7A7A]">
          Loading shop...
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  )
}
