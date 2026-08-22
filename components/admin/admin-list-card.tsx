"use client"

import { type ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Search } from "lucide-react"
import { cn } from "@/lib/utils"

type AdminListCardProps = {
  title: string
  description?: string
  count?: number
  loading?: boolean
  isEmpty?: boolean
  emptyMessage?: string
  children: ReactNode
  className?: string
}

export function AdminListCard({
  title,
  description,
  count,
  loading,
  isEmpty,
  emptyMessage = "No rows found.",
  children,
  className,
}: AdminListCardProps) {
  return (
    <Card className={cn("overflow-hidden rounded-[14px] border-[#ebe9e4] bg-white shadow-sm", className)}>
      <CardHeader className="border-b border-[#f0eeea] bg-[#fafaf8]/80 pb-4">
        <CardTitle className="text-[15px] font-semibold tracking-tight">{title}</CardTitle>
        {(description != null || count != null) && (
          <CardDescription className="text-[12px]">
            {count != null ? `${count} rows` : description}
            {count != null && description ? ` · ${description}` : null}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : isEmpty ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <div className="space-y-3">{children}</div>
        )}
      </CardContent>
    </Card>
  )
}

type AdminListRowProps = {
  onClick?: () => void
  children: ReactNode
  className?: string
}

export function AdminListRow({ onClick, children, className }: AdminListRowProps) {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      className={cn(
        "rounded-xl border border-[#ebe9e4] bg-[#fafaf8] p-4 transition-all duration-200",
        onClick && "cursor-pointer hover:border-[#c8e6d4] hover:bg-white hover:shadow-md",
        className,
      )}
    >
      {children}
    </div>
  )
}

type AdminPageHeaderProps = {
  icon: ReactNode
  title: string
  description: string
  search?: ReactNode
  actions?: ReactNode
}

export function AdminPageHeader({ icon, title, description, search, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-[#ebe9e4] pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <h1 className="admin-page-title flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#dce8dc] bg-gradient-to-br from-[#f3faf4] to-white text-[#1b7339] shadow-sm [&>svg]:h-5 [&>svg]:w-5">
            {icon}
          </span>
          <span>{title}</span>
        </h1>
        <p className="admin-page-desc max-w-2xl">{description}</p>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
        {search}
        {actions}
      </div>
    </div>
  )
}

export function AdminSearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  className?: string
}) {
  return (
    <div className={cn("relative w-full sm:w-[320px]", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex h-10 w-full rounded-xl border border-[#e8e6e1] bg-white px-3 py-2 pl-9 text-sm shadow-sm ring-offset-background placeholder:text-[#9a9a9a] focus-visible:border-[#9fd4ad] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b7339]/15"
      />
    </div>
  )
}
