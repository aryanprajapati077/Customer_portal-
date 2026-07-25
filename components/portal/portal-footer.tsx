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
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2.5 px-6 py-3.5">
        <span className="text-[12px] text-[#8A8A8A] font-medium">Proudly supported by</span>
        <div className="flex items-center gap-3 sm:gap-5">
          <Image
            src="/portal/iima-logo.png"
            alt="IIM Ahmedabad"
            width={56}
            height={56}
            className="h-10 w-auto object-contain"
            unoptimized
          />
          <span className="w-px h-7 bg-[#D5D5D5] shrink-0" aria-hidden />
          <Image
            src="/portal/kotak-bizlabs-logo.png"
            alt="Kotak BizLabs"
            width={180}
            height={32}
            className="h-7 sm:h-8 w-auto object-contain"
            unoptimized
          />
        </div>
      </div>
    </motion.footer>
  )
}
