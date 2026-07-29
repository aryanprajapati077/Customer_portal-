"use client"

import { useCallback, useEffect, useState } from "react"
import {
  FAVOURITES_CHANGED_EVENT,
  readFavouriteIds,
  toggleFavourite as toggleFav,
} from "@/lib/shop-favourites"

export function useShopFavourites() {
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    setIds(readFavouriteIds())
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<string[]>).detail
      setIds(Array.isArray(detail) ? detail : readFavouriteIds())
    }
    window.addEventListener(FAVOURITES_CHANGED_EVENT, onChange)
    return () => window.removeEventListener(FAVOURITES_CHANGED_EVENT, onChange)
  }, [])

  const toggle = useCallback((productId: string) => {
    const liked = toggleFav(productId)
    setIds(readFavouriteIds())
    return liked
  }, [])

  const isFavourite = useCallback((productId: string) => ids.includes(productId), [ids])

  return { favouriteIds: ids, toggle, isFavourite }
}
