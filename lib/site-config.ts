/** Production portal URL — used in metadata, emails, and absolute links */
export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://buffindia.com"

export const SITE_NAME = "Buffindia Impact Portal"
export const SITE_DOMAIN = "buffindia.com"

export function absoluteUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`
  return `${SITE_URL}${p}`
}
