import { type ReactNode } from "react"
import { cn } from "@/lib/utils"

type AdminPageShellProps = {
  children: ReactNode
  className?: string
}

/** Consistent page spacing — applied automatically via layout; use for nested sections. */
export function AdminPageShell({ children, className }: AdminPageShellProps) {
  return <div className={cn("admin-page", className)}>{children}</div>
}

type AdminPageIntroProps = {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

/** Standard page header block for pages not using AdminPageHeader client component. */
export function AdminPageIntro({
  eyebrow,
  title,
  description,
  actions,
  className,
}: AdminPageIntroProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-[#ebe9e4] pb-5 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="space-y-2">
        {eyebrow ? <p className="admin-eyebrow">{eyebrow}</p> : null}
        <h1 className="admin-page-title">{title}</h1>
        {description ? <p className="admin-page-desc max-w-2xl">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}
