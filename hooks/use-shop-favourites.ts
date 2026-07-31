"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  FAVOURITES_CHANGED_EVENT,
  readFavouriteIds,
  toggleFavourite as toggleFav,
} from "@/lib/shop-favourites"

export function useShopFavourites() {
  const { customer } = useAuth()
  const customerId = customer?.id || null
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    setIds(customerId ? readFavouriteIds(customerId) : [])
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<string[]>).detail
      setIds(Array.isArray(detail) ? detail : readFavouriteIds(customerId))
    }
    window.addEventListener(FAVOURITES_CHANGED_EVENT, onChange)
    return () => window.removeEventListener(FAVOURITES_CHANGED_EVENT, onChange)
  }, [customerId])

  const toggle = useCallback(
    (productId: string) => {
      const liked = toggleFav(productId, customerId)
      setIds(readFavouriteIds(customerId))
      return liked
    },
    [customerId],
  )

  const isFavourite = useCallback((productId: string) => ids.includes(productId), [ids])

  return { favouriteIds: ids, toggle, isFavourite }
}
