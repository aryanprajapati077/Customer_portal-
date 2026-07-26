"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  Leaf,
  Recycle,
  BarChart3,
  Globe2,
  Eye,
  EyeOff,
  Globe,
  Phone,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const FEATURES = [
  { icon: Leaf, label: "Responsible Waste Management" },
  { icon: Recycle, label: "Driving the Circular Economy" },
  { icon: BarChart3, label: "Measurable Impact" },
  { icon: Globe2, label: "Aligned with UN SDGs" },
]

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    const result = await login(email, password)
    if (result.success) router.push("/dashboard")
    else setError(result.error || "Login failed")
    setIsLoading(false)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-[#1A1A1A]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Left — full-bleed botanical panel */}
        <section className="relative flex min-h-[48vh] flex-1 flex-col overflow-hidden px-7 pb-10 pt-7 sm:px-12 lg:min-h-screen lg:max-w-[55%] lg:px-14 lg:pb-14 lg:pt-10">
          <div className="pointer-events-none absolute inset-0">
            <Image
              src="/auth/login-leaf.jpg"
              alt=""
              fill
              className="scale-105 object-cover object-[center_35%]"
              priority
              sizes="55vw"
            />
            <div className="absolute inset-0 bg-[#0C1A12]/55" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A1610] via-[#0C1A12]/35 to-[#0C1A12]/20" />
            {/* Soft light bloom */}
            <div
              aria-hidden
              className="absolute -left-24 top-[-10%] h-[55%] w-[70%] rounded-full bg-[#C8F000]/10 blur-3xl"
            />
            <div
              aria-hidden
              className="absolute bottom-[-5%] right-[-10%] h-[40%] w-[50%] rounded-full bg-[#2D8A4E]/25 blur-3xl"
            />
          </div>

          {/* Slim green divider curve */}
          <svg
            aria-hidden
            className="pointer-events-none absolute -right-1 top-0 hidden h-full w-20 text-[#C8F000]/40 lg:block"
            viewBox="0 0 80 800"
            preserveAspectRatio="none"
          >
            <path
              d="M28 0 C62 160 72 300 40 450 C12 590 58 700 32 800"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>

          <div className="relative z-10 flex h-full flex-col text-white">
            <Link href="/" className="inline-flex w-fit">
              <Image
                src="/report-assets/buffindia-logo-clear.png"
                alt="BuffIndia"
                width={180}
                height={58}
                className="h-11 w-auto object-contain sm:h-12"
                priority
              />
            </Link>

            <div className="my-auto max-w-lg py-12 lg:py-16">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#C8F000]">
                ImpactOS
              </p>
              <h1 className="mt-5 font-[family-name:var(--font-display)] text-[2.6rem] leading-[1.05] tracking-tight sm:text-[3.25rem] lg:text-[3.6rem]">
                Cleaner today.
                <br />
                <em className="italic text-[#C8F000]">Better tomorrow.</em>
              </h1>
              <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-white/70">
                Measure waste recovered, water protected, and circular impact — in one calm place.
              </p>
              <div className="mt-8 h-px w-16 bg-[#C8F000]/80" />
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-3 border-t border-white/15 pt-6">
              {FEATURES.map((f) => (
                <div key={f.label} className="flex items-center gap-2 text-white/80">
                  <f.icon className="h-3.5 w-3.5 text-[#C8F000]" strokeWidth={2} />
                  <span className="text-[11px] font-medium tracking-wide">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right — auth form */}
        <section className="relative flex flex-1 flex-col justify-center bg-white px-6 py-10 sm:px-10 lg:px-14 xl:px-16">
          <div className="mx-auto w-full max-w-[400px]">
            <h2 className="text-[1.85rem] font-bold tracking-tight text-[#1A1A1A] sm:text-[2.1rem]">
              Welcome Back!
            </h2>
            <p className="mt-2 text-[14px] text-[#6B6B6B]">
              Sign in to access your Buffindia ImpactOS
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[13px] font-medium text-[#374151]">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-lg border-[#E5E7EB] bg-white pl-10 shadow-none focus-visible:ring-[#1B7339]"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[13px] font-medium text-[#374151]">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-lg border-[#E5E7EB] bg-white pl-10 pr-11 shadow-none focus-visible:ring-[#1B7339]"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#4B5563]">
                  <Checkbox
                    checked={remember}
                    onCheckedChange={(v) => setRemember(v === true)}
                    className="border-[#D1D5DB] data-[state=checked]:border-[#1B7339] data-[state=checked]:bg-[#1B7339]"
                  />
                  Remember me
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[13px] font-medium text-[#1B7339] hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full rounded-lg bg-[#1F4A30] text-[15px] font-semibold text-white hover:bg-[#163824]"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
              </Button>
            </form>

            <p className="mt-6 text-center text-[13px] text-[#6B6B6B]">
              New to Buffindia ImpactOS?{" "}
              <Link href="/contact" className="font-semibold text-[#1A1A1A] hover:underline">
                Contact your administrator
              </Link>
            </p>

            <div className="mt-10 rounded-xl border border-[#EEF0EE] bg-[#F7F8F7] px-4 py-4">
              <p className="text-center text-[11px] font-medium tracking-wide text-[#8A8A8A]">
                Proudly supported by
              </p>
              <div className="mt-3 flex items-center justify-center gap-6">
                <a
                  href="https://iimaventures.com"
                  target="_blank"
                  rel="noreferrer"
                  className="opacity-90 transition-opacity hover:opacity-100"
                >
                  <Image
                    src="/portal/iima-logo.png"
                    alt="IIMA Ventures"
                    width={96}
                    height={36}
                    className="h-8 w-auto object-contain"
                  />
                </a>
                <a
                  href="https://www.kotak.bank.in/en/about-us/kotak-bizlabs.html"
                  target="_blank"
                  rel="noreferrer"
                  className="opacity-90 transition-opacity hover:opacity-100"
                >
                  <Image
                    src="/portal/kotak-bizlabs-logo.png"
                    alt="Kotak BizLabs"
                    width={110}
                    height={36}
                    className="h-7 w-auto object-contain"
                  />
                </a>
              </div>
            </div>

            <p className="mt-6 text-center text-[12px] text-[#9CA3AF]">
              Admin?{" "}
              <Link href="/admin/login" className="font-medium text-[#EF6C00] hover:underline">
                Admin sign in
              </Link>
            </p>
          </div>
        </section>
      </div>

      {/* Bottom contact strip */}
      <footer className="border-t border-[#E5E7EB] bg-white px-4 py-3">
        <div className="mx-auto flex w-full flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 text-[12px] text-[#6B6B6B] sm:justify-between sm:px-8 lg:px-14">
          <a
            href="https://www.buffindia.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-[#1B7339]"
          >
            <Globe className="h-3.5 w-3.5" />
            www.buffindia.com
          </a>
          <a
            href="mailto:info@buffindia.com"
            className="inline-flex items-center gap-1.5 hover:text-[#1B7339]"
          >
            <Mail className="h-3.5 w-3.5" />
            info@buffindia.com
          </a>
          <a
            href="tel:+916359566528"
            className="inline-flex items-center gap-1.5 hover:text-[#1B7339]"
          >
            <Phone className="h-3.5 w-3.5" />
            +91 63595 66528
          </a>
        </div>
      </footer>
    </div>
  )
}
