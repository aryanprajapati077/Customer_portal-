"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

export interface Customer {
  id: string
  email: string
  companyName: string
  contactPerson: string
  phone: string
  address: string
  totalWasteCollected: number
  pendingCollection: number
  certificatesEarned: number
  joinDate: string
  lastCollection: string
  status: string
  co2Saved: number
  treesEquivalent: number
  industry?: string
  employeeCount?: number
  monthlyTarget?: number
}

interface AuthContextType {
  customer: Customer | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  refreshCustomerData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const savedCustomer = localStorage.getItem("buffindia_customer")
    if (savedCustomer) {
      try {
        setCustomer(JSON.parse(savedCustomer))
      } catch {
        localStorage.removeItem("buffindia_customer")
      }
    }
    setIsLoading(false)
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
    setCustomer(null)
    localStorage.removeItem("buffindia_customer")
  }

  const refreshCustomerData = useCallback(async () => {
    if (!customer?.email) return

    try {
      // Re-fetch customer data to get latest from Google Sheets
      const savedPassword = localStorage.getItem("buffindia_customer_auth")
      if (savedPassword) {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: customer.email, password: savedPassword }),
        })
        const data = await response.json()
        if (data.success && data.customer) {
          setCustomer(data.customer)
          localStorage.setItem("buffindia_customer", JSON.stringify(data.customer))
        }
      }
    } catch (error) {
      console.error("Error refreshing customer data:", error)
    }
  }, [customer?.email])

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
