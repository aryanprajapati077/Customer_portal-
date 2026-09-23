"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useAuth } from "@/lib/auth-context"

const POLL_MS = 10_000

/**
 * Always prefer the live server KR balance over cached localStorage.
 * Polls every 10s and on focus so admin credit updates appear without re-login.
 */
export function useLiveKrCredits(locationId?: string | null) {
  const { customer, syncCustomer } = useAuth()
  const customerRef = useRef(customer)
  const syncRef = useRef(syncCustomer)
  customerRef.current = customer
  syncRef.current = syncCustomer

  const [credits, setCredits] = useState<number | null>(
    customer?.kraftrebornCredits != null ? Number(customer.kraftrebornCredits) : null,
  )
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const current = customerRef.current
    if (!current?.id) return
    try {
      const qs = locationId ? `?locationId=${encodeURIComponent(locationId)}` : ""
      const res = await fetch(`/api/customer/credits${qs}`, {
        credentials: "include",
        cache: "no-store",
      })
      if (res.status === 401) return
      const data = await res.json()
      if (!data?.success) return
      const next = Math.max(0, Math.floor(Number(data.kraftrebornCredits) || 0))
      setCredits(next)
      if (Number(current.kraftrebornCredits) !== next) {
        syncRef.current({ ...current, kraftrebornCredits: next })
      }
    } catch {
      /* ignore transient network errors */
    } finally {
      setLoading(false)
    }
  }, [locationId])

  useEffect(() => {
    if (!customer?.id) {
      setCredits(null)
      setLoading(false)
      return
    }
    void refresh()
    const onFocus = () => void refresh()
    const onVis = () => {
      if (document.visibilityState === "visible") void refresh()
    }
    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onVis)
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh()
    }, POLL_MS)
    return () => {
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onVis)
      window.clearInterval(interval)
    }
  }, [customer?.id, refresh])

  // Mirror auth updates (e.g. from global poll) into local state.
  useEffect(() => {
    if (customer?.kraftrebornCredits == null) return
    setCredits(Math.max(0, Math.floor(Number(customer.kraftrebornCredits) || 0)))
  }, [customer?.kraftrebornCredits])

  return {
    credits: credits ?? Math.max(0, Math.floor(Number(customer?.kraftrebornCredits) || 0)),
    loading,
    refresh,
  }
}
