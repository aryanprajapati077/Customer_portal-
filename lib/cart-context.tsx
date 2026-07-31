"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useAuth } from "@/lib/auth-context"

export interface ShopProduct {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number | null
  category: string
  tagline: string
  buttsRescued: number
  imageUrl?: string | null
  imageUrls?: string[]
  imageGradient: string
  allowsLogo: boolean
  availableColors?: string[]
  colorImages?: Record<string, string>
}

export interface CartItem {
  productId: string
  quantity: number
  product: ShopProduct
  color?: string
}

export interface CartLine extends CartItem {
  lineTotal: number
}

const LEGACY_STORAGE_KEY = "kraftreborn_cart"

function storageKey(customerId: string) {
  return `kraftreborn_cart_${customerId}`
}

interface CartContextType {
  items: CartItem[]
  lines: CartLine[]
  itemCount: number
  subtotal: number
  addItem: (product: ShopProduct, quantity?: number, color?: string) => void
  removeItem: (productId: string, color?: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

function loadCart(customerId: string): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(storageKey(customerId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((i) => i.product) : []
  } catch {
    return []
  }
}

function saveCart(customerId: string, items: CartItem[]) {
  localStorage.setItem(storageKey(customerId), JSON.stringify(items))
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { customer } = useAuth()
  const customerId = customer?.id || null
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Reload cart whenever the logged-in customer changes (per-customer carts)
  useEffect(() => {
    setHydrated(false)
    if (!customerId) {
      setItems([])
      setHydrated(true)
      return
    }
    // Drop legacy shared cart so one browser session cannot leak items across clients
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY)
    } catch {
      /* ignore */
    }
    setItems(loadCart(customerId))
    setHydrated(true)
  }, [customerId])

  useEffect(() => {
    if (!hydrated || !customerId) return
    saveCart(customerId, items)
  }, [items, hydrated, customerId])

  const lines = useMemo((): CartLine[] => {
    return items.map((item) => ({
      ...item,
      lineTotal: item.product.price * item.quantity,
    }))
  }, [items])

  const itemCount = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines])
  const subtotal = useMemo(() => lines.reduce((sum, l) => sum + l.lineTotal, 0), [lines])

  const addItem = useCallback((product: ShopProduct, quantity = 1, color?: string) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.productId === product.id && (i.color || "") === (color || ""),
      )
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id && (i.color || "") === (color || "")
            ? { ...i, quantity: i.quantity + quantity, product, color }
            : i,
        )
      }
      return [...prev, { productId: product.id, quantity, product, color }]
    })
  }, [])

  const removeItem = useCallback((productId: string, color?: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && (color === undefined || (i.color || "") === color))),
    )
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId))
      return
    }
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  return (
    <CartContext.Provider
      value={{ items, lines, itemCount, subtotal, addItem, removeItem, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
