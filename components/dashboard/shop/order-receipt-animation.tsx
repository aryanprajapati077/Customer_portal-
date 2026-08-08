"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { formatInr } from "@/lib/kraftreborn-products"
import { CheckCircle2 } from "lucide-react"

export type ReceiptItem = { name: string; quantity: number; price: number }

type OrderReceiptAnimationProps = {
  open: boolean
  orderNumber: string
  companyName: string
  items: ReceiptItem[]
  total: number
  onComplete: () => void
}

export function OrderReceiptAnimation({
  open,
  orderNumber,
  companyName,
  items,
  total,
  onComplete,
}: OrderReceiptAnimationProps) {
  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => onComplete(), 2800)
    return () => clearTimeout(timer)
  }, [open, onComplete])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="receipt-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[200] flex items-start justify-center overflow-hidden bg-[#0a0a0a]/75 backdrop-blur-sm px-4 pt-8 sm:pt-14"
        >
          <div className="relative w-full max-w-sm">
            {/* Printer */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 mx-auto w-[min(100%,280px)]"
            >
              <div className="rounded-t-2xl bg-gradient-to-b from-[#3D3D3D] to-[#1A1A1A] px-5 pt-4 pb-3 shadow-2xl">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#4CAF50] animate-pulse" />
                    <span className="h-2 w-2 rounded-full bg-[#FFC107]" />
                    <span className="h-2 w-2 rounded-full bg-[#F44336]" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
                    KraftReborn
                  </span>
                </div>
                <div className="h-3 rounded-md bg-[#0D0D0D] shadow-inner" />
                <div className="mx-auto mt-1 h-1.5 w-[85%] rounded-full bg-[#555]" />
              </div>
              <div className="h-2 bg-[#111] shadow-lg" />
            </motion.div>

            {/* Receipt sliding out */}
            <motion.div
              initial={{ y: -120, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{
                delay: 0.35,
                duration: 0.85,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative -mt-1 origin-top"
            >
              <div
                className="mx-auto w-[min(100%,260px)] rounded-b-sm bg-[#FFFEF8] px-5 py-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, transparent, transparent 23px, rgba(0,0,0,0.03) 23px, rgba(0,0,0,0.03) 24px)",
                }}
              >
                <div className="text-center border-b border-dashed border-[#D4C4A8] pb-4 mb-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#1B7339]">
                    Buffindia
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-display)] text-[15px] font-bold text-[#141414]">
                    Order Receipt
                  </p>
                  <p className="mt-1 text-[10px] text-[#8A8A8A]">#{orderNumber}</p>
                </div>

                <p className="text-[11px] font-semibold text-[#141414] mb-3">{companyName}</p>

                <div className="space-y-2 mb-4">
                  {items.map((item) => (
                    <div key={`${item.name}-${item.quantity}`} className="flex justify-between gap-2 text-[11px]">
                      <span className="text-[#5A5A5A] leading-snug">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="shrink-0 font-medium text-[#141414]">
                        {formatInr(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed border-[#D4C4A8] pt-3 flex justify-between items-center">
                  <span className="text-[12px] font-bold text-[#141414]">Total</span>
                  <span className="text-[16px] font-bold text-[#1B7339]">{formatInr(total)}</span>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2, duration: 0.4 }}
                  className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#E8F5E9] px-3 py-2.5"
                >
                  <CheckCircle2 className="h-4 w-4 text-[#1B7339]" />
                  <p className="text-[11px] font-medium text-[#1B7339]">Order placed successfully!</p>
                </motion.div>

                <p className="mt-3 text-center text-[9px] text-[#ABABAB]">
                  Rupee amount deducted when order is completed
                </p>
              </div>

              {/* Tear edge */}
              <div
                className="mx-auto h-3 w-[min(100%,260px)]"
                style={{
                  background:
                    "linear-gradient(135deg, #FFFEF8 33.33%, transparent 33.33%) 0 0 / 12px 12px",
                }}
              />
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
