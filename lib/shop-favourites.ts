const LEGACY_STORAGE_KEY = "kraftreborn_favourites"
const EVENT_NAME = "kraftreborn-favourites-changed"

function storageKey(customerId?: string | null) {
  return customerId ? `kraftreborn_favourites_${customerId}` : LEGACY_STORAGE_KEY
}

function resolveCustomerId(explicit?: string | null): string | null {
  if (explicit) return explicit
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem("buffindia_customer")
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return typeof parsed?.id === "string" ? parsed.id : null
  } catch {
    return null
  }
}

export function readFavouriteIds(customerId?: string | null): string[] {
  if (typeof window === "undefined") return []
  try {
    const id = resolveCustomerId(customerId)
    if (!id) return []
    const raw = localStorage.getItem(storageKey(id))
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : []
  } catch {
    return []
  }
}

export function writeFavouriteIds(ids: string[], customerId?: string | null) {
  if (typeof window === "undefined") return
  const id = resolveCustomerId(customerId)
  if (!id) return
  const unique = [...new Set(ids)]
  localStorage.setItem(storageKey(id), JSON.stringify(unique))
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: unique }))
}

export function isFavourite(productId: string, customerId?: string | null): boolean {
  return readFavouriteIds(customerId).includes(productId)
}

export function toggleFavourite(productId: string, customerId?: string | null): boolean {
  const ids = readFavouriteIds(customerId)
  const next = ids.includes(productId) ? ids.filter((x) => x !== productId) : [...ids, productId]
  writeFavouriteIds(next, customerId)
  return next.includes(productId)
}

export { EVENT_NAME as FAVOURITES_CHANGED_EVENT }
