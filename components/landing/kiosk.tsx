"use client"

import { motion } from "framer-motion"

function DropButt({ delay, xOffset }: { delay: number; xOffset: number }) {
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute z-20 block h-2.5 w-9 origin-center rounded-full sm:h-3 sm:w-10"
      style={{
        left: `calc(50% + ${xOffset}px)`,
        marginLeft: "-18px",
        background:
          "linear-gradient(90deg, #EF6C00 0%, #EF6C00 30%, #F7F2E8 30%, #F7F2E8 90%, #C4B8A4 90%)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
      }}
      initial={{ top: "10%", opacity: 0, rotate: -36, scale: 0.9 }}
      animate={{
        top: ["10%", "38%", "41%"],
        opacity: [0, 1, 0],
        rotate: [-36, -14, 0],
        scale: [0.9, 1, 0.5],
      }}
      transition={{
        duration: 2.1,
        delay,
        repeat: Infinity,
        repeatDelay: 2.6,
        ease: [0.33, 1, 0.68, 1],
        times: [0, 0.78, 1],
      }}
    />
  )
}

/** Tall slender kiosk — matches redesign reference proportions (~1:3.5–4) */
export function LandingKiosk() {
  return (
    <div className="landing-kiosk-stage relative mx-auto flex h-[520px] w-full max-w-[380px] items-center justify-center overflow-visible sm:h-[580px] lg:h-[620px]">
      {/* Single large ring like reference */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[min(100%,420px)] w-[min(100%,420px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/12 sm:h-[480px] sm:w-[480px]"
      />

      <motion.div
        className="landing-kiosk relative z-10 flex w-[148px] flex-col items-center sm:w-[168px] lg:w-[176px]"
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Tall cream body */}
        <div className="relative flex h-[400px] w-full flex-col overflow-hidden rounded-t-[28px] rounded-b-[20px] bg-[#F2F0E9] shadow-[0_28px_56px_rgba(0,0,0,0.4)] sm:h-[460px] lg:h-[500px]">
          {/* Lime screen */}
          <div className="m-2.5 shrink-0 rounded-[14px] bg-[#C8F000] px-3 py-3.5 sm:m-3 sm:rounded-[16px] sm:px-3.5 sm:py-4">
            <p className="text-[9px] font-bold tracking-[0.22em] text-[#141414] sm:text-[10px]">
              THINK
            </p>
            <p className="mt-0.5 text-[18px] font-extrabold leading-[1.05] tracking-tight text-[#141414] sm:text-[21px] lg:text-[22px]">
              before
              <br />
              you drop.
            </p>
          </div>

          {/* Slot */}
          <div className="relative mx-auto mt-3 h-3 w-[68%] shrink-0 overflow-hidden rounded-full bg-[#141414] sm:mt-4 sm:h-3.5">
            <span className="absolute inset-x-2 top-1/2 h-px -translate-y-1/2 bg-white/15" />
          </div>

          <p className="mt-4 shrink-0 text-center text-[8.5px] font-semibold leading-[1.5] tracking-[0.18em] text-[#141414] sm:mt-5 sm:text-[9.5px]">
            CIGARETTE
            <br />
            WASTE ONLY
          </p>

          {/* Tall empty body — key to reference proportions */}
          <div className="min-h-0 flex-1" />

          {/* Static butt on right of slot area */}
          <span
            aria-hidden
            className="absolute right-[-18px] top-[38%] h-2 w-10 rounded-full shadow-sm sm:right-[-22px] sm:h-2.5 sm:w-11"
            style={{
              background:
                "linear-gradient(90deg, #EF6C00 0%, #EF6C00 32%, #F7F2E8 32%, #F7F2E8 100%)",
              transform: "rotate(-28deg)",
            }}
          />
        </div>

        {/* Orange pill base — wider than body */}
        <div className="relative z-0 -mt-1 h-5 w-[128%] rounded-full bg-[#EF6C00] shadow-[0_10px_28px_rgba(239,108,0,0.35)] sm:h-6 sm:w-[132%]" />

        <DropButt delay={0.25} xOffset={-2} />
        <DropButt delay={2.8} xOffset={10} />
      </motion.div>
    </div>
  )
}
