"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ShopShell } from "@/components/dashboard/shop/shop-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, ShoppingBag, Clock } from "lucide-react"
import { formatInr } from "@/lib/kraftreborn-products"

type CheckoutData = {
  orderId: string
  amount: number
  status?: string
  contactName: string
  email: string
  items?: { name: string; quantity: number; price: number }[]
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const [data, setData] = useState<CheckoutData | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("kraftreborn_checkout")
      if (raw) setData(JSON.parse(raw))
    } catch {
      // ignore
    }
  }, [])

  const orderId = data?.orderId || searchParams.get("order") || "—"
  const contactName = data?.contactName || "Partner"
  const isPending = data?.status === "pending" || !data?.status

  return (
    <ShopShell title="Order received">
      <div className="max-w-2xl mx-auto space-y-8 text-center">
        <div className="space-y-4">
          <div className="inline-flex w-14 h-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <Check className="w-7 h-7" />
          </div>
          <p className="text-xs tracking-[0.2em] uppercase text-stone-500">Order placed</p>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-900">Thank you, {contactName}.</h1>
          <p className="text-stone-600">
            Order <strong className="text-stone-900">{orderId}</strong> is confirmed.
            {data?.email ? ` Updates will be sent to ${data.email}.` : ""}
          </p>
          {data?.amount != null && (
            <p className="text-lg">
              Total: <strong>{formatInr(data.amount)}</strong>{" "}
              <Badge variant="outline" className="ml-2">KR credits</Badge>
            </p>
          )}
        </div>

        {isPending && (
          <Card className="border-amber-200/60 bg-amber-50/40 rounded-2xl text-left">
            <CardContent className="p-6 flex gap-4">
              <Clock className="w-8 h-8 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-stone-900">Pending fulfilment</p>
                <p className="text-sm text-stone-600 mt-1 leading-relaxed">
                  Our team will process your order. KR credits will be deducted when your order is marked{" "}
                  <strong>completed</strong>. You&apos;ll receive a notification and impact certificate then.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {data?.items && data.items.length > 0 && (
          <Card className="border-stone-200/60 bg-white/80 rounded-2xl text-left">
            <CardContent className="p-6 space-y-3">
              <p className="text-xs tracking-wider uppercase text-stone-500">Your order</p>
              {data.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-stone-600">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-medium">{formatInr(item.price * item.quantity)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button asChild variant="outline" className="rounded-full bg-white">
            <Link href="/dashboard/shop">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Continue shopping
            </Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    </ShopShell>
  )
}

export default function ShopSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  )
}
