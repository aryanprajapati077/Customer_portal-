"use client"

import { Suspense, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Shield, Loader2 } from "lucide-react"

function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = useMemo(() => searchParams.get("next") || "/admin", [searchParams])

  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!data?.success) {
        setError(data?.error || "Login failed")
        return
      }
      router.push(nextPath)
      router.refresh()
    } catch {
      setError("Network error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md glass border-border/50 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Admin Panel</CardTitle>
              <CardDescription>Sign in to manage Buffindia</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Admin password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSubmit()
              }}
              placeholder="Enter password"
            />
          </div>

          {error && <div className="text-sm text-destructive">{error}</div>}

          <Button className="w-full" onClick={onSubmit} disabled={isSubmitting || !password}>
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>

          <p className="text-xs text-muted-foreground">
            Set <span className="font-mono">ADMIN_PASSWORD</span> in your environment to enable admin access.
          </p>
        </CardContent>
      </Card>
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
