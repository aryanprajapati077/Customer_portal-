"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AdminAuthShell } from "@/components/admin/admin-auth-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, ArrowLeft } from "lucide-react"

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
    <AdminAuthShell
      title="Reset admin"
      accent="password"
      subtitle="Enter your admin email and we’ll send a one-time code to continue."
    >
      <div className="space-y-4">
        {!sent && (
          <div className="space-y-2">
            <Label htmlFor="reset-email">Admin email</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A8A]" />
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@buffindia.com"
                className="h-12 rounded-xl border-[#E5E7EB] bg-[#FAFAFA] pl-10 focus-visible:ring-[#1B7339]"
              />
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        {sent ? (
          <>
            <div className="rounded-2xl border border-[#E2EBE4] bg-[#F7FBF7] px-4 py-3 text-[13px] text-[#4A4A4A]">
              If that email exists, an OTP was sent. Continue to enter the code.
            </div>
            <Button
              className="h-12 w-full rounded-full bg-[#1B7339] hover:bg-[#145a2c]"
              onClick={() => router.push("/admin/reset-password")}
            >
              Enter OTP
            </Button>
          </>
        ) : (
          <Button
            className="h-12 w-full rounded-full bg-[#1B7339] hover:bg-[#145a2c]"
            onClick={submit}
            disabled={loading || !email}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send OTP"}
          </Button>
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
