"use client"

import Image from "next/image"
import { motion } from "framer-motion"

export function PortalFooter() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="mt-auto border-t border-[#EAEAEA] bg-[#F7F7F7]"
    >
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 px-6 py-3.5">
        <Image
          src="/logo.svg"
          alt="Buffindia"
          width={96}
          height={28}
          className="h-7 w-auto object-contain opacity-90"
          unoptimized
        />
        <span className="text-[12px] text-[#8A8A8A]">© {new Date().getFullYear()} Buffindia</span>
      </div>
    </motion.footer>
  )
}
