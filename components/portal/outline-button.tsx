import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface OutlineButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  tone?: "neutral" | "green"
}

export const OutlineButton = forwardRef<HTMLButtonElement, OutlineButtonProps>(
  function OutlineButton({ children, className, tone = "neutral", ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          tone === "green" ? "portal-btn-outline-green" : "portal-btn-outline",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )
  },
)
