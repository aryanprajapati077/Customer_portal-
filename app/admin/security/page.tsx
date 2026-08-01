"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Check, Copy, Loader2, ShieldCheck, Smartphone } from "lucide-react"

const ADMIN_FETCH = { credentials: "include" as const }

export default function AdminSecurityPage() {
  const [totpEnabled, setTotpEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [setupUri, setSetupUri] = useState<string | null>(null)
  const [setupSecret, setSetupSecret] = useState<string | null>(null)
  const [setupSecretFormatted, setSetupSecretFormatted] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const autoSubmitted = useRef("")

  useEffect(() => {
    let cancelled = false
    fetch("/api/admin/totp", ADMIN_FETCH)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.success) setTotpEnabled(Boolean(d.totpEnabled))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const copySecret = async () => {
    if (!setupSecret) return
    try {
      // Authenticator apps expect the raw base32 key without spaces
      await navigator.clipboard.writeText(setupSecret.replace(/\s/g, "").toUpperCase())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError("Could not copy — select and copy the key manually.")
    }
  }

  const startSetup = async () => {
    setBusy(true)
    setError("")
    setMessage("")
    setCode("")
    autoSubmitted.current = ""
    try {
      const res = await fetch("/api/admin/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "setup" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Setup failed")
      if (!data.qrDataUrl || !data.secret) {
        throw new Error("Could not generate QR code. Try again.")
      }
      setSetupUri(data.uri)
      setSetupSecret(data.secret)
      setSetupSecretFormatted(data.secretFormatted || null)
      setQrDataUrl(data.qrDataUrl)
      setMessage(
        "In Google Authenticator: tap + → Scan QR code. If scan fails, choose “Enter a setup key”, set account to BuffIndia, type Time-based, and paste the key below (no spaces).",
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed")
    } finally {
      setBusy(false)
    }
  }

  const enableTotp = async (overrideCode?: string) => {
    const useCode = (overrideCode ?? code).trim()
    if (useCode.length !== 6 || busy) return
    setBusy(true)
    setError("")
    try {
      const res = await fetch("/api/admin/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "enable", code: useCode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Invalid code — wait for a fresh 6-digit code and try again.")
      setTotpEnabled(true)
      setSetupUri(null)
      setSetupSecret(null)
      setSetupSecretFormatted(null)
      setQrDataUrl(null)
      setCode("")
      setMessage("Authenticator is now enabled. You will need a code each time you sign in.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed")
      autoSubmitted.current = ""
    } finally {
      setBusy(false)
    }
  }

  const disableTotp = async (overrideCode?: string) => {
    const useCode = (overrideCode ?? code).trim()
    if (useCode.length !== 6 || busy) return
    setBusy(true)
    setError("")
    try {
      const res = await fetch("/api/admin/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "disable", code: useCode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Invalid code")
      setTotpEnabled(false)
      setCode("")
      setMessage("Authenticator disabled.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed")
      autoSubmitted.current = ""
    } finally {
      setBusy(false)
    }
  }

  const onCodeChange = (value: string) => {
    setCode(value)
    if (value.length !== 6 || busy) return
    if (autoSubmitted.current === value) return
    autoSubmitted.current = value
    if (setupUri && !totpEnabled) void enableTotp(value)
    else if (totpEnabled) void disableTotp(value)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded bg-[#E8EEE9]" />
        <div className="h-40 rounded-2xl border border-[#E5E5E5] bg-white" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 px-0 sm:px-0">
      <div>
        <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#DCE8DC] bg-[#E8F5E9] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1B7339]">
          <ShieldCheck className="h-3.5 w-3.5" />
          Security
        </p>
        <h1 className="admin-page-title">Authenticator (2FA)</h1>
        <p className="mt-1.5 text-[14px] text-[#6B6B6B]">
          Use Google Authenticator, Authy, or 1Password for an extra layer of security on admin sign-in.
        </p>
      </div>

      <div className="rounded-2xl border border-[#E5E5E5] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8F5E9] text-[#1B7339]">
            <Smartphone className="h-5 w-5" />
          </span>
          <div className="min-w-0">
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
              className="w-full rounded-full bg-[#1B7339] hover:bg-[#145a2c] sm:w-auto"
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Set up authenticator
            </Button>
          )}

          {setupUri && setupSecret && !totpEnabled && (
            <div className="space-y-4 rounded-2xl border border-[#DCE8DC] bg-[#F7FBF7] p-3 sm:p-4">
              <div className="flex justify-center">
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl}
                    alt="Authenticator QR code — scan with Google Authenticator"
                    width={220}
                    height={220}
                    className="max-w-full rounded-lg border border-[#E5E5E5] bg-white p-2"
                  />
                ) : (
                  <p className="text-sm text-[#6B6B6B]">Generating QR code…</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#6B6B6B]">Manual entry key (if QR scan fails)</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={setupSecretFormatted || setupSecret}
                    className="min-w-0 flex-1 font-mono text-[11px] sm:text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={copySecret}
                    aria-label="Copy setup key"
                  >
                    {copied ? <Check className="h-4 w-4 text-[#1B7339]" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-[11px] text-[#8A8A8A]">
                  Manual setup: Account <strong>BuffIndia</strong> · Key (paste without spaces):{" "}
                  <span className="font-mono">{setupSecret}</span>
                </p>
              </div>
              <div className="space-y-2">
                <Label>Verification code from your app</Label>
                <div className="flex justify-center overflow-x-auto pb-1">
                  <InputOTP maxLength={6} value={code} onChange={onCodeChange} inputMode="numeric">
                    <InputOTPGroup className="admin-otp-group">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} className="admin-otp-slot h-11 w-9 sm:w-10" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
              <Button
                className="w-full rounded-full bg-[#1B7339] hover:bg-[#145a2c]"
                onClick={() => enableTotp()}
                disabled={busy || code.length !== 6}
              >
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Enable authenticator
              </Button>
            </div>
          )}

          {totpEnabled && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Enter current code to disable</Label>
                <div className="flex justify-center overflow-x-auto pb-1">
                  <InputOTP maxLength={6} value={code} onChange={onCodeChange} inputMode="numeric">
                    <InputOTPGroup className="admin-otp-group">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} className="admin-otp-slot h-11 w-9 sm:w-10" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
              <Button
                variant="destructive"
                className="w-full rounded-full sm:w-auto"
                onClick={() => disableTotp()}
                disabled={busy || code.length !== 6}
              >
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
