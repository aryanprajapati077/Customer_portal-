"use client"

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { useEffect } from "react"

function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const mv = useMotionValue(0)
  const spring = useSpring(mv, { stiffness: 60, damping: 20 })
  const display = useTransform(spring, (v) => `${Math.round(v)}${suffix}`)

  useEffect(() => {
    mv.set(to)
  }, [mv, to])

  return <motion.strong className="tabular-nums">{display}</motion.strong>
}

export function LandingHeroVisual() {
  return (
    <div className="landing-hero-visual relative mx-auto aspect-square w-full max-w-[420px]">
      <motion.div
        aria-hidden
        className="absolute inset-[6%] rounded-full border border-[var(--l-line)]"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        aria-hidden
        className="absolute inset-[18%] rounded-full border border-[var(--l-line)]/70"
        animate={{ rotate: -360 }}
        transition={{ duration: 42, repeat: Infinity, ease: "linear" }}
      />

      {/* Floating cigarette */}
      <motion.div
        aria-hidden
        className="absolute left-1/2 top-[38%] z-10 flex h-7 w-44 -translate-x-1/2 -translate-y-1/2 items-center overflow-hidden rounded-full shadow-[0_12px_30px_rgba(0,0,0,0.18)]"
        animate={{ y: [0, -10, 0], rotate: [-8, -5, -8] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="h-full w-[28%] bg-[#EF6C00]" />
        <span className="relative h-full flex-1 bg-[#F7F2E8]">
          <span className="absolute inset-y-[35%] left-[12%] right-[18%] border-y border-[#ded8cb]" />
        </span>
        <span className="relative h-full w-3 bg-[#1a1a1a]">
          <motion.span
            className="absolute -right-1 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[#ff5a1f] blur-[1px]"
            animate={{ opacity: [0.7, 1, 0.7], scale: [0.9, 1.15, 0.9] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        </span>
      </motion.div>

      <motion.div
        className="absolute right-[6%] top-[18%] z-20 max-w-[150px] rounded-2xl border border-[var(--l-line)] bg-white/90 px-4 py-3 shadow-[0_10px_30px_rgba(20,20,20,0.08)] backdrop-blur-sm"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.7 }}
      >
        <p className="landing-display text-3xl leading-none tracking-tight text-[var(--l-ink)]">
          <CountUp to={100} />
          <span className="text-2xl">B+</span>
        </p>
        <p className="mt-1 text-[11px] leading-snug text-[var(--l-muted)]">
          cigarettes circulate
          <br />
          in India
        </p>
      </motion.div>

      <motion.div
        className="absolute bottom-[18%] left-[4%] z-20 rounded-2xl border border-[var(--l-line)] bg-[var(--l-ink)] px-4 py-3 text-[#F7F6F2] shadow-[0_10px_30px_rgba(20,20,20,0.18)]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.7 }}
      >
        <p className="landing-display text-3xl leading-none tracking-tight">&lt;5%</p>
        <p className="mt-1 text-[11px] leading-snug text-white/65">properly disposed*</p>
      </motion.div>

      {[
        { label: "cellulose acetate", className: "left-[8%] top-[12%]" },
        { label: "toxic residue", className: "right-[2%] bottom-[38%]" },
        { label: "microplastic", className: "left-[22%] bottom-[8%]" },
      ].map((chip, i) => (
        <motion.span
          key={chip.label}
          className={`absolute z-10 rounded-full border border-[var(--l-line)] bg-white/80 px-3 py-1 text-[11px] font-medium tracking-wide text-[var(--l-muted)] backdrop-blur-sm ${chip.className}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.55 + i * 0.1, duration: 0.5 }}
        >
          {chip.label}
        </motion.span>
      ))}
    </div>
  )
}
