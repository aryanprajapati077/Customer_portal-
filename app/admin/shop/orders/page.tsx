"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { formatInr } from "@/lib/kraftreborn-products"
import { ORDER_STATUSES, orderStatusColor, orderStatusLabel } from "@/lib/shop-constants"
import { cn } from "@/lib/utils"
import {
  Loader2,
  Package,
  FileDown,
  RefreshCw,
  CheckCircle2,
  Truck,
  Clock,
  XCircle,
  ImageIcon,
  ExternalLink,
  Mail,
  User,
  Wallet,
} from "lucide-react"

type OrderRow = {
  id: string
  orderNumber: string
  status: string
  subtotal: number
  useKrCredits: boolean
  creditsDeducted: boolean
  logoRequested: boolean
  logoUrl: string | null
  notes: string | null
  createdAt: string
  completedAt: string | null
  itemCount: number
  customer: {
    id: string
    companyName: string
    email: string
    contactPerson: string | null
    kraftrebornCredits: number
  }
  items: {
    id: string
    productName: string
    price: number
    quantity: number
    allowsLogo: boolean
  }[]
}

export default function AdminOrdersPage() {
  const [rows, setRows] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [selected, setSelected] = useState<OrderRow | null>(null)
  const [updating, setUpdating] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const qs = statusFilter !== "all" ? `?status=${statusFilter}` : ""
      const res = await fetch(`/api/admin/orders${qs}`)
      const data = await res.json()
      if (data?.success) setRows(data.orders || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [statusFilter])

  const pendingCount = useMemo(() => rows.filter((r) => r.status === "pending").length, [rows])

  const updateStatus = async (id: string, status: string) => {
    setUpdating(true)
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })
      const data = await res.json()
      if (data?.success) {
        await load()
        if (selected?.id === id) {
          const res2 = await fetch(`/api/admin/orders${statusFilter !== "all" ? `?status=${statusFilter}` : ""}`)
          const data2 = await res2.json()
          const updated = (data2.orders as OrderRow[] | undefined)?.find((o) => o.id === id)
          if (updated) setSelected(updated)
        }
      } else {
        alert(data.error || "Update failed")
      }
    } finally {
      setUpdating(false)
    }
  }

  const downloadPdf = (orderId: string, orderNumber: string) => {
    window.open(`/api/admin/orders/pdf?orderId=${orderId}`, "_blank")
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return Clock
      case "processing":
        return RefreshCw
      case "shipped":
        return Truck
      case "completed":
        return CheckCircle2
      case "cancelled":
        return XCircle
      default:
        return Package
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            Shop Orders
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage fulfilment · download order sheets · deduct KR credits on completion
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <Badge className="bg-amber-500">{pendingCount} pending</Badge>
          )}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {orderStatusLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Orders</CardTitle>
          <CardDescription>{rows.length} orders · click to view details & download PDF</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {rows.map((order) => {
                const Icon = statusIcon(order.status)
                return (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => setSelected(order)}
                    className="w-full text-left p-4 rounded-2xl border border-border/50 bg-muted/20 hover:bg-muted/40 hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold">{order.orderNumber}</p>
                            <Badge variant="outline" className={orderStatusColor(order.status)}>
                              {orderStatusLabel(order.status)}
                            </Badge>
                            {order.logoRequested && (
                              <Badge variant="outline" className="text-[10px]">Logo</Badge>
                            )}
                            {order.creditsDeducted && (
                              <Badge variant="outline" className="text-[10px] text-emerald-700">Credits deducted</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {order.customer.companyName} · {order.itemCount} items · {formatInr(order.subtotal)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          downloadPdf(order.id, order.orderNumber)
                        }}
                      >
                        <FileDown className="w-4 h-4 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg">
          {selected && (
            <div className="flex flex-col min-h-full">
              <div className="border-b border-[#E8EEE9] bg-[#F7FBF7] px-6 py-5">
                <SheetHeader className="space-y-2 p-0 text-left">
                  <div className="flex items-start justify-between gap-3 pr-6">
                    <div className="min-w-0 space-y-1">
                      <SheetTitle className="font-[family-name:var(--font-display)] text-xl text-[#141414] truncate">
                        {selected.orderNumber}
                      </SheetTitle>
                      <SheetDescription className="text-[13px] text-[#5A5A5A]">
                        {selected.customer.companyName}
                      </SheetDescription>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("shrink-0 text-[11px] font-medium", orderStatusColor(selected.status))}
                    >
                      {orderStatusLabel(selected.status)}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="inline-flex items-center rounded-full border border-[#DCE6DF] bg-white px-2.5 py-1 text-[12px] font-medium text-[#1B7339]">
                      {formatInr(selected.subtotal)}
                    </span>
                    {selected.useKrCredits && (
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-1 text-[12px] font-medium",
                          selected.creditsDeducted
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-amber-200 bg-amber-50 text-amber-700",
                        )}
                      >
                        {selected.creditsDeducted ? "KR deducted" : "KR pending"}
                      </span>
                    )}
                    {selected.logoRequested && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#DCE6DF] bg-white px-2.5 py-1 text-[12px] font-medium text-[#3D3D3D]">
                        <ImageIcon className="h-3 w-3 text-[#1B7339]" />
                        Logo order
                      </span>
                    )}
                  </div>
                </SheetHeader>
              </div>

              <div className="space-y-5 px-6 py-5 pb-10">
                <section className="rounded-2xl border border-[#E5EBE6] bg-white p-4 space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#1B7339]">
                    Customer
                  </p>
                  <div className="space-y-2.5 text-[13px]">
                    <div className="flex items-center gap-2.5 text-[#141414]">
                      <User className="h-4 w-4 shrink-0 text-[#1B7339]/70" />
                      <span>{selected.customer.contactPerson || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[#141414]">
                      <Mail className="h-4 w-4 shrink-0 text-[#1B7339]/70" />
                      <span className="truncate">{selected.customer.email}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[#141414]">
                      <Wallet className="h-4 w-4 shrink-0 text-[#1B7339]/70" />
                      <span>
                        Credits balance{" "}
                        <strong>{formatInr(Math.floor(selected.customer.kraftrebornCredits))}</strong>
                      </span>
                    </div>
                  </div>
                </section>

                <section className="space-y-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#1B7339]">
                    Line items
                  </p>
                  <div className="overflow-hidden rounded-2xl border border-[#E5EBE6]">
                    {selected.items.map((item, idx) => (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-start justify-between gap-3 bg-white px-4 py-3 text-[13px]",
                          idx > 0 && "border-t border-[#EEF2EF]",
                        )}
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-[#141414]">{item.productName}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-[#6B6B6B]">
                            <span>× {item.quantity}</span>
                            {item.allowsLogo && (
                              <span className="rounded-md bg-[#F0F7F2] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1B7339]">
                                Logo eligible
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="shrink-0 font-semibold text-[#141414]">
                          {formatInr(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                {selected.logoRequested && (
                  <section className="rounded-2xl border border-[#E5EBE6] bg-[#F7FBF7] p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#1B7339]">
                        Customer logo
                      </p>
                      {selected.logoUrl ? (
                        <a
                          href={selected.logoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[12px] font-medium text-[#1B7339] hover:underline"
                        >
                          Open full size
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : null}
                    </div>
                    {selected.logoUrl ? (
                      <div className="flex items-center justify-center rounded-xl border border-[#DCE6DF] bg-white p-6">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selected.logoUrl}
                          alt="Customer logo for this order"
                          className="max-h-40 max-w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#C9D9CF] bg-white/70 px-4 py-8 text-center">
                        <ImageIcon className="h-8 w-8 text-[#9BB5A3]" />
                        <p className="text-[13px] font-medium text-[#3D3D3D]">Logo requested</p>
                        <p className="max-w-[240px] text-[12px] text-[#7A7A7A]">
                          Customer asked for logo customisation but did not upload a file with this order.
                        </p>
                      </div>
                    )}
                  </section>
                )}

                <Button
                  className="h-11 w-full rounded-xl border-[#C9D9CF] bg-white text-[#1B7339] hover:bg-[#F0F7F2] hover:text-[#145a2c]"
                  variant="outline"
                  onClick={() => downloadPdf(selected.id, selected.orderNumber)}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Download order sheet PDF
                </Button>

                <section className="rounded-2xl border border-[#E5EBE6] bg-white p-4 space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#1B7339]">
                    Update status
                  </p>
                  <p className="text-[12px] text-[#6B6B6B]">
                    Current status:{" "}
                    <span className="font-semibold text-[#141414]">
                      {orderStatusLabel(selected.status)}
                    </span>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {ORDER_STATUSES.map((s) => {
                      const isCurrent = s === selected.status
                      const isDanger = s === "cancelled"
                      const isDone = s === "completed"
                      return (
                        <button
                          key={s}
                          type="button"
                          disabled={updating || isCurrent}
                          onClick={() => updateStatus(selected.id, s)}
                          className={cn(
                            "h-10 rounded-xl border text-[13px] font-medium transition-colors disabled:opacity-100",
                            isCurrent &&
                              "border-[#1B7339] bg-[#E8F5E9] text-[#1B7339] cursor-default",
                            !isCurrent &&
                              !isDanger &&
                              !isDone &&
                              "border-[#E5E5E5] bg-white text-[#3D3D3D] hover:border-[#1B7339]/40 hover:bg-[#F7FBF7]",
                            !isCurrent &&
                              isDone &&
                              "border-[#1B7339]/30 bg-white text-[#1B7339] hover:bg-[#E8F5E9]",
                            !isCurrent &&
                              isDanger &&
                              "border-red-200 bg-white text-red-600 hover:bg-red-50",
                            updating && "opacity-60",
                          )}
                        >
                          {isCurrent ? `✓ ${orderStatusLabel(s)}` : orderStatusLabel(s)}
                        </button>
                      )
                    })}
                  </div>
                  {selected.status !== "completed" && selected.status !== "cancelled" && (
                    <p className="text-[11px] leading-relaxed text-[#7A7A7A]">
                      <strong className="text-[#3D3D3D]">Shipped</strong> emails the dispatch notice.{" "}
                      <strong className="text-[#3D3D3D]">Completed</strong> deducts KR credits,
                      generates the impact certificate, and emails the delivered notice.
                    </p>
                  )}
                  {updating && (
                    <div className="flex items-center gap-2 text-[12px] text-[#1B7339]">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Updating status…
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
