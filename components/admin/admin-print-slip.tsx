"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Award, CheckCircle2, Package, Recycle, Truck } from "lucide-react"
import { cn } from "@/lib/utils"

export type AdminSlipVariant = "collection" | "certificate" | "dispatch" | "order-complete"

export type AdminSlipLine = { label: string; value: string }

const VARIANT_CONFIG: Record<
  AdminSlipVariant,
  {
    printerLabel: string
    slipTitle: string
    accent: string
    paper: string
    icon: typeof Package
  }
> = {
  collection: {
    printerLabel: "Buffindia Ops",
    slipTitle: "Collection Logged",
    accent: "#1B7339",
    paper: "#FFFEF8",
    icon: Recycle,
  },
  certificate: {
    printerLabel: "ImpactOS",
    slipTitle: "Certificate Issued",
    accent: "#B8860B",
    paper: "#FFFCF5",
    icon: Award,
  },
  dispatch: {
    printerLabel: "Fulfillment",
    slipTitle: "Dispatch Slip",
    accent: "#1565C0",
    paper: "#F8FBFF",
    icon: Truck,
  },
  "order-complete": {
    printerLabel: "KraftReborn",
    slipTitle: "Order Completed",
    accent: "#1B7339",
    paper: "#FFFEF8",
    icon: CheckCircle2,
  },
}

type AdminPrintSlipProps = {
  open: boolean
  variant: AdminSlipVariant
  companyName: string
  reference?: string
  lines: AdminSlipLine[]
  successMessage: string
  footerNote?: string
  onComplete: () => void
  durationMs?: number
}

export function AdminPrintSlip({
  open,
  variant,
  companyName,
  reference,
  lines,
  successMessage,
  footerNote,
  onComplete,
  durationMs = 3000,
}: AdminPrintSlipProps) {
  const config = VARIANT_CONFIG[variant]
  const Icon = config.icon

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => onComplete(), durationMs)
    return () => clearTimeout(timer)
  }, [open, onComplete, durationMs])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="admin-slip-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          className="fixed inset-0 z-[300] flex items-start justify-center overflow-hidden bg-[#0B1220]/80 backdrop-blur-md px-4 pt-10 sm:pt-16"
        >
          <div className="relative w-full max-w-sm">
            <motion.div
              initial={{ y: -24, opacity: 0, rotateX: 12 }}
              animate={{ y: 0, opacity: 1, rotateX: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 mx-auto w-[min(100%,300px)] perspective-[800px]"
            >
              <div className="rounded-t-2xl bg-gradient-to-b from-[#2A3441] to-[#121820] px-5 pt-4 pb-3 shadow-[0_20px_50px_rgba(0,0,0,0.45)] ring-1 ring-white/10">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#4CAF50] animate-pulse" />
                    <span className="h-2 w-2 rounded-full bg-[#FFC107]" />
                    <span className="h-2 w-2 rounded-full bg-[#F44336]" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">
                    {config.printerLabel}
                  </span>
                </div>
                <div className="relative h-4 overflow-hidden rounded-md bg-[#080C10] shadow-inner">
                  <motion.div
                    className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ["-100%", "320%"] }}
                    transition={{ duration: 1.2, delay: 0.4, ease: "easeInOut" }}
                  />
                </div>
                <div className="mx-auto mt-1.5 h-1 w-[88%] rounded-full bg-[#3D4A57]" />
              </div>
              <div className="h-2.5 bg-[#0A0E14] shadow-lg" />
            </motion.div>

            <motion.div
              initial={{ y: -140, opacity: 0, scale: 0.94 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 48, opacity: 0, rotate: 1.5 }}
              transition={{ delay: 0.38, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="relative -mt-1 origin-top"
            >
              <div
                className="mx-auto w-[min(100%,272px)] px-5 py-6 shadow-[0_24px_70px_rgba(0,0,0,0.4)]"
                style={{
                  backgroundColor: config.paper,
                  backgroundImage:
                    "repeating-linear-gradient(0deg, transparent, transparent 23px, rgba(0,0,0,0.028) 23px, rgba(0,0,0,0.028) 24px)",
                }}
              >
                <div
                  className="mb-4 border-b border-dashed pb-4 text-center"
                  style={{ borderColor: `${config.accent}33` }}
                >
                  <div
                    className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${config.accent}18`, color: config.accent }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.28em]"
                    style={{ color: config.accent }}
                  >
                    Admin · Buffindia
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-display)] text-[16px] font-bold text-[#141414]">
                    {config.slipTitle}
                  </p>
                  {reference ? (
                    <p className="mt-1 text-[10px] text-[#8A8A8A]">{reference}</p>
                  ) : null}
                </div>

                <p className="mb-3 text-[12px] font-semibold text-[#141414]">{companyName}</p>

                <div className="space-y-2 mb-4">
                  {lines.map((line) => (
                    <div
                      key={`${line.label}-${line.value}`}
                      className="flex justify-between gap-3 text-[11px]"
                    >
                      <span className="text-[#6B6B6B]">{line.label}</span>
                      <span className="shrink-0 text-right font-semibold text-[#141414]">
                        {line.value}
                      </span>
                    </div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.15, duration: 0.45 }}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5",
                  )}
                  style={{ backgroundColor: `${config.accent}14` }}
                >
                  <CheckCircle2 className="h-4 w-4" style={{ color: config.accent }} />
                  <p className="text-[11px] font-semibold" style={{ color: config.accent }}>
                    {successMessage}
                  </p>
                </motion.div>

                {footerNote ? (
                  <p className="mt-3 text-center text-[9px] text-[#ABABAB]">{footerNote}</p>
                ) : null}
              </div>

              <div
                className="mx-auto h-3 w-[min(100%,272px)]"
                style={{
                  background: `linear-gradient(135deg, ${config.paper} 33.33%, transparent 33.33%) 0 0 / 12px 12px`,
                }}
              />
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
