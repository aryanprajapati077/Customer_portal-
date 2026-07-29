import { PRODUCT_COLOR_OPTIONS } from "@/lib/product-colors"

/** Map color names to product photos when multiple images exist. */
export function buildColorImageMap(
  colors: string[],
  imageUrls: string[],
): Record<string, string> {
  const map: Record<string, string> = {}
  if (!imageUrls.length) return map

  const variantUrls = imageUrls.slice(1)
  const palette = colors.filter((c) => c !== "Mix")

  palette.forEach((color, index) => {
    const url = variantUrls[index] || imageUrls[0]
    if (url) map[color] = url
  })

  if (colors.includes("Mix") && imageUrls[0]) {
    map.Mix = imageUrls[0]
  }

  return map
}

export function imageForColor(
  color: string,
  imageUrls: string[],
  colorImages?: Record<string, string>,
): string {
  if (colorImages?.[color]) return colorImages[color]
  const map = buildColorImageMap(
    PRODUCT_COLOR_OPTIONS as unknown as string[],
    imageUrls,
  )
  return map[color] || imageUrls[0] || ""
}
