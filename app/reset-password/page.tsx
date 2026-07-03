"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthRecycleBackground } from "@/components/auth/auth-recycle-background"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Lock, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react"
import Image from "next/image"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [resetToken, setResetToken] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [step, setStep] = useState<"otp" | "password" | "done">("otp")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const saved = sessionStorage.getItem("reset_email")
    if (saved) setEmail(saved)
  }, [])

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      setError("Enter the 6-digit OTP")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || "Invalid OTP")
        return
      }
      setResetToken(data.resetToken)
      setStep("password")
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async () => {
    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, resetToken, password }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || "Reset failed")
        return
      }
      sessionStorage.removeItem("reset_email")
      sessionStorage.removeItem("dev_otp")
      setStep("done")
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <AuthRecycleBackground />
      <div className="w-full max-w-md relative z-10">
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
          <Image src="/logo.svg" alt="Buffindia" width={48} height={48} />
          <span className="text-2xl font-bold">
            Buff<span className="text-primary">india</span>
          </span>
        </Link>

        <Card className="glass border-border/50 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-serif">Reset password</CardTitle>
            <CardDescription>
              {step === "otp" && "Enter the OTP from your email"}
              {step === "password" && "Choose a new password"}
              {step === "done" && "All set!"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {step === "otp" && (
              <>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="rounded-xl" />
                </div>
                <div className="flex flex-col items-center gap-3">
                  <Label>One-time password</Label>
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button onClick={verifyOtp} disabled={loading} className="w-full h-12 rounded-xl">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify OTP"}
                </Button>
              </>
            )}

            {step === "password" && (
              <>
                <div className="space-y-2">
                  <Label>New password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12 rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Confirm password</Label>
                  <Input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>
                <Button onClick={resetPassword} disabled={loading} className="w-full h-12 rounded-xl">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update password"}
                </Button>
              </>
            )}

            {step === "done" && (
              <div className="text-center space-y-4 py-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <p className="text-sm text-muted-foreground">Your password has been updated.</p>
                <Button className="w-full rounded-xl" onClick={() => router.push("/login")}>
                  Sign in
                </Button>
              </div>
            )}

            <div className="text-center pt-2">
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                Resend OTP
              </Link>
              {" · "}
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" />
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
