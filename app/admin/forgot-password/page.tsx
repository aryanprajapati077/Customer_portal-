"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthRecycleBackground } from "@/components/auth/auth-recycle-background"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Shield, ArrowLeft } from "lucide-react"

export default function AdminForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const submit = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/forgot-password", { method: "POST" })
      const data = await res.json()
      if (!data.success) { setError(data.error || "Failed"); return }
      setSent(true)
      if (data.devOtp) sessionStorage.setItem("admin_dev_otp", data.devOtp)
    } catch { setError("Network error") }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <AuthRecycleBackground />
      <Card className="w-full max-w-md relative z-10 glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" />Admin password reset</CardTitle>
          <CardDescription>OTP will be sent to your configured ADMIN_EMAIL</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {sent ? (
            <Button className="w-full" onClick={() => router.push("/admin/reset-password")}>Enter OTP</Button>
          ) : (
            <Button className="w-full" onClick={submit} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send OTP to admin email"}
            </Button>
          )}
          <Link href="/admin/login" className="text-sm text-muted-foreground flex items-center gap-1"><ArrowLeft className="w-4 h-4" />Back</Link>
        </CardContent>
      </Card>
    </div>
  )
}
