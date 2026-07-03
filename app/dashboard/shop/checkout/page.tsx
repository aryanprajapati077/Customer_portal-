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
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Sparkles, ShieldCheck, Upload, ImageIcon } from "lucide-react"

export default function CheckoutPage() {
  const { customer } = useAuth()
  const { lines, subtotal, itemCount, clearCart } = useCart()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [useKrCredits, setUseKrCredits] = useState(true)
  const [wantLogo, setWantLogo] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFileName, setLogoFileName] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasLogoEligibleItems = lines.some((l) => l.product.allowsLogo)
  const credits = creditsToRupees(Number(customer?.kraftrebornCredits) || 0)
  const canPayWithCredits = credits >= subtotal && subtotal > 0

  useEffect(() => {
    if (lines.length === 0) router.replace("/dashboard/shop/cart")
  }, [lines.length, router])

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
      setError("KR credits are required for checkout in the partner portal shop.")
      return
    }

    if (!canPayWithCredits) {
      setError(`Insufficient KR credits. You need ${formatInr(subtotal)} but have ${formatInr(credits)}.`)
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
            productId: l.productId,
            name: l.product.name,
            price: l.product.price,
            quantity: l.quantity,
            allowsLogo: l.product.allowsLogo,
          })),
        }),
      })

      const data = await res.json()
      if (!data.success) {
        setError(data.error || "Checkout failed")
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

      clearCart()
      router.push(`/dashboard/shop/success?order=${encodeURIComponent(data.order.orderNumber)}`)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (lines.length === 0) {
    return (
      <ShopShell showBack backHref="/dashboard/shop/cart" title="Checkout">
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </ShopShell>
    )
  }

  return (
    <ShopShell showBack backHref="/dashboard/shop/cart" title="Checkout">
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
            <Card className="border-amber-200/60 bg-amber-50/30 rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-amber-600" />
                  Custom logo on product
                </CardTitle>
                <CardDescription>Some items in your cart support logo customisation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="flex items-start gap-3 cursor-pointer"
                  onClick={() => setWantLogo(!wantLogo)}
                >
                  <Checkbox checked={wantLogo} onCheckedChange={(v) => setWantLogo(Boolean(v))} />
                  <div>
                    <p className="font-medium text-sm">Yes, add my company logo on products</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Upload PNG or JPG — max recommended 2MB</p>
                  </div>
                </div>

                {wantLogo && (
                  <div className="space-y-3 pl-7">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleLogoFile(e.target.files?.[0] || null)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full bg-white"
                      onClick={() => fileRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {logoFileName ? "Change logo" : "Upload logo"}
                    </Button>
                    {logoPreview && (
                      <div className="flex items-center gap-4 p-3 rounded-xl bg-white border border-stone-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={logoPreview} alt="Logo preview" className="h-12 w-12 object-contain rounded" />
                        <span className="text-sm text-stone-600 truncate">{logoFileName}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="border-stone-200/60 bg-white/80 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-serif">Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-colors cursor-pointer ${
                  useKrCredits ? "border-amber-500 bg-amber-50/50" : "border-stone-200 bg-white/50"
                }`}
                onClick={() => setUseKrCredits(true)}
              >
                <Checkbox checked={useKrCredits} onCheckedChange={() => setUseKrCredits(true)} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span className="font-semibold">Use KR Credits</span>
                    <Badge variant="outline" className="text-[10px]">Recommended</Badge>
                  </div>
                  <p className="text-sm text-stone-600 mt-1">
                    Balance: <strong>{formatInr(credits)}</strong> · Credits deducted when order is completed
                  </p>
                  {!canPayWithCredits && (
                    <p className="text-sm text-destructive mt-2">
                      Need {formatInr(subtotal - credits)} more credits for this order.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="border-stone-200/60 bg-white/90 rounded-2xl shadow-md sticky top-36">
            <CardHeader>
              <CardTitle className="text-lg font-serif">Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <p className="text-xs text-stone-500 bg-stone-50 rounded-lg p-3">
                Your order will be reviewed by our team. KR credits are deducted only when the order status is marked
                completed.
              </p>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                size="lg"
                className="w-full rounded-full h-12"
                onClick={handlePlaceOrder}
                disabled={submitting || !useKrCredits || !canPayWithCredits}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Placing order...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Place order with KR credits
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </ShopShell>
  )
}
