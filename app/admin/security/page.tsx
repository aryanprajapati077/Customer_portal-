"use client"

import { useEffect, useState } from "react"
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
      setMessage(
        "Scan the QR code or enter the secret manually in your authenticator app, then enter the code below.",
      )
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
        <Loader2 className="h-8 w-8 animate-spin text-[#1B7339]" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#DCE8DC] bg-[#E8F5E9] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1B7339]">
          <ShieldCheck className="h-3.5 w-3.5" />
          Security
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(1.8rem,3vw,2.4rem)] leading-tight tracking-tight">
          Authenticator <em className="italic text-[#1B7339]">(2FA)</em>
        </h1>
        <p className="mt-1.5 text-[14px] text-[#6B6B6B]">
          Use Google Authenticator, Authy, or 1Password for an extra layer of security on admin sign-in.
        </p>
      </div>

      <div className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F5E9] text-[#1B7339]">
            <Smartphone className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-[16px] font-semibold text-[#141414]">
              Status:{" "}
              <span className={totpEnabled ? "text-[#1B7339]" : "text-[#EF6C00]"}>
                {totpEnabled ? "Enabled" : "Not enabled"}
              </span>
            </h2>
            <p className="mt-1 text-[13px] text-[#6B6B6B]">
              {totpEnabled
                ? "A 6-digit code is required after your password when signing in."
                : "Recommended for super admins. Set up in under a minute."}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {!totpEnabled && !setupUri && (
            <Button
              onClick={startSetup}
              disabled={busy}
              className="rounded-full bg-[#1B7339] hover:bg-[#145a2c]"
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Set up authenticator
            </Button>
          )}

          {setupUri && setupSecret && !totpEnabled && (
            <div className="space-y-4 rounded-2xl border border-[#DCE8DC] bg-[#F7FBF7] p-4">
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(setupUri)}`}
                  alt="Authenticator QR code"
                  width={180}
                  height={180}
                  className="rounded-lg border border-[#E5E5E5] bg-white p-2"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#6B6B6B]">Manual entry key</Label>
                <Input readOnly value={setupSecret} className="font-mono text-xs" />
              </div>
              <div className="space-y-2">
                <Label>Verification code</Label>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={code} onChange={setCode}>
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} className="h-11 w-10" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
              <Button
                className="w-full rounded-full bg-[#1B7339] hover:bg-[#145a2c]"
                onClick={enableTotp}
                disabled={busy || code.length !== 6}
              >
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
                        <InputOTPSlot key={i} index={i} className="h-11 w-10" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
              <Button
                variant="destructive"
                className="rounded-full"
                onClick={disableTotp}
                disabled={busy || code.length !== 6}
              >
                Disable authenticator
              </Button>
            </div>
          )}

          {message && (
            <p className="rounded-xl border border-[#C8E6D4] bg-[#E8F5E9] px-3 py-2 text-sm text-[#1B7339]">
              {message}
            </p>
          )}
          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
