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
    <p className="text-[12px] text-[#86868b] tabular-nums">
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
        "flex flex-col items-center justify-center rounded-[18px] bg-white px-6 py-14 text-center shadow-[0_0.5px_1px_rgba(0,0,0,0.04),0_2px_12px_rgba(0,0,0,0.04)]",
        className,
      )}
    >
      <div className="mb-3 text-[#c7c7cc] [&>svg]:h-9 [&>svg]:w-9">
        {icon ?? <SearchX className="h-9 w-9" strokeWidth={1.5} aria-hidden />}
      </div>
      <p className="text-[17px] font-semibold tracking-[-0.02em] text-[#1d1d1f]">{title}</p>
      {description ? <p className="mt-1 max-w-md text-[14px] text-[#6e6e73]">{description}</p> : null}
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
            "flex items-center justify-between rounded-[14px] bg-white px-4 py-3 text-[14px] shadow-[0_0.5px_1px_rgba(0,0,0,0.04),0_2px_12px_rgba(0,0,0,0.04)] transition-transform duration-150 active:scale-[0.985] active:duration-75",
          )}
        >
          <span className="flex items-center gap-2.5 font-medium text-[#1d1d1f]">
            <span
              aria-hidden
              className={cn(
                "h-2 w-2 rounded-full",
                item.tone === "danger" ? "bg-[#ff3b30]" : item.tone === "warn" ? "bg-[#ff9500]" : "bg-[#34c759]",
              )}
            />
            {item.label}
          </span>
          <span
            className={cn(
              "text-[17px] font-semibold tabular-nums tracking-[-0.02em]",
              item.tone === "danger"
                ? "text-[#d70015]"
                : item.tone === "warn"
                  ? "text-[#c25700]"
                  : "text-[#1d1d1f]",
            )}
          >
            {item.value}
          </span>
        </a>
      ))}
    </div>
  )
}
