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
    <Card className={cn("gap-4 overflow-hidden py-5", className)}>
      <CardHeader className="px-5">
        <CardTitle className="text-[17px] font-semibold">{title}</CardTitle>
        {(description != null || count != null) && (
          <CardDescription className="text-[13px]">
            {count != null ? `${count} rows` : description}
            {count != null && description ? ` · ${description}` : null}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="px-5">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-[#86868b]" />
          </div>
        ) : isEmpty ? (
          <p className="py-10 text-center text-[14px] text-[#86868b]">{emptyMessage}</p>
        ) : (
          <div className="space-y-2">{children}</div>
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
        "rounded-[12px] bg-[#f5f5f7] p-4 transition-[background-color,transform] duration-150",
        onClick && "cursor-pointer hover:bg-[#ececf0] active:scale-[0.99] active:duration-75",
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
    <div className="flex flex-col gap-4 pb-1 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1.5">
        <p className="admin-eyebrow [&>svg]:h-[13px] [&>svg]:w-[13px]" aria-hidden>
          {icon}
        </p>
        <h1 className="admin-page-title">{title}</h1>
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
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#86868b]" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="flex h-9 w-full px-3 py-2 pl-8 text-[14px]"
      />
    </div>
  )
}
