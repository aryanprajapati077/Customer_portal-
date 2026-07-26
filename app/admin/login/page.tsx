"use client"

import { Suspense, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { AdminAuthShell } from "@/components/admin/admin-auth-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, Lock, Shield, KeyRound } from "lucide-react"
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
  const autoSubmitted = useRef("")

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

  const onSubmitTotp = async (overrideCode?: string) => {
    const code = (overrideCode ?? totpCode).trim()
    if (code.length !== 6 || isSubmitting) return
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totpCode: code }),
      })
      const data = await res.json()
      if (!data?.success) {
        setError(data?.error || "Invalid code")
        autoSubmitted.current = ""
        return
      }
      finishLogin()
    } catch {
      setError("Network error")
      autoSubmitted.current = ""
    } finally {
      setIsSubmitting(false)
    }
  }

  const onTotpChange = (value: string) => {
    setTotpCode(value)
    if (value.length === 6 && autoSubmitted.current !== value) {
      autoSubmitted.current = value
      void onSubmitTotp(value)
    }
  }

  return (
    <AdminAuthShell
      title={step === "totp" ? "Verify your" : "Sign in"}
      accent={step === "totp" ? "authenticator" : "admin"}
      subtitle={
        step === "totp"
          ? "Enter the 6-digit code from Google Authenticator, Authy, or 1Password."
          : "Use your admin email and password. 2FA is required when enabled."
      }
    >
      <div className="space-y-4">
        {step === "credentials" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A8A]" />
                <Input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@buffindia.com"
                  className="h-12 rounded-xl border-[#E5E7EB] bg-[#FAFAFA] pl-10 focus-visible:ring-[#1B7339]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="admin-password">Password</Label>
                <Link
                  href="/admin/forgot-password"
                  className="text-xs font-medium text-[#1B7339] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A8A]" />
                <Input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onSubmitCredentials()}
                  placeholder="Enter password"
                  className="h-12 rounded-xl border-[#E5E7EB] bg-[#FAFAFA] pl-10 focus-visible:ring-[#1B7339]"
                />
              </div>
            </div>
            <Button
              className="h-12 w-full rounded-full bg-[#1B7339] text-[15px] font-semibold hover:bg-[#145a2c]"
              onClick={onSubmitCredentials}
              disabled={isSubmitting || !email || !password}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
              {isSubmitting ? "Signing in..." : "Sign in to admin"}
            </Button>
          </>
        ) : (
          <>
            <div className="rounded-2xl border border-[#E2EBE4] bg-[#F7FBF7] px-4 py-3 text-center text-[13px] text-[#4A4A4A]">
              Code for <strong className="text-[#1B7339]">{email}</strong>
            </div>
            <div className="flex justify-center py-2">
              <InputOTP maxLength={6} value={totpCode} onChange={onTotpChange} autoFocus>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} className="h-12 w-10 text-base" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button
              className="h-12 w-full rounded-full bg-[#1B7339] text-[15px] font-semibold hover:bg-[#145a2c]"
              onClick={() => onSubmitTotp()}
              disabled={isSubmitting || totpCode.length !== 6}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="mr-2 h-4 w-4" />
              )}
              Verify & sign in
            </Button>
            <Button
              variant="ghost"
              className="w-full text-[#6B6B6B]"
              onClick={() => {
                setStep("credentials")
                setTotpCode("")
                setError(null)
                autoSubmitted.current = ""
              }}
            >
              ← Back to sign in
            </Button>
          </>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-center text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
    </AdminAuthShell>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-[#1B7339]" />
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  )
}
