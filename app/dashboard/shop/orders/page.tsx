"use client"

import { useEffect, useMemo, useState, Suspense } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Package, Truck } from "lucide-react"
import { PortalShell } from "@/components/portal/portal-shell"
import { PageHeader } from "@/components/portal/page-header"
import { usePortalData } from "@/hooks/use-portal-data"
import { formatInr } from "@/lib/kraftreborn-products"
import { cn } from "@/lib/utils"

type OrderRow = {
  id: string
  orderNumber: string
  status: string
  subtotal: number
  createdAt: string
  itemCount: number
}

function statusLabel(status: string) {
  const s = (status || "").toLowerCase()
  if (s === "completed") return "Completed"
  if (s === "shipped") return "Shipped"
  if (s === "processing") return "Processing"
  if (s === "pending") return "In Progress"
  return status || "Unknown"
}

function statusStyle(status: string) {
  const s = (status || "").toLowerCase()
  if (s === "completed") return "bg-[#E8F5E9] text-[#1B7339]"
  if (s === "shipped" || s === "processing") return "bg-[#E3F2FD] text-[#1565C0]"
  if (s === "pending") return "bg-[#FFF3E0] text-[#EF6C00]"
  return "bg-[#F0F0F0] text-[#6B6B6B]"
}

function OrdersContent() {
  const { customer, authLoading, dataLoading } = usePortalData()
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "progress" | "completed">("all")

  useEffect(() => {
    if (!customer?.id) return
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/customer/orders?customerId=${customer.id}`)
        const data = await res.json()
        if (data?.success) setOrders(data.orders || [])
      } finally {
        setLoading(false)
      }
    })()
  }, [customer?.id])

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const s = (o.status || "").toLowerCase()
      if (filter === "completed") return s === "completed"
      if (filter === "progress") return ["pending", "processing", "shipped"].includes(s)
      return true
    })
  }, [orders, filter])

  return (
    <PortalShell customer={customer} loading={authLoading || (!customer && dataLoading)} showCart>
      <div className="space-y-5">
        <PageHeader
          icon={Package}
          title="Orders & Claim History"
          subtitle="Track KraftReborn orders and claim status."
          actions={
            <Link href="/dashboard/shop" className="portal-btn-outline-green inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to KraftReborn
            </Link>
          }
        />

        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "all", label: "All orders" },
              { id: "progress", label: "In progress" },
              { id: "completed", label: "Completed / claimed" },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "h-9 rounded-full border px-3.5 text-[12.5px] font-medium",
                filter === f.id
                  ? "border-[#1B7339] bg-[#E8F5E9] text-[#1B7339]"
                  : "border-[#D8D8D8] bg-white text-[#4A4A4A]",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="portal-card overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-[#1B7339]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-14 text-center text-sm text-[#8A8A8A]">
              No orders yet.{" "}
              <Link href="/dashboard/shop/store" className="portal-link">
                Redeem in the shop →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#F0F0F0]">
              {filtered.map((o) => (
                <div key={o.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 shrink-0 text-[#1B7339]" />
                      <p className="text-[14px] font-semibold text-[#1A1A1A]">{o.orderNumber}</p>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          statusStyle(o.status),
                        )}
                      >
                        {statusLabel(o.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] text-[#7A7A7A]">
                      {new Date(o.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      · {o.itemCount} item{o.itemCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <p className="text-[14px] font-semibold text-[#1A1A1A]">{formatInr(o.subtotal)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PortalShell>
  )
}

export default function ShopOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F6F7F6] text-sm text-[#7A7A7A]">
          Loading orders...
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  )
}
