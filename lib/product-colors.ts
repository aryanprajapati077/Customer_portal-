/** KraftReborn product color options */
export const PRODUCT_COLOR_OPTIONS = [
  "Blue",
  "Green",
  "Yellow",
  "Red",
  "White",
  "Mix",
] as const

export type ProductColor = (typeof PRODUCT_COLOR_OPTIONS)[number]

export const DEFAULT_PRODUCT_COLORS: ProductColor[] = [...PRODUCT_COLOR_OPTIONS]

export function parseProductColors(raw?: string | null): string[] {
  if (!raw?.trim()) return [...DEFAULT_PRODUCT_COLORS]
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return [...DEFAULT_PRODUCT_COLORS]
    const cleaned = parsed.map(String).filter((c) => PRODUCT_COLOR_OPTIONS.includes(c as ProductColor))
    return cleaned.length ? cleaned : [...DEFAULT_PRODUCT_COLORS]
  } catch {
    return [...DEFAULT_PRODUCT_COLORS]
  }
}

export function serializeProductColors(colors: string[]): string {
  const cleaned = colors.filter((c) => PRODUCT_COLOR_OPTIONS.includes(c as ProductColor))
  return JSON.stringify(cleaned.length ? cleaned : DEFAULT_PRODUCT_COLORS)
}
