"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AdminAuthShell } from "@/components/admin/admin-auth-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Loader2, CheckCircle2, ArrowLeft, Lock } from "lucide-react"

export default function AdminResetPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<"otp" | "password" | "done">("otp")
  const [otp, setOtp] = useState("")
  const [email, setEmail] = useState("")
  const [resetToken, setResetToken] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_reset_email")
    if (saved) setEmail(saved)
  }, [])

  const verify = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp, email }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || "Invalid code")
        return
      }
      setResetToken(data.resetToken)
      if (data.email) setEmail(data.email)
      setStep("password")
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const reset = async () => {
    if (password.length < 8) {
      setError("Min 8 characters")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, password, email }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || "Failed")
        return
      }
      setStep("done")
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const subtitle =
    step === "otp"
      ? "Enter the 6-digit OTP sent to your admin email."
      : step === "password"
        ? "Choose a strong new password (at least 8 characters)."
        : "Your password was updated. You can sign in now."

  return (
    <AdminAuthShell title="Set a new" accent="password" subtitle={subtitle}>
      <div className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        {step === "otp" && (
          <>
            {email && (
              <p className="text-center text-[13px] text-[#6B6B6B]">
                Code for <strong className="text-[#1B7339]">{email}</strong>
              </p>
            )}
            <div className="flex justify-center py-2">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} className="h-12 w-10 text-base" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button
              className="h-12 w-full rounded-full bg-[#1B7339] hover:bg-[#145a2c]"
              onClick={verify}
              disabled={loading || otp.length !== 6}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify OTP"}
            </Button>
          </>
        )}

        {step === "password" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A8A]" />
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl border-[#E5E7EB] bg-[#FAFAFA] pl-10 focus-visible:ring-[#1B7339]"
                  placeholder="At least 8 characters"
                />
              </div>
            </div>
            <Button
              className="h-12 w-full rounded-full bg-[#1B7339] hover:bg-[#145a2c]"
              onClick={reset}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
            </Button>
          </>
        )}

        {step === "done" && (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-[#1B7339]" />
            <p className="text-[14px] text-[#4A4A4A]">Password updated successfully.</p>
            <Button
              className="h-12 w-full rounded-full bg-[#1B7339] hover:bg-[#145a2c]"
              onClick={() => router.push("/admin/login")}
            >
              Sign in to admin
            </Button>
          </div>
        )}

        <Link
          href="/admin/login"
          className="inline-flex items-center gap-1.5 text-[13px] text-[#6B6B6B] hover:text-[#141414]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to admin login
        </Link>
      </div>
    </AdminAuthShell>
  )
}
