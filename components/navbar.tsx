"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Menu, X } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import Image from "next/image"

const navLinks = [
  { name: "Solution", href: "/#solution" },
  { name: "Process", href: "/#process" },
  { name: "Impact", href: "/#impact" },
  { name: "Contact", href: "/contact" },
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
          ? "bg-[#F7F6F2]/95 backdrop-blur-md border-b border-[#D9D6CF] py-2.5"
          : "bg-transparent border-b border-transparent py-4",
      )}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/logo.svg"
              alt="BuffIndia"
              width={148}
              height={48}
              className="h-9 w-auto object-contain sm:h-10"
              priority
            />
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="px-3 py-1.5 text-[13px] font-medium tracking-wide text-[#5C5C5C] hover:text-[#141414] transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center">
            {customer ? (
              <Link
                href="/dashboard"
                className="text-[13px] font-semibold text-[#141414] underline-offset-4 hover:underline hover:text-[#1B7339] transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-[13px] font-semibold text-[#141414] underline-offset-4 hover:underline hover:text-[#1B7339] transition-colors"
              >
                Customer Login
              </Link>
            )}
          </div>

          <button
            type="button"
            className="md:hidden w-9 h-9 rounded-full border border-[#D9D6CF] bg-white/70 flex items-center justify-center"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-4 h-4 text-[#141414]" />
            ) : (
              <Menu className="w-4 h-4 text-[#141414]" />
            )}
          </button>
        </nav>

        {isMobileMenuOpen && (
          <div className="md:hidden mt-3 pb-3 border-t border-[#D9D6CF] pt-3 bg-[#F7F6F2]/95">
            <div className="flex flex-col gap-0.5">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="px-3 py-2.5 text-[14px] font-medium text-[#5C5C5C] hover:text-[#141414]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <div className="mt-2 px-3">
                {customer ? (
                  <Link
                    href="/dashboard"
                    className="landing-btn-primary w-full"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="landing-btn-primary w-full"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Customer Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
