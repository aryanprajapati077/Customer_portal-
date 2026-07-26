"use client"

import { useState } from "react"
import { Cigarette, Gift, Info, Recycle, Sparkles } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { OutlineButton } from "@/components/portal/outline-button"
import { cn } from "@/lib/utils"

const STAGES = [
  {
    eyebrow: "Stage 01",
    title: "It starts with a single butt",
    subtitle: "Littered filters leach toxins into soil and water — unless we catch them first.",
    icon: Cigarette,
  },
  {
    eyebrow: "Stage 02",
    title: "Collected. Weighed. Recovered.",
    subtitle: "Your kiosks feed a circular stream — ash, fibre and impact, all measured.",
    icon: Recycle,
  },
  {
    eyebrow: "Stage 03",
    title: "Waste becomes KraftReborn",
    subtitle: "Beautiful. Sustainable. Made from cigarette waste — for gifts that tell a story.",
    icon: Gift,
  },
  {
    eyebrow: "Stage 04",
    title: "Redeem your rupee amount",
    subtitle: "Shop KraftReborn with your available rupee balance and bring circular design home.",
    icon: Sparkles,
  },
]

export function HowItWorksDialog() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <OutlineButton type="button">
          <Info className="w-4 h-4" />
          How it Works
        </OutlineButton>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-[#E5E2DA] bg-[#FBFBF8] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-display)] text-xl">
            How KraftReborn works
          </DialogTitle>
          <DialogDescription>
            From a single cigarette butt to products you can redeem with your rupee balance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5">
          {STAGES.map((s, i) => {
            const Icon = s.icon
            const isActive = i === active
            return (
              <button
                key={s.eyebrow}
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-all",
                  isActive
                    ? "border-[#1B7339]/40 bg-[#F4F9F5] shadow-sm"
                    : "border-[#EAEAEA] bg-white hover:bg-[#FAFAFA]",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    isActive ? "bg-[#E8F5E9] text-[#1B7339]" : "bg-[#F5F5F5] text-[#7A7A7A]",
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
                    {s.eyebrow}
                  </span>
                  <span className="mt-0.5 block text-[14px] font-semibold text-[#1A1A1A]">{s.title}</span>
                  {isActive ? (
                    <span className="mt-1 block text-[12.5px] leading-relaxed text-[#5A5A5A]">
                      {s.subtitle}
                    </span>
                  ) : null}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-center gap-1.5 pt-1">
          {STAGES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "rounded-full transition-all",
                active === i ? "h-1.5 w-4 bg-[#1B7339]" : "h-1.5 w-1.5 bg-[#C5C5C5]",
              )}
              aria-label={`Stage ${i + 1}`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
