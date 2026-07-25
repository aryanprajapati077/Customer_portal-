"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

/** Public support still available via contact; logged-in users go to portal Support. */
export default function SupportRedirectPage() {
  const { customer, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (customer) router.replace("/dashboard/support")
    else router.replace("/login?next=/dashboard/support")
  }, [customer, isLoading, router])

  return null
}
