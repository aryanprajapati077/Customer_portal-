import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

interface PageHeaderProps {
  icon: LucideIcon
  title: string
  subtitle: string
  actions?: ReactNode
}

export function PageHeader({ icon: Icon, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 pt-1">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full bg-[#E8F5E9] flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-[#1B7339]" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-[26px] md:text-[28px] font-bold text-[#1A1A1A] leading-tight tracking-[-0.02em]">
            {title}
          </h1>
          <p className="text-[13.5px] text-[#7A7A7A] mt-0.5">{subtitle}</p>
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  )
}
