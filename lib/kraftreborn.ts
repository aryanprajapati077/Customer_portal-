export const KRAFTREBORN_SHOP_URL =
  "https://kraft-reborn.vercel.app/shop?category=elegant-combos"

export function creditsToRupees(credits: number): number {
  return Math.max(0, Math.floor(credits))
}

export function buildKraftRebornShopUrl(options: {
  customerId: string
  credits: number
  email?: string
  companyName?: string
  returnUrl?: string
}) {
  const url = new URL(KRAFTREBORN_SHOP_URL)
  url.searchParams.set("portal_credits", String(creditsToRupees(options.credits)))
  url.searchParams.set("customer_id", options.customerId)
  if (options.email) url.searchParams.set("email", options.email)
  if (options.companyName) url.searchParams.set("company", options.companyName)
  if (options.returnUrl) url.searchParams.set("return_url", options.returnUrl)
  return url.toString()
}

/** Impact metrics for Kraft Reborn certificate (approximate from order value) */
export function computeKraftRebornImpact(orderAmountRupees: number, productCount = 1) {
  const butts = Math.max(1, Math.round(orderAmountRupees * 0.004))
  const soilSqFt = Math.max(1, Math.round(butts * 0.5))
  const waterLitres = Math.max(1, Math.round(butts * 1.2))
  const artisanMinutes = Math.max(15, productCount * 45)

  return {
    butts,
    soilSqFt,
    waterLitres,
    artisanMinutes,
    productCount,
    orderAmountRupees,
  }
}

export function generateOrderId(customerId: string): string {
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `KR-${customerId.slice(0, 4).toUpperCase()}-${suffix}`
}

export function getIndianFiscalYear(date = new Date()): string {
  const month = date.getMonth()
  const year = date.getFullYear()
  const startYear = month >= 3 ? year : year - 1
  const endYear = startYear + 1
  return `FY ${startYear}-${String(endYear).slice(-2)}`
}
