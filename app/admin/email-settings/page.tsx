"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Loader2, Mail, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

type ToggleRow = {
  id: string
  name: string
  description: string
  enabled: boolean
}

export default function AdminEmailSettingsPage() {
  const [rows, setRows] = useState<ToggleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/email-settings", { credentials: "include" })
      const data = await res.json()
      if (data?.success) setRows(data.toggles || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const toggle = async (id: string, enabled: boolean) => {
    setBusyId(id)
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, enabled } : r)))
    try {
      const res = await fetch("/api/admin/email-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, enabled }),
      })
      const data = await res.json()
      if (data?.success) setRows(data.toggles || [])
      else await load()
    } finally {
      setBusyId(null)
    }
  }

  const enabledCount = rows.filter((r) => r.enabled).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#DCE8DC] bg-[#E8F5E9] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1B7339]">
            <Mail className="h-3.5 w-3.5" />
            Email controls
          </p>
          <h1 className="admin-page-title">Email On / Off</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Turn automated emails on or off — e.g. pause collection emails during holidays.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} className="rounded-full">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card className="border-[#E5E5E5] bg-white">
        <CardHeader>
          <CardTitle className="text-base">Automated emails</CardTitle>
          <CardDescription>
            {enabledCount} of {rows.length} email types currently enabled
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#1B7339]" />
            </div>
          ) : (
            <div className="divide-y divide-[#EEE] rounded-xl border border-[#EAEAEA]">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{row.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{row.description}</p>
                    <p className="mt-1 font-mono text-[10px] text-[#8A8A8A]">{row.id}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-semibold ${row.enabled ? "text-[#1B7339]" : "text-[#8A8A8A]"}`}
                    >
                      {row.enabled ? "ON" : "OFF"}
                    </span>
                    <Switch
                      checked={row.enabled}
                      disabled={busyId === row.id}
                      onCheckedChange={(checked) => void toggle(row.id, checked)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
