"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Home,
  Leaf,
  Gift,
  Truck,
  FileBarChart2,
  Building2,
  Headphones,
  User,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PlantIllustration } from "@/components/portal/brand-svgs"
import { useAuth } from "@/lib/auth-context"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: Home, match: "exact" as const },
  { href: "/dashboard/impact", label: "Impact", icon: Leaf, match: "prefix" as const },
  { href: "/dashboard/shop", label: "KraftReborn", icon: Gift, match: "prefix" as const },
  { href: "/dashboard/collections", label: "Collections", icon: Truck, match: "prefix" as const },
  { href: "/dashboard/reports", label: "Reports", icon: FileBarChart2, match: "prefix" as const },
  { href: "/dashboard/organization", label: "Organization", icon: Building2, match: "prefix" as const },
  { href: "/dashboard/support", label: "Support", icon: Headphones, match: "prefix" as const },
  { href: "/dashboard/account", label: "Account", icon: User, match: "prefix" as const },
]

function isActive(pathname: string, href: string, match: "exact" | "prefix") {
  if (match === "exact") return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function PortalSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()

  return (
    <aside className="flex w-[var(--p-sidebar-w)] shrink-0 flex-col border-r border-[#EAEAEA] bg-white h-full">
      <div className="px-4 pt-4 pb-3">
        <Link href="/dashboard" onClick={onNavigate} className="block group">
          <Image
            src="/logo.svg"
            alt="BuffIndia"
            width={148}
            height={48}
            className="h-10 w-auto object-contain group-hover:opacity-90 transition-opacity"
            priority
          />
          <p className="text-[11px] text-[#8B8B8B] mt-1.5 font-normal pl-0.5">Butt Free India</p>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-[2px] overflow-y-auto pt-1">
        {NAV_ITEMS.map((item, i) => {
          const active = isActive(pathname, item.href, item.match)
          const Icon = item.icon
          const homeActive = active && item.href === "/dashboard"
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.03 * i, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-[9px] rounded-[10px] text-[13.5px] font-medium transition-all duration-200",
                  active
                    ? homeActive
                      ? "bg-[#FFF3E0] text-[#EF6C00] shadow-sm"
                      : "bg-[#E8F5E9] text-[#1B7339] shadow-sm"
                    : "text-[#555] hover:bg-[#F5F5F5] hover:translate-x-0.5",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active"
                    className={cn(
                      "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[22px] rounded-r-full",
                      homeActive ? "bg-[#EF6C00]" : "bg-[#1B7339]",
                    )}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon
                  className={cn(
                    "w-[17px] h-[17px] transition-transform duration-200",
                    active
                      ? homeActive
                        ? "text-[#EF6C00]"
                        : "text-[#1B7339]"
                      : "text-[#7A7A7A]",
                  )}
                  strokeWidth={1.7}
                />
                {item.label}
              </Link>
            </motion.div>
          )
        })}
      </nav>

      <div className="p-3.5 pb-4 space-y-2.5">
        <button
          type="button"
          onClick={() => {
            logout()
            onNavigate?.()
            router.push("/")
          }}
          className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-[#F0D0D0] bg-[#FFF8F8] px-3 py-2.5 text-[13px] font-semibold text-[#C62828] hover:bg-[#FFEBEE] transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-[16px] bg-[#EDF7ED] px-3.5 pt-3.5 pb-10 relative overflow-hidden min-h-[128px]"
        >
          <p className="text-[11.5px] leading-[1.5] text-[#4A4A4A] pr-8 relative z-10">
            Every butt collected today is a cleaner, healthier tomorrow.
          </p>
          <p className="text-[11.5px] font-bold text-[#2D5A27] mt-1.5 relative z-10 pr-10">
            Thank you for making a difference!
          </p>
          <motion.div
            className="absolute bottom-1.5 right-1.5 w-[78px] h-[64px] pointer-events-none"
            initial={{ scale: 0.6, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ delay: 0.55, type: "spring", stiffness: 260, damping: 16 }}
          >
            <PlantIllustration className="w-full h-full portal-plant-sway" />
          </motion.div>
        </motion.div>
      </div>
    </aside>
  )
}
