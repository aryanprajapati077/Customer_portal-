"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Menu, X, ArrowRight } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import Image from "next/image"

const navLinks = [
  { name: "Solutions", href: "/#calculator" },
  { name: "Impact", href: "/#impact" },
  { name: "KraftReborn", href: "/#kraftreborn" },
  { name: "Journey", href: "/#journey" },
  { name: "Contact", href: "/#proposal" },
]

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { customer } = useAuth()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 16)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "border-b border-[#D9D6CF]/80 bg-[#F7F6F2]/95 py-2.5 backdrop-blur-md"
          : "border-b border-transparent bg-transparent py-4",
      )}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between gap-4">
          <Link href="/" className="flex shrink-0 items-center">
            <Image
              src="/logo.svg"
              alt="BuffIndia"
              width={148}
              height={48}
              className="h-9 w-auto object-contain sm:h-10"
              priority
            />
          </Link>

          <div className="hidden items-center gap-0.5 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="px-3 py-1.5 text-[13px] font-medium tracking-wide text-[#5C5C5C] transition-colors hover:text-[#141414]"
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {customer ? (
              <Link
                href="/dashboard"
                className="text-[13px] font-semibold text-[#141414] underline-offset-4 hover:text-[#1B7339] hover:underline"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-[13px] font-semibold text-[#141414] underline-offset-4 hover:text-[#1B7339] hover:underline"
              >
                Sign in
              </Link>
            )}
            <a
              href="/#calculator"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#1B7339] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#145a2c]"
            >
              Calculate impact
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <button
            type="button"
            className="rounded-md p-2 text-[#141414] md:hidden"
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {isMobileMenuOpen && (
          <div className="mt-3 space-y-1 rounded-2xl border border-[#E5E2DA] bg-white/95 p-3 shadow-sm md:hidden">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block rounded-xl px-3 py-2.5 text-[14px] text-[#3A3A3A] hover:bg-[#F7F6F2]"
              >
                {link.name}
              </a>
            ))}
            <a
              href="#calculator"
              onClick={() => setIsMobileMenuOpen(false)}
              className="mt-1 block rounded-full bg-[#1B7339] px-3 py-2.5 text-center text-[14px] font-semibold text-white"
            >
              Calculate impact
            </a>
            <Link
              href={customer ? "/dashboard" : "/login"}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block rounded-xl px-3 py-2.5 text-center text-[14px] text-[#5C5C5C]"
            >
              {customer ? "Dashboard" : "Sign in"}
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
