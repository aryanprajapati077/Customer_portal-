"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Loader2, CheckCircle2, Mail } from "lucide-react"

function RenewContent() {
  const params = useSearchParams()
  const customerId = (params.get("c") || params.get("customerId") || "").trim().toUpperCase()
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading")
  const [companyName, setCompanyName] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!customerId) {
      setStatus("error")
      setError("Missing client link. Please use the Renew Now button from your email.")
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/renew", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customerId, source: "renew_now_email" }),
        })
        const data = await res.json()
        if (cancelled) return
        if (!data?.success) {
          setStatus("error")
          setError(data?.error || "Could not submit renewal request.")
          return
        }
        setCompanyName(String(data.companyName || ""))
        setStatus("ok")
      } catch {
        if (!cancelled) {
          setStatus("error")
          setError("Network error. Please try again or email support@buffindia.com.")
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [customerId])

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#F7F6F2] px-4 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(27,115,57,0.14), transparent 55%), radial-gradient(ellipse 50% 40% at 100% 100%, rgba(200,240,0,0.08), transparent 50%)",
        }}
      />
      <div className="relative z-10 w-full max-w-lg rounded-[24px] border border-[#EAEAEA] bg-white p-8 shadow-sm sm:p-10">
        <Link href="/" className="mb-8 inline-block">
          <Image src="/logo.svg" alt="BuffIndia" width={140} height={44} className="h-9 w-auto" priority />
        </Link>

        {status === "loading" ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#1B7339]" />
            <p className="text-sm text-[#6B6B6B]">Submitting your renewal request…</p>
          </div>
        ) : null}

        {status === "ok" ? (
          <div className="space-y-4 text-center sm:text-left">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F5E9] sm:mx-0">
              <CheckCircle2 className="h-7 w-7 text-[#1B7339]" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#1B7339]">
              Renewal request received
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-3xl leading-tight text-[#141414]">
              Our team will connect with you shortly
            </h1>
            <p className="text-[15px] leading-relaxed text-[#4A4A4A]">
              Thanks{companyName ? ` — we received your renewal interest for ` : "."}
              {companyName ? <strong>{companyName}</strong> : null}
              {companyName ? "." : ""} A BuffIndia teammate will reach out soon to complete your
              service renewal.
            </p>
            <p className="flex items-center justify-center gap-2 text-sm text-[#6B6B6B] sm:justify-start">
              <Mail className="h-4 w-4 text-[#1B7339]" />
              Questions?{" "}
              <a className="font-medium text-[#1B7339] hover:underline" href="mailto:support@buffindia.com">
                support@buffindia.com
              </a>
            </p>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="space-y-4 text-center sm:text-left">
            <h1 className="font-[family-name:var(--font-display)] text-2xl text-[#141414]">
              We couldn&apos;t process that link
            </h1>
            <p className="text-sm text-[#C62828]">{error}</p>
            <p className="text-sm text-[#6B6B6B]">
              Email{" "}
              <a className="text-[#1B7339] hover:underline" href="mailto:support@buffindia.com">
                support@buffindia.com
              </a>{" "}
              and we&apos;ll help you renew.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default function RenewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F7F6F2]">
          <Loader2 className="h-8 w-8 animate-spin text-[#1B7339]" />
        </div>
      }
    >
      <RenewContent />
    </Suspense>
  )
}
