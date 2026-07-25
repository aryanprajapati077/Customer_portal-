"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowLeft, Shield } from "lucide-react"

export function AdminAuthShell({
  title,
  accent = "securely",
  subtitle,
  children,
}: {
  title: string
  accent?: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="landing-root min-h-screen bg-white text-[#141414]">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="relative hidden min-h-[40vh] overflow-hidden lg:block lg:min-h-screen"
        >
          <Image
            src="/auth/login-leaf.jpg"
            alt="Sunlight through leaves"
            fill
            className="object-cover"
            priority
            sizes="50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F1F14]/80 via-[#0F1F14]/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-10 text-white">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C8F000]">
              <Shield className="h-3.5 w-3.5" />
              Admin access
            </div>
            <h1 className="max-w-md font-[family-name:var(--font-display)] text-[2.6rem] leading-[1.08] tracking-tight">
              Operate the circular system
              <br />
              <em className="italic text-[#C8F000]">with clarity.</em>
            </h1>
            <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-white/75">
              Manage clients, collections, KraftReborn orders, ESG reports, and support — one secure console.
            </p>
          </div>
        </motion.div>

        <div className="relative flex flex-col justify-center px-5 py-10 sm:px-10 lg:px-16 xl:px-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(27,115,57,0.06),_transparent_55%)]"
          />

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-md"
          >
            <Link href="/" className="inline-flex items-center gap-2">
              <Image
                src="/logo.svg"
                alt="BuffIndia"
                width={140}
                height={44}
                className="h-9 w-auto object-contain"
                priority
              />
            </Link>

            <p className="mt-9 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1B7339]">
              BuffIndia Admin
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-[2.1rem] leading-tight tracking-tight sm:text-[2.35rem]">
              {title} <em className="italic text-[#1B7339]">{accent}</em>
            </h2>
            <p className="mt-2 text-[14px] text-[#6B6B6B]">{subtitle}</p>

            <div className="relative mt-6 h-32 overflow-hidden rounded-2xl lg:hidden">
              <Image
                src="/auth/login-greenery.jpg"
                alt="Forest"
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
              <p className="absolute bottom-3 left-4 text-[13px] font-medium text-white">
                Secure operations for a cleaner India.
              </p>
            </div>

            <div className="mt-7">{children}</div>

            <div className="mt-8 flex flex-col items-center gap-2 text-[13px] text-[#6B6B6B]">
              <Link href="/login" className="inline-flex items-center gap-1.5 hover:text-[#141414]">
                <ArrowLeft className="h-3.5 w-3.5" />
                Customer portal sign in
              </Link>
              <Link href="/" className="text-[#8A8A8A] hover:text-[#141414]">
                Back to website
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
