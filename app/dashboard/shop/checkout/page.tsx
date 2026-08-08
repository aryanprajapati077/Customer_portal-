"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShopShell } from "@/components/dashboard/shop/shop-shell"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { creditsToRupees } from "@/lib/kraftreborn"
import { formatInr } from "@/lib/kraftreborn-products"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Sparkles, ShieldCheck, Upload, Wallet, CheckCircle2, AlertCircle, Building2, Stamp } from "lucide-react"
import { cn } from "@/lib/utils"
import { OrderReceiptAnimation } from "@/components/dashboard/shop/order-receipt-animation"

export default function CheckoutPage() {
  const { customer, refreshCustomerData } = useAuth()
  const { lines, subtotal, itemCount, clearCart } = useCart()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const orderPlacedRef = useRef(false)
  const [useKrCredits, setUseKrCredits] = useState(true)
  const [wantLogo, setWantLogo] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFileName, setLogoFileName] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [receiptData, setReceiptData] = useState<{
    orderNumber: string
    items: { name: string; quantity: number; price: number }[]
    total: number
  } | null>(null)
  const pendingNavRef = useRef<string | null>(null)

  const hasLogoEligibleItems = lines.some((l) => l.product.allowsLogo)
  const credits = creditsToRupees(Number(customer?.kraftrebornCredits) || 0)
  const canPayWithCredits = credits >= subtotal && subtotal > 0

  // Empty cart → back to cart, but never after a successful place-order
  // (clearCart would otherwise race and land on cart instead of KraftReborn).
  useEffect(() => {
    if (orderPlacedRef.current || submitting) return
    if (lines.length === 0) router.replace("/dashboard/shop/cart")
  }, [lines.length, router, submitting])

  useEffect(() => {
    if (!hasLogoEligibleItems) {
      setWantLogo(false)
      setLogoPreview(null)
    }
  }, [hasLogoEligibleItems])

  const handleLogoFile = (file: File | null) => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, SVG)")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setLogoPreview(reader.result as string)
      setLogoFileName(file.name)
    }
    reader.readAsDataURL(file)
  }

  const handlePlaceOrder = async () => {
    if (!customer || lines.length === 0) return

    if (!useKrCredits) {
      setError("Rupee amount balance is required for checkout in the partner portal shop.")
      return
    }

    if (!canPayWithCredits) {
      setError(`Insufficient rupee amount. You need ${formatInr(subtotal)} but have ${formatInr(credits)}.`)
      return
    }

    if (wantLogo && hasLogoEligibleItems && !logoPreview) {
      setError("Please upload your logo for customisation.")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/customer/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id,
          useKrCredits: true,
          logoRequested: wantLogo && hasLogoEligibleItems,
          logoBase64: wantLogo && logoPreview ? logoPreview : null,
          items: lines.map((l) => ({
            productId: l.productId || null,
            name: l.product.name,
            price: l.product.price,
            quantity: l.quantity,
            allowsLogo: l.product.allowsLogo,
            color: l.color || null,
          })),
        }),
      })

      const data = await res.json()
      if (!data.success) {
        setError(data.error || "Checkout failed")
        setSubmitting(false)
        return
      }

      sessionStorage.setItem(
        "kraftreborn_checkout",
        JSON.stringify({
          orderId: data.order.orderNumber,
          orderDbId: data.order.id,
          amount: data.order.subtotal,
          status: "pending",
          contactName: customer.contactPerson?.split(" ")[0] || customer.companyName,
          email: customer.email,
          items: lines.map((l) => ({
            name: l.product.name,
            quantity: l.quantity,
            price: l.product.price,
          })),
        }),
      )

      orderPlacedRef.current = true
      pendingNavRef.current = `/dashboard/shop?ordered=${encodeURIComponent(data.order.orderNumber)}`
      setReceiptData({
        orderNumber: data.order.orderNumber,
        items: lines.map((l) => ({
          name: l.product.name,
          quantity: l.quantity,
          price: l.product.price,
        })),
        total: data.order.subtotal,
      })
      setReceiptOpen(true)
      setSubmitting(false)
    } catch {
      setError("Network error. Please try again.")
      setSubmitting(false)
    }
  }

  const finishOrder = async () => {
    clearCart()
    await refreshCustomerData()
    if (pendingNavRef.current) {
      router.replace(pendingNavRef.current)
    }
  }

  if (lines.length === 0 && !receiptOpen) {
    return (
      <ShopShell showBack backHref="/dashboard/shop" title="Checkout">
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </ShopShell>
    )
  }

  return (
    <ShopShell showBack backHref="/dashboard/shop/cart" title="Checkout">
      <OrderReceiptAnimation
        open={receiptOpen}
        orderNumber={receiptData?.orderNumber ?? ""}
        companyName={customer?.companyName || "Your company"}
        items={receiptData?.items ?? []}
        total={receiptData?.total ?? 0}
        onComplete={() => {
          setReceiptOpen(false)
          void finishOrder()
        }}
      />

      <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
        <div className="space-y-6">
          <Card className="border-stone-200/60 bg-white/80 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-serif">Delivery details</CardTitle>
              <CardDescription>Ship to your registered company address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Company</Label>
                <Input value={customer?.companyName || ""} readOnly className="bg-stone-50/80 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Contact</Label>
                <Input value={customer?.contactPerson || ""} readOnly className="bg-stone-50/80 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={customer?.email || ""} readOnly className="bg-stone-50/80 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={customer?.address || "Address on file"} readOnly className="bg-stone-50/80 rounded-xl" />
              </div>
            </CardContent>
          </Card>

          {hasLogoEligibleItems && (
            <section className="relative overflow-hidden rounded-[1.5rem] border border-[#E8DCC8] bg-gradient-to-br from-[#FFF9F0] via-white to-[#F4F9F4] shadow-[0_8px_30px_rgba(27,115,57,0.06)]">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#1B7339]/8 blur-2xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-8 left-8 h-28 w-28 rounded-full bg-[#F5A623]/10 blur-2xl"
              />

              <div className="relative p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1B7339] to-[#2E9B52] text-white shadow-md">
                      <Stamp className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#B8860B]">
                        Branding upgrade
                      </p>
                      <h2 className="mt-0.5 font-[family-name:var(--font-display)] text-[1.15rem] font-bold text-[#141414]">
                        Custom logo on product
                      </h2>
                      <p className="mt-1 text-[13px] leading-relaxed text-[#6B6B6B]">
                        Make your order uniquely yours — we&apos;ll print your logo on eligible KraftReborn items.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={wantLogo}
                    onClick={() => setWantLogo((v) => !v)}
                    className={cn(
                      "relative h-8 w-14 shrink-0 rounded-full transition-colors duration-300",
                      wantLogo ? "bg-[#1B7339]" : "bg-[#D9D6CF]",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform duration-300",
                        wantLogo && "translate-x-6",
                      )}
                    />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {lines
                    .filter((l) => l.product.allowsLogo)
                    .map((l) => (
                      <span
                        key={l.productId}
                        className="inline-flex items-center rounded-full border border-[#E5DCC8] bg-white/80 px-2.5 py-1 text-[11px] font-medium text-[#5A5A5A]"
                      >
                        {l.product.name}
                      </span>
                    ))}
                </div>

                {wantLogo ? (
                  <div className="mt-5 space-y-4">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleLogoFile(e.target.files?.[0] || null)}
                    />

                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className={cn(
                        "group relative w-full overflow-hidden rounded-2xl border-2 border-dashed transition-all",
                        logoPreview
                          ? "border-[#1B7339]/40 bg-[#E8F5E9]/40"
                          : "border-[#D4C4A8] bg-white/70 hover:border-[#1B7339]/50 hover:bg-[#FAFFF9]",
                      )}
                    >
                      <div className="flex flex-col items-center justify-center gap-3 px-6 py-8 sm:flex-row sm:py-6">
                        {logoPreview ? (
                          <>
                            <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-white bg-white shadow-sm">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain p-2" />
                            </div>
                            <div className="text-center sm:text-left">
                              <p className="text-[14px] font-semibold text-[#141414]">{logoFileName}</p>
                              <p className="mt-0.5 text-[12px] text-[#1B7339]">Tap to replace logo</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1B7339]/10 text-[#1B7339] transition-transform group-hover:scale-105">
                              <Upload className="h-6 w-6" />
                            </div>
                            <div className="text-center sm:text-left">
                              <p className="text-[14px] font-semibold text-[#141414]">Drop your logo here</p>
                              <p className="mt-0.5 text-[12px] text-[#8A8A8A]">PNG or JPG · max 2MB recommended</p>
                            </div>
                          </>
                        )}
                      </div>
                    </button>

                    <div className="flex items-center gap-3 rounded-2xl border border-[#E5E2DA] bg-white/80 px-4 py-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F7F6F2]">
                        <Building2 className="h-4 w-4 text-[#1B7339]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-medium uppercase tracking-wide text-[#8A8A8A]">Preview label</p>
                        <p className="truncate text-[14px] font-semibold text-[#141414]">
                          {customer?.companyName || "Your brand"} · KraftReborn custom print
                        </p>
                      </div>
                      {logoPreview ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-[#1B7339]" />
                      ) : (
                        <AlertCircle className="h-5 w-5 shrink-0 text-[#D4A017]" />
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 rounded-xl bg-white/60 px-4 py-3 text-[12px] text-[#7A7A7A]">
                    Toggle on to add your company logo — perfect for corporate gifting and brand visibility.
                  </p>
                )}
              </div>
            </section>
          )}

          <section className="relative overflow-hidden rounded-[1.5rem] border border-[#D9E8DC] bg-gradient-to-br from-[#F8FBF9] via-white to-[#F7F6F2] shadow-[0_8px_30px_rgba(27,115,57,0.08)]">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-6 top-0 h-32 w-32 rounded-full bg-[#1B7339]/6 blur-3xl"
            />

            <div className="relative p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1B7339]/80">
                    Payment method
                  </p>
                  <h2 className="mt-0.5 font-[family-name:var(--font-display)] text-[1.15rem] font-bold text-[#141414]">
                    Pay with Rupee Amount
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#1B7339] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  <Sparkles className="h-3 w-3" />
                  Recommended
                </span>
              </div>

              <button
                type="button"
                onClick={() => setUseKrCredits(true)}
                className={cn(
                  "w-full rounded-2xl border-2 p-4 text-left transition-all",
                  useKrCredits
                    ? "border-[#1B7339] bg-white shadow-[0_4px_20px_rgba(27,115,57,0.12)]"
                    : "border-[#E5E2DA] bg-white/60",
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1B7339] to-[#2D8F4E] text-white shadow-md">
                    <Wallet className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[15px] font-bold text-[#141414]">Rupee Amount Wallet</span>
                      {useKrCredits && (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#1B7339] text-white">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[13px] text-[#6B6B6B]">
                      Deducted only when your order is marked completed
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-[#F7F6F2] px-3 py-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8A8A8A]">Available</p>
                        <p className="mt-0.5 text-[18px] font-bold text-[#1B7339]">{formatInr(credits)}</p>
                      </div>
                      <div className="rounded-xl bg-[#F7F6F2] px-3 py-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8A8A8A]">Order total</p>
                        <p className="mt-0.5 text-[18px] font-bold text-[#141414]">{formatInr(subtotal)}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="mb-1.5 flex justify-between text-[11px] font-medium">
                        <span className="text-[#6B6B6B]">Balance coverage</span>
                        <span className={canPayWithCredits ? "text-[#1B7339]" : "text-[#C62828]"}>
                          {Math.min(100, Math.round((credits / subtotal) * 100))}%
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-[#E8E8E8]">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            canPayWithCredits
                              ? "bg-gradient-to-r from-[#1B7339] to-[#4CAF50]"
                              : "bg-gradient-to-r from-[#F5A623] to-[#E53935]",
                          )}
                          style={{ width: `${Math.min(100, (credits / subtotal) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {!canPayWithCredits ? (
                      <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#FFCDD2] bg-[#FFEBEE] px-3 py-2.5">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#C62828]" />
                        <p className="text-[12px] leading-snug text-[#B71C1C]">
                          You need <strong>{formatInr(subtotal - credits)}</strong> more rupee amount to complete this order.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#C8E6D4] bg-[#E8F5E9] px-3 py-2.5">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-[#1B7339]" />
                        <p className="text-[12px] font-medium text-[#1B7339]">
                          You&apos;re all set — balance covers this order.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            </div>
          </section>
        </div>

        <div>
          <div className="sticky top-36 overflow-hidden rounded-[1.5rem] border border-[#DCE8DC] bg-gradient-to-br from-white via-[#FAFFFB] to-[#F4F9F5] shadow-[0_12px_40px_rgba(27,115,57,0.1)]">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#C8F000]/15 blur-2xl"
            />
            <div className="relative border-b border-[#E8F0EA] px-6 py-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#1B7339]/75">
                Your order
              </p>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-[#141414]">
                Order summary
              </h2>
            </div>
            <div className="relative space-y-4 px-6 py-5">
              <div className="space-y-3 max-h-64 overflow-auto">
                {lines.map((line) => (
                  <div key={line.productId} className="flex justify-between gap-2 text-sm">
                    <span className="text-stone-600">
                      {line.product.name} × {line.quantity}
                      {line.product.allowsLogo && wantLogo ? " (+ logo)" : ""}
                    </span>
                    <span className="font-medium shrink-0">{formatInr(line.lineTotal)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-stone-200 pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-500">Subtotal ({itemCount} items)</span>
                  <span>{formatInr(subtotal)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-1">
                  <span>Total</span>
                  <span>{formatInr(subtotal)}</span>
                </div>
              </div>

              <p className="text-xs text-[#6B6B6B] bg-[#F7F6F2] rounded-lg p-3">
                Your order will be reviewed by our team. Rupee amount is deducted only when the order status is marked
                completed.
              </p>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                size="lg"
                className="w-full rounded-full h-12 bg-[#1B7339] hover:bg-[#145a2c] shadow-[0_6px_24px_rgba(27,115,57,0.3)]"
                onClick={handlePlaceOrder}
                disabled={submitting || !useKrCredits || !canPayWithCredits || receiptOpen}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Placing order...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Place order with rupee amount
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ShopShell>
  )
}
