"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Save, Sparkles } from "lucide-react"

type GlobalImpact = {
  wasteCollected: number
  productsCreated: number
  treesEquivalent: number
  co2Prevented: number
  updatedAt?: string
}

export default function AdminHomepagePage() {
  const [impact, setImpact] = useState<GlobalImpact | null>(null)
  const [draft, setDraft] = useState<GlobalImpact>({
    wasteCollected: 0,
    productsCreated: 0,
    treesEquivalent: 0,
    co2Prevented: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setIsLoading(true)
      try {
        const res = await fetch("/api/admin/global-impact")
        const data = await res.json()
        if (cancelled) return
        if (data?.success && data.impact) {
          setImpact(data.impact)
          setDraft({
            wasteCollected: Number(data.impact.wasteCollected) || 0,
            productsCreated: Number(data.impact.productsCreated) || 0,
            treesEquivalent: Number(data.impact.treesEquivalent) || 0,
            co2Prevented: Number(data.impact.co2Prevented) || 0,
          })
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const save = async () => {
    setIsSaving(true)
    setStatus(null)
    try {
      const res = await fetch("/api/admin/global-impact", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      })
      const data = await res.json()
      if (!data?.success) {
        setStatus(data?.error || "Save failed")
        return
      }
      setImpact(data.impact)
      setStatus("Saved")
    } catch {
      setStatus("Network error")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Homepage</h1>
          <p className="text-sm text-muted-foreground">Manage website-wide impact metrics and content blocks</p>
        </div>
      </div>

      <Card className="glass border-border/50 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-primary/5 via-secondary/3 to-transparent" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Global Impact Metrics
          </CardTitle>
          <CardDescription>These numbers power the homepage “Impact” section.</CardDescription>
        </CardHeader>
        <CardContent className="relative">
          {isLoading ? (
            <div className="py-10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Waste Collected</label>
                <Input
                  value={draft.wasteCollected}
                  onChange={(e) => setDraft((d) => ({ ...d, wasteCollected: Number(e.target.value) }))}
                  inputMode="decimal"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Products Created</label>
                <Input
                  value={draft.productsCreated}
                  onChange={(e) => setDraft((d) => ({ ...d, productsCreated: Number(e.target.value) }))}
                  inputMode="decimal"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Microplastic in tons</label>
                <Input
                  value={draft.treesEquivalent}
                  onChange={(e) => setDraft((d) => ({ ...d, treesEquivalent: Number(e.target.value) }))}
                  inputMode="decimal"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Water Resources Protected in Litres</label>
                <Input
                  value={draft.co2Prevented}
                  onChange={(e) => setDraft((d) => ({ ...d, co2Prevented: Number(e.target.value) }))}
                  inputMode="decimal"
                />
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <Button onClick={save} disabled={isSaving || isLoading}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save
            </Button>
            {status && <span className="text-sm text-muted-foreground">{status}</span>}
            {impact?.updatedAt && (
              <span className="ml-auto text-xs text-muted-foreground">Last updated: {new Date(impact.updatedAt).toLocaleString()}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

