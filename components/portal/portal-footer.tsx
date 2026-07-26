"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import {
  IIMA_LOGO_PORTAL,
  IIMA_VENTURES_URL,
  KOTAK_BIZLABS_URL,
  KOTAK_LOGO_PORTAL,
} from "@/lib/supporter-brands"

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
          <a
            href={IIMA_VENTURES_URL}
            target="_blank"
            rel="noreferrer"
            className="opacity-90 transition-opacity hover:opacity-100"
            aria-label="IIMA Ventures"
          >
            <Image
              src={IIMA_LOGO_PORTAL}
              alt="IIMA Ventures"
              width={96}
              height={48}
              className="h-10 w-auto object-contain"
              unoptimized
            />
          </a>
          <span className="w-px h-7 bg-[#D5D5D5] shrink-0" aria-hidden />
          <a
            href={KOTAK_BIZLABS_URL}
            target="_blank"
            rel="noreferrer"
            className="opacity-90 transition-opacity hover:opacity-100"
            aria-label="Kotak BizLabs"
          >
            <Image
              src={KOTAK_LOGO_PORTAL}
              alt="Kotak BizLabs"
              width={180}
              height={32}
              className="h-7 sm:h-8 w-auto object-contain"
              unoptimized
            />
          </a>
        </div>
      </div>
    </motion.footer>
  )
}
