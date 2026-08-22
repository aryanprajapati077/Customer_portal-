"use client"

import { type ReactNode } from "react"
import { Loader2, RefreshCw, SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function AdminDataMeta({
  shown,
  total,
  noun = "row",
}: {
  shown: number
  total: number
  noun?: string
}) {
  return (
    <p className="text-[12px] text-[#6b6b6b]">
      Showing {shown} of {total} {noun}
      {total === 1 ? "" : "s"}
    </p>
  )
}

export function AdminLoadMore({
  loading,
  pageSize,
  onClick,
  disabled,
  className,
}: {
  loading?: boolean
  pageSize: number
  onClick: () => void
  disabled?: boolean
  className?: string
}) {
  return (
    <div className={cn("flex justify-center pt-2", className)}>
      <Button
        type="button"
        variant="outline"
        className="rounded-full"
        onClick={onClick}
        disabled={disabled || loading}
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {loading ? "Loading..." : `Load more (+${pageSize})`}
      </Button>
    </div>
  )
}

export function AdminRefreshButton({
  loading,
  onClick,
  label = "Refresh",
  className,
}: {
  loading?: boolean
  onClick: () => void
  label?: string
  className?: string
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={loading}
      className={cn("rounded-full", className)}
    >
      <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
      {label}
    </Button>
  )
}

export function AdminEmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-[#dce8dc] bg-[#fafaf8] px-6 py-12 text-center",
        className,
      )}
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#e8f5e9] text-[#1b7339]">
        {icon ?? <SearchX className="h-5 w-5" aria-hidden />}
      </div>
      <p className="text-sm font-semibold text-[#141414]">{title}</p>
      {description ? <p className="mt-1 max-w-md text-[13px] text-[#6b6b6b]">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function AdminAttentionStrip({
  items,
}: {
  items: { label: string; value: number | string; href: string; tone?: "default" | "warn" | "danger" }[]
}) {
  if (!items.length) return null
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <a
          key={item.href + item.label}
          href={item.href}
          className={cn(
            "flex items-center justify-between rounded-xl border px-4 py-3 text-[13px] transition hover:shadow-sm",
            item.tone === "danger"
              ? "border-[#f0d0d0] bg-[#fff8f8] hover:border-[#e57373]"
              : item.tone === "warn"
                ? "border-[#fde68a] bg-[#fffbeb] hover:border-[#fbbf24]"
                : "border-[#dce8dc] bg-[#f7fbf7] hover:border-[#9fd4ad]",
          )}
        >
          <span className="font-medium text-[#141414]">{item.label}</span>
          <span
            className={cn(
              "text-lg font-bold tabular-nums",
              item.tone === "danger"
                ? "text-[#c62828]"
                : item.tone === "warn"
                  ? "text-[#b45309]"
                  : "text-[#1b7339]",
            )}
          >
            {item.value}
          </span>
        </a>
      ))}
    </div>
  )
}
