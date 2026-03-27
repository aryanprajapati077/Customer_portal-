"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { useAuth } from "@/lib/auth-context"

export type WeightUnit = "kg" | "lb"

type Preferences = {
  weightUnit: WeightUnit
}

type PreferencesContextType = {
  preferences: Preferences
  setWeightUnit: (unit: WeightUnit) => void
  formatWeight: (kg: number, opts?: { decimals?: number }) => { value: number; label: string; unit: WeightUnit }
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined)

function storageKey(customerId?: string) {
  return customerId ? `buffindia_preferences_${customerId}` : "buffindia_preferences"
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { customer } = useAuth()
  const key = storageKey(customer?.id)
  const [weightUnit, setWeightUnitState] = useState<WeightUnit>("kg")

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed?.weightUnit === "kg" || parsed?.weightUnit === "lb") {
        setWeightUnitState(parsed.weightUnit)
      }
    } catch {
      // ignore
    }
  }, [key])

  const setWeightUnit = (unit: WeightUnit) => {
    setWeightUnitState(unit)
    try {
      localStorage.setItem(key, JSON.stringify({ weightUnit: unit }))
    } catch {
      // ignore
    }
  }

  const preferences = useMemo(() => ({ weightUnit }), [weightUnit])

  const formatWeight: PreferencesContextType["formatWeight"] = (kg, opts) => {
    const decimals = opts?.decimals ?? 1
    if (!Number.isFinite(kg)) kg = 0
    if (weightUnit === "lb") {
      const lb = kg * 2.20462
      const value = +lb.toFixed(decimals)
      return { value, label: value.toLocaleString(undefined, { maximumFractionDigits: decimals }), unit: "lb" }
    }
    const value = +kg.toFixed(decimals)
    return { value, label: value.toLocaleString(undefined, { maximumFractionDigits: decimals }), unit: "kg" }
  }

  return (
    <PreferencesContext.Provider value={{ preferences, setWeightUnit, formatWeight }}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider")
  return ctx
}

