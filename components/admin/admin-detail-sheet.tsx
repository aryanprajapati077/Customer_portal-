"use client"

import { type ReactNode } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

type AdminDetailSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function AdminDetailSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: AdminDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={cn("w-full gap-0 overflow-y-auto p-0 sm:max-w-lg", className)}>
        <div className="border-b border-[#E2EBE4] bg-[#F7FBF7] px-6 py-5">
          <SheetHeader className="space-y-1.5 p-0 text-left">
            <SheetTitle className="font-[family-name:var(--font-display)] text-xl text-[#141414]">
              {title}
            </SheetTitle>
            {description ? (
              <SheetDescription className="text-[13px] text-[#5A5A5A]">{description}</SheetDescription>
            ) : null}
          </SheetHeader>
        </div>
        <div className="space-y-4 px-6 py-5 pb-10">{children}</div>
      </SheetContent>
    </Sheet>
  )
}

type AdminSheetFieldProps = {
  label: string
  value: ReactNode
}

export function AdminSheetField({ label, value }: AdminSheetFieldProps) {
  return (
    <div className="rounded-xl border border-[#E2EBE4] bg-white px-3.5 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1B7339]">{label}</p>
      <div className="mt-1 text-[13px] font-medium text-[#141414]">{value ?? "—"}</div>
    </div>
  )
}

export function AdminSheetSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-[#1B7339]">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}
