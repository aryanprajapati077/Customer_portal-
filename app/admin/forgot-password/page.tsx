"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthRecycleBackground } from "@/components/auth/auth-recycle-background"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Shield, ArrowLeft } from "lucide-react"

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const submit = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || "Failed")
        return
      }
      sessionStorage.setItem("admin_reset_email", email.toLowerCase().trim())
      setSent(true)
      if (data.devOtp) sessionStorage.setItem("admin_dev_otp", data.devOtp)
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <AuthRecycleBackground />
      <Card className="w-full max-w-md relative z-10 glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Admin password reset
          </CardTitle>
          <CardDescription>Enter your admin email to receive a one-time code</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!sent && (
            <div className="space-y-2">
              <Label htmlFor="reset-email">Admin email</Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@buffindia.com"
              />
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {sent ? (
            <Button className="w-full" onClick={() => router.push("/admin/reset-password")}>
              Enter OTP
            </Button>
          ) : (
            <Button className="w-full" onClick={submit} disabled={loading || !email}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send OTP"}
            </Button>
          )}
          <Link href="/admin/login" className="text-sm text-muted-foreground flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
