"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

/** Sends portal presence heartbeats + page views while user is on /dashboard. */
export function PortalPresenceTracker() {
  const pathname = usePathname()
  const lastPath = useRef<string>("")

  useEffect(() => {
    if (!pathname?.startsWith("/dashboard")) return

    const send = (recordView: boolean) => {
      fetch("/api/customer/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: pathname, recordView }),
        keepalive: true,
      }).catch(() => {})
    }

    const isNewPage = lastPath.current !== pathname
    lastPath.current = pathname
    send(isNewPage)

    const interval = window.setInterval(() => send(false), 60_000)

    const onVisible = () => {
      if (document.visibilityState === "visible") send(false)
    }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [pathname])

  return null
}
