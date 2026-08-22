"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

export interface Customer {
  id: string
  email: string
  companyName: string
  contactPerson: string
  primaryPocName?: string | null
  phone: string
  address: string
  totalWasteCollected: number
  cigaretteButtsCollected?: number
  microplasticsUpcycled?: number
  waterResourcesProtected?: number
  pendingCollection: number
  certificatesEarned: number
  joinDate: string
  lastCollection: string
  status: string
  co2Saved: number
  kraftrebornCredits?: number
  treesEquivalent: number
  industry?: string
  employeeCount?: number
  monthlyTarget?: number
  disposalUnitInstalled?: number
  isGroup?: boolean
  parentCustomerId?: string | null
  collectionFrequency?: string | null
  serviceStartDate?: string | null
  noOfKiosk?: number
  noOfBasicKiosk?: number
  noOfAdvanceKiosk?: number
  noOfPanVendorKiosk?: number
  noOfWallMountKiosk?: number
  gstin?: string | null
  serviceStatus?: string | null
  logoUrl?: string | null
}

interface AuthContextType {
  customer: Customer | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  refreshCustomerData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function clearLocalCustomer() {
  localStorage.removeItem("buffindia_customer")
  localStorage.removeItem("buffindia_customer_auth")
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const savedCustomer = localStorage.getItem("buffindia_customer")
    if (!savedCustomer) {
      setIsLoading(false)
      return
    }

    let parsed: Customer | null = null
    try {
      parsed = JSON.parse(savedCustomer) as Customer
      if (parsed?.id) setCustomer(parsed)
      else {
        clearLocalCustomer()
        setIsLoading(false)
        return
      }
    } catch {
      clearLocalCustomer()
      setIsLoading(false)
      return
    }

    // Revalidate cookie session against server (clears stale localStorage after logout/expiry)
    void fetch(`/api/customer/profile?customerId=${encodeURIComponent(parsed.id)}`, {
      credentials: "include",
    })
      .then(async (response) => {
        if (cancelled) return
        if (response.status === 401) {
          setCustomer(null)
          clearLocalCustomer()
          return
        }
        const data = await response.json()
        if (data.success && data.customer) {
          setCustomer(data.customer)
          localStorage.setItem("buffindia_customer", JSON.stringify(data.customer))
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success && data.customer) {
        setCustomer(data.customer)
        localStorage.setItem("buffindia_customer", JSON.stringify(data.customer))
        return { success: true }
      }

      return { success: false, error: data.error || "Login failed" }
    } catch {
      return { success: false, error: "Network error. Please try again." }
    }
  }

  const logout = () => {
    void fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {})
    setCustomer(null)
    clearLocalCustomer()
  }

  const refreshCustomerData = useCallback(async () => {
    if (!customer?.id) return

    try {
      const response = await fetch(`/api/customer/profile?customerId=${encodeURIComponent(customer.id)}`, {
        credentials: "include",
      })
      if (response.status === 401) {
        setCustomer(null)
        clearLocalCustomer()
        return
      }
      const data = await response.json()
      if (data.success && data.customer) {
        setCustomer((prev) => ({ ...(prev || {}), ...data.customer }))
        localStorage.setItem("buffindia_customer", JSON.stringify(data.customer))
      }
    } catch (error) {
      console.error("Error refreshing customer data:", error)
    }
  }, [customer?.id])

  return (
    <AuthContext.Provider value={{ customer, isLoading, login, logout, refreshCustomerData }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
