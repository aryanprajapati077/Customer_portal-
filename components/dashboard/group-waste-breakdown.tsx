"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Package, Loader2 } from "lucide-react"
import { usePreferences } from "@/lib/preferences-context"

type ClientWaste = {
  id: string
  companyName: string
  totalWasteCollected: number
  isGroup: boolean
}

interface GroupWasteBreakdownProps {
  groupCustomerId: string
}

export function GroupWasteBreakdown({ groupCustomerId }: GroupWasteBreakdownProps) {
  const { preferences } = usePreferences()
  const [clients, setClients] = useState<ClientWaste[]>([])
  const [totalWaste, setTotalWaste] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/customer/group-waste-summary?customerId=${groupCustomerId}`)
        const data = await res.json()
        if (cancelled) return
        if (data?.success) {
          setClients(data.clients || [])
          setTotalWaste(data.totalWaste || 0)
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [groupCustomerId])

  const toDisplay = (kg: number) =>
    preferences.weightUnit === "lb" ? (kg * 2.20462).toFixed(1) : kg.toFixed(1)
  const unit = preferences.weightUnit === "lb" ? "lb" : "kg"

  if (loading) {
    return (
      <Card className="glass border-border/50">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (clients.length === 0) return null

  return (
    <Card className="glass border-border/50 overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          Waste by Client
        </CardTitle>
        <CardDescription>
          Total waste collected across all companies in your group
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            <span className="font-medium">Group Total</span>
          </div>
          <span className="text-xl font-bold text-foreground">
            {toDisplay(totalWaste)} {unit}
          </span>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">By company</p>
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {clients.map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium truncate">{client.companyName}</span>
                </div>
                <span className="text-sm font-semibold text-foreground shrink-0 ml-2">
                  {toDisplay(client.totalWasteCollected)} {unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
