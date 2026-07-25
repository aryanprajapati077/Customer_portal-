"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, Leaf, Shield, Recycle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"

const HIGHLIGHTS = [
  { icon: Leaf, label: "Track real impact" },
  { icon: Recycle, label: "Circular recovery" },
  { icon: Shield, label: "Secure portal" },
]

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
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
    <div className="landing-root min-h-screen bg-white text-[#141414]">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-2">
        {/* Left — nature visual */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="relative hidden min-h-[42vh] overflow-hidden lg:block lg:min-h-screen"
        >
          <Image
            src="/auth/login-greenery.jpg"
            alt="Forest greenery"
            fill
            className="object-cover"
            priority
            sizes="50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F1F14]/75 via-[#0F1F14]/25 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10" />

          <div className="absolute inset-x-0 bottom-0 p-10 text-white">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#C8F000]"
            >
              BuffIndia Customer Portal
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mt-3 max-w-md font-[family-name:var(--font-display)] text-[2.75rem] leading-[1.08] tracking-tight"
            >
              A cleaner today.
              <br />
              <em className="italic text-[#C8F000]">A better tomorrow.</em>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="mt-4 max-w-sm text-[14px] leading-relaxed text-white/80"
            >
              Sign in to follow your waste diverted, water protected, and KraftReborn credits earned.
            </motion.p>
          </div>
        </motion.div>

        {/* Right — white form */}
        <div className="relative flex flex-col justify-center px-5 py-10 sm:px-10 lg:px-16 xl:px-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(27,115,57,0.06),_transparent_55%)]"
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-md"
          >
            <Link href="/" className="inline-flex items-center gap-2">
              <Image
                src="/logo.svg"
                alt="BuffIndia"
                width={150}
                height={48}
                className="h-10 w-auto object-contain"
                priority
              />
            </Link>

            <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1B7339]">
              Welcome back
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-[2.15rem] leading-tight tracking-tight sm:text-[2.4rem]">
              Sign in to your <em className="italic text-[#1B7339]">impact</em>
            </h2>
            <p className="mt-2 text-[14px] text-[#6B6B6B]">
              Access collections, ESG reports, certificates, and the KraftReborn shop.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {HIGHLIGHTS.map((h, i) => (
                <motion.span
                  key={h.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#E2EBE4] bg-[#F7FBF7] px-3 py-1.5 text-[11.5px] font-medium text-[#2A4A32]"
                >
                  <h.icon className="h-3.5 w-3.5 text-[#1B7339]" />
                  {h.label}
                </motion.span>
              ))}
            </div>

            {/* Mobile nature strip */}
            <div className="relative mt-6 h-36 overflow-hidden rounded-2xl lg:hidden">
              <Image
                src="/auth/login-leaf.jpg"
                alt="Sunlight through leaves"
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <p className="absolute bottom-3 left-4 right-4 text-[13px] font-medium text-white">
                Every butt collected today protects tomorrow.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A8A]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-xl border-[#E5E7EB] bg-[#FAFAFA] pl-10 focus-visible:ring-[#1B7339]"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-[#1B7339] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A8A]" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-xl border-[#E5E7EB] bg-[#FAFAFA] pl-10 focus-visible:ring-[#1B7339]"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="group h-12 w-full rounded-full bg-[#1B7339] text-[15px] font-semibold hover:bg-[#145a2c]"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Enter dashboard
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 space-y-2 text-center text-[13px] text-[#6B6B6B]">
              <p>
                New partner?{" "}
                <Link href="/contact" className="font-medium text-[#1B7339] hover:underline">
                  Contact us
                </Link>
              </p>
              <p>
                Admin?{" "}
                <Link href="/admin/login" className="font-medium text-[#EF6C00] hover:underline">
                  Admin sign in
                </Link>
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 pt-1 text-[#8A8A8A] hover:text-[#141414]"
              >
                <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                Back to home
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
