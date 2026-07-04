"use client"

import { Suspense, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { AuthRecycleBackground } from "@/components/auth/auth-recycle-background"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Loader2, ArrowLeft, KeyRound } from "lucide-react"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = useMemo(() => searchParams.get("next") || "/admin", [searchParams])

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [totpCode, setTotpCode] = useState("")
  const [step, setStep] = useState<"credentials" | "totp">("credentials")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const finishLogin = () => {
    router.push(nextPath)
    router.refresh()
  }

  const onSubmitCredentials = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (data.requiresTotp) {
        setStep("totp")
        return
      }
      if (!data?.success) {
        setError(data?.error || "Login failed")
        return
      }
      finishLogin()
    } catch {
      setError("Network error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSubmitTotp = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totpCode }),
      })
      const data = await res.json()
      if (!data?.success) {
        setError(data?.error || "Invalid code")
        return
      }
      finishLogin()
    } catch {
      setError("Network error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <AuthRecycleBackground />

      <div className="w-full max-w-md relative z-10">
        <Card className="glass border-border/50 shadow-2xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                {step === "totp" ? <KeyRound className="w-5 h-5 text-primary" /> : <Shield className="w-5 h-5 text-primary" />}
              </div>
              <div>
                <CardTitle className="font-serif">Admin Panel</CardTitle>
                <CardDescription>
                  {step === "totp" ? "Enter authenticator code" : "Sign in with email and password"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === "credentials" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@buffindia.com"
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && onSubmitCredentials()}
                    placeholder="Enter password"
                    className="h-12 rounded-xl"
                  />
                </div>
                <Button
                  className="w-full h-12 rounded-xl"
                  onClick={onSubmitCredentials}
                  disabled={isSubmitting || !email || !password}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {isSubmitting ? "Signing in..." : "Sign in"}
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground text-center">
                  Open Google Authenticator, Authy, or 1Password and enter the 6-digit code for <strong>{email}</strong>.
                </p>
                <div className="flex justify-center py-2">
                  <InputOTP maxLength={6} value={totpCode} onChange={setTotpCode}>
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button
                  className="w-full h-12 rounded-xl"
                  onClick={onSubmitTotp}
                  disabled={isSubmitting || totpCode.length !== 6}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Verify & sign in
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => { setStep("credentials"); setTotpCode(""); setError(null) }}>
                  ← Back to sign in
                </Button>
              </>
            )}

            {error && <div className="text-sm text-destructive text-center">{error}</div>}

            {step === "credentials" && (
              <div className="text-center">
                <Link href="/admin/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Customer portal sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  )
}
