"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
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
import {
  Loader2,
  Package,
  FileDown,
  RefreshCw,
  CheckCircle2,
  Truck,
  Clock,
  XCircle,
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
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.orderNumber}</SheetTitle>
                <SheetDescription>{selected.customer.companyName}</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={orderStatusColor(selected.status)}>
                    {orderStatusLabel(selected.status)}
                  </Badge>
                  <Badge variant="outline">{formatInr(selected.subtotal)}</Badge>
                  {selected.useKrCredits && (
                    <Badge variant="outline">
                      KR Credits {selected.creditsDeducted ? "✓ deducted" : "pending"}
                    </Badge>
                  )}
                </div>

                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Contact:</span> {selected.customer.contactPerson || "—"}</p>
                  <p><span className="text-muted-foreground">Email:</span> {selected.customer.email}</p>
                  <p><span className="text-muted-foreground">Credits balance:</span> {formatInr(Math.floor(selected.customer.kraftrebornCredits))}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-2">Line items</p>
                  <div className="space-y-2">
                    {selected.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm p-2 rounded-lg bg-muted/30">
                        <span>
                          {item.productName} × {item.quantity}
                          {item.allowsLogo ? " (logo)" : ""}
                        </span>
                        <span>{formatInr(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selected.logoRequested && selected.logoUrl && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Customer logo</p>
                    <div className="relative w-24 h-24 rounded-lg border overflow-hidden bg-white">
                      <Image src={selected.logoUrl} alt="Customer logo" fill className="object-contain p-2" />
                    </div>
                  </div>
                )}

                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => downloadPdf(selected.id, selected.orderNumber)}
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Download order sheet PDF
                </Button>

                <div className="space-y-2 pt-2 border-t">
                  <p className="text-sm font-semibold">Update status</p>
                  <div className="grid grid-cols-2 gap-2">
                    {ORDER_STATUSES.filter((s) => s !== selected.status).map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={s === "completed" ? "default" : "outline"}
                        disabled={updating}
                        onClick={() => updateStatus(selected.id, s)}
                      >
                        {orderStatusLabel(s)}
                      </Button>
                    ))}
                  </div>
                  {selected.status !== "completed" && (
                    <p className="text-xs text-muted-foreground">
                      Marking as <strong>Completed</strong> deducts KR credits and generates the customer impact certificate.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
