const STORAGE_KEY = "kraftreborn_favourites"
const EVENT_NAME = "kraftreborn-favourites-changed"

export function readFavouriteIds(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : []
  } catch {
    return []
  }
}

export function writeFavouriteIds(ids: string[]) {
  if (typeof window === "undefined") return
  const unique = [...new Set(ids)]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(unique))
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: unique }))
}

export function isFavourite(productId: string): boolean {
  return readFavouriteIds().includes(productId)
}

export function toggleFavourite(productId: string): boolean {
  const ids = readFavouriteIds()
  const next = ids.includes(productId) ? ids.filter((id) => id !== productId) : [...ids, productId]
  writeFavouriteIds(next)
  return next.includes(productId)
}

export { EVENT_NAME as FAVOURITES_CHANGED_EVENT }
