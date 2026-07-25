"use client"

import Image from "next/image"
import { motion } from "framer-motion"

export function LandingProductComposition() {
  return (
    <motion.div
      className="relative mx-auto w-full max-w-[440px] bg-transparent"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <Image
        src="/landing/upcycled-products.png"
        alt="Upcycled BuffIndia products — frames, planters, trays, and stands"
        width={1200}
        height={900}
        className="h-auto w-full object-contain"
        sizes="(max-width: 768px) 100vw, 440px"
        priority={false}
      />
    </motion.div>
  )
}
