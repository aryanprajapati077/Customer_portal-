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
    <Card className={cn("glass border-border/50 overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {(description != null || count != null) && (
          <CardDescription>
            {count != null ? `${count} rows` : description}
            {count != null && description ? ` · ${description}` : null}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
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
        "rounded-2xl border border-border/50 bg-muted/20 p-4 transition-all duration-300",
        onClick && "cursor-pointer hover:bg-muted/30 hover:shadow-md",
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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="admin-page-title flex items-center gap-2">
          {icon}
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">{description}</p>
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
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  )
}
