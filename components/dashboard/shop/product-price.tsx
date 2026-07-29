import { formatInr } from "@/lib/kraftreborn-products"
import { cn } from "@/lib/utils"

type ProductPriceProps = {
  price: number
  originalPrice?: number | null
  size?: "sm" | "md" | "lg"
  className?: string
  /** Pill style used on product cards */
  variant?: "inline" | "pill"
}

export function ProductPrice({
  price,
  originalPrice,
  size = "sm",
  className,
  variant = "inline",
}: ProductPriceProps) {
  const showOriginal = Boolean(originalPrice && originalPrice > price)

  const originalClass = cn(
    "font-medium text-[#A0A0A0] line-through decoration-[#A0A0A0]",
    size === "sm" && "text-[11px]",
    size === "md" && "text-sm",
    size === "lg" && "text-lg",
  )

  const currentClass = cn(
    "font-bold text-[#141414]",
    size === "sm" && "text-[12px]",
    size === "md" && "text-base",
    size === "lg" && "text-3xl",
  )

  if (variant === "pill") {
    return (
      <span
        className={cn(
          "inline-flex items-baseline gap-1.5 rounded-full bg-[#E8F5E9] px-2.5 py-[3px]",
          className,
        )}
      >
        {showOriginal ? <span className={originalClass}>{formatInr(originalPrice!)}</span> : null}
        <span className={cn(currentClass, "text-[#1B7339]")}>{formatInr(price)}</span>
      </span>
    )
  }

  return (
    <div className={cn("flex flex-wrap items-baseline gap-1.5", className)}>
      {showOriginal ? <span className={originalClass}>{formatInr(originalPrice!)}</span> : null}
      <span className={currentClass}>{formatInr(price)}</span>
    </div>
  )
}
