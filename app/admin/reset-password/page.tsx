"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthRecycleBackground } from "@/components/auth/auth-recycle-background"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react"
import { useEffect } from "react"

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
    const res = await fetch("/api/admin/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otp, email }),
    })
    const data = await res.json()
    setLoading(false)
    if (!data.success) {
      setError(data.error)
      return
    }
    setResetToken(data.resetToken)
    if (data.email) setEmail(data.email)
    setStep("password")
  }

  const reset = async () => {
    if (password.length < 8) {
      setError("Min 8 characters")
      return
    }
    setLoading(true)
    const res = await fetch("/api/admin/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetToken, password, email }),
    })
    const data = await res.json()
    setLoading(false)
    if (!data.success) { setError(data.error); return }
    setStep("done")
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <AuthRecycleBackground />
      <Card className="w-full max-w-md relative z-10 glass">
        <CardHeader>
          <CardTitle>Reset admin password</CardTitle>
          <CardDescription>{step === "otp" ? "Enter OTP from email" : step === "password" ? "New password" : "Done"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {step === "otp" && (
            <>
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>{[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}</InputOTPGroup>
              </InputOTP>
              <Button className="w-full" onClick={verify} disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : "Verify"}</Button>
            </>
          )}
          {step === "password" && (
            <>
              <div><Label>New password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <Button className="w-full" onClick={reset} disabled={loading}>Update password</Button>
            </>
          )}
          {step === "done" && (
            <div className="text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <Button className="w-full" onClick={() => router.push("/admin/login")}>Sign in</Button>
            </div>
          )}
          <Link href="/admin/login" className="text-sm text-muted-foreground flex items-center gap-1"><ArrowLeft className="w-4 h-4" />Back</Link>
        </CardContent>
      </Card>
    </div>
  )
}
