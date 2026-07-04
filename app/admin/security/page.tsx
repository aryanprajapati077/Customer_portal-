"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Loader2, ShieldCheck, Smartphone } from "lucide-react"

export default function AdminSecurityPage() {
  const [totpEnabled, setTotpEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [setupUri, setSetupUri] = useState<string | null>(null)
  const [setupSecret, setSetupSecret] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/admin/totp")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setTotpEnabled(d.totpEnabled)
      })
      .finally(() => setLoading(false))
  }, [])

  const startSetup = async () => {
    setBusy(true)
    setError("")
    setMessage("")
    try {
      const res = await fetch("/api/admin/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Setup failed")
      setSetupUri(data.uri)
      setSetupSecret(data.secret)
      setMessage("Scan the QR code or enter the secret manually in your authenticator app, then enter the code below.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed")
    } finally {
      setBusy(false)
    }
  }

  const enableTotp = async () => {
    setBusy(true)
    setError("")
    try {
      const res = await fetch("/api/admin/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enable", code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Invalid code")
      setTotpEnabled(true)
      setSetupUri(null)
      setSetupSecret(null)
      setCode("")
      setMessage("Authenticator is now enabled. You will need a code each time you sign in.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed")
    } finally {
      setBusy(false)
    }
  }

  const disableTotp = async () => {
    setBusy(true)
    setError("")
    try {
      const res = await fetch("/api/admin/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable", code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Invalid code")
      setTotpEnabled(false)
      setCode("")
      setMessage("Authenticator disabled.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed")
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          Security
        </div>
        <h1 className="text-3xl font-bold">Authenticator (2FA)</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Use Google Authenticator, Authy, or 1Password for an extra layer of security on admin sign-in.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Status: {totpEnabled ? "Enabled" : "Not enabled"}
          </CardTitle>
          <CardDescription>
            {totpEnabled
              ? "A 6-digit code is required after your password when signing in."
              : "Recommended for super admins. Set up in under a minute."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!totpEnabled && !setupUri && (
            <Button onClick={startSetup} disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Set up authenticator
            </Button>
          )}

          {setupUri && setupSecret && !totpEnabled && (
            <div className="space-y-4 rounded-xl border border-border/60 bg-muted/30 p-4">
              <div className="flex justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(setupUri)}`}
                  alt="Authenticator QR code"
                  width={180}
                  height={180}
                  className="rounded-lg border bg-white p-2"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Manual entry key</Label>
                <Input readOnly value={setupSecret} className="font-mono text-xs" />
              </div>
              <div className="space-y-2">
                <Label>Verification code</Label>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={code} onChange={setCode}>
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
              <Button className="w-full" onClick={enableTotp} disabled={busy || code.length !== 6}>
                Enable authenticator
              </Button>
            </div>
          )}

          {totpEnabled && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Enter current code to disable</Label>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={code} onChange={setCode}>
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
              <Button variant="destructive" onClick={disableTotp} disabled={busy || code.length !== 6}>
                Disable authenticator
              </Button>
            </div>
          )}

          {message && <p className="text-sm text-green-700 dark:text-green-400">{message}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
