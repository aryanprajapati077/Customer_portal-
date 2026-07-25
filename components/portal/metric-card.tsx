"use client"

import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  icon: LucideIcon
  iconBg: string
  iconColor: string
  label: string
  value: string
  valueClassName?: string
  description: string
  footer?: ReactNode
  className?: string
}

export function MetricCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  valueClassName,
  description,
  footer,
  className,
}: MetricCardProps) {
  return (
    <motion.div
      className={cn("portal-card p-4 group/card h-full flex flex-col min-h-[148px]", className)}
      whileHover={{ y: -4, boxShadow: "0 10px 28px rgba(16,24,40,0.08)" }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
    >
      <motion.div
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center mb-3",
          iconBg,
        )}
        whileHover={{ scale: 1.12, rotate: -6 }}
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
      >
        <Icon className={cn("w-[18px] h-[18px]", iconColor)} strokeWidth={1.75} />
      </motion.div>
      <p className="text-[11.5px] text-[#7A7A7A] mb-1.5 leading-none">{label}</p>
      <motion.p
        className={cn(
          "text-[22px] font-bold text-[#1A1A1A] leading-none tracking-[-0.02em]",
          valueClassName,
        )}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        key={value}
      >
        {value}
      </motion.p>
      <p className="text-[11.5px] text-[#8A8A8A] mt-2 leading-snug flex-1">{description}</p>
      {footer ? <div className="mt-auto pt-1">{footer}</div> : null}
    </motion.div>
  )
}
