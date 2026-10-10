"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, Loader2, Search, ShieldCheck } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/admin-list-card"

type Row = {
  id: string
  customerId: string
  companyName: string
  lsuName?: string | null
  lsuTechnicianName?: string | null
  operationsIncharge?: string | null
  date: string
  weight: number
  location?: string | null
  status: string
  verificationStatus?: string | null
  verifiedBy?: string | null
  verifiedAt?: string | null
}

function monthOptions(count = 18) {
  const opts: { value: string; label: string }[] = []
  const now = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    opts.push({ value, label: d.toLocaleDateString("en-IN", { month: "long", year: "numeric" }) })
  }
  return opts
}

function formatWhen(raw?: string | null) {
  if (!raw) return "—"
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function ReverifyCollectionsPage() {
  const months = useMemo(() => monthOptions(), [])
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [verification, setVerification] = useState<"pending" | "verified" | "all">("pending")
  const [month, setMonth] = useState("all")
  const [lsu, setLsu] = useState("all")
  const [manager, setManager] = useState("all")
  const [q, setQ] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [lsuOptions, setLsuOptions] = useState<string[]>([])
  const [managerOptions, setManagerOptions] = useState<string[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      params.set("verification", verification)
      params.set("month", month)
      params.set("lsu", lsu)
      params.set("manager", manager)
      if (q.trim()) params.set("q", q.trim())
      params.set("take", "1000")
      const res = await fetch(`/api/admin/reverify-collections?${params}`)
      const data = await res.json()
      if (!data?.success) throw new Error(data?.error || "Could not load collections")
      setRows(data.collections || [])
      setSelected([])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load collections")
    } finally {
      setLoading(false)
    }
  }, [verification, month, lsu, manager, q])

  useEffect(() => {
    const t = setTimeout(load, q ? 250 : 0)
    return () => clearTimeout(t)
  }, [load, q])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [teamsRes, managersRes] = await Promise.all([
          fetch("/api/admin/lsu-teams"),
          fetch("/api/admin/operations-managers"),
        ])
        const teamsData = await teamsRes.json()
        const managersData = await managersRes.json()
        if (cancelled) return
        setLsuOptions(
          (teamsData.teams || [])
            .map((t: { lsuName?: string }) => t.lsuName || "")
            .filter(Boolean),
        )
        setManagerOptions(
          (managersData.managers || [])
            .map((m: { name?: string }) => m.name || "")
            .filter(Boolean),
        )
      } catch {
        // filters still work with All
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const pendingIds = rows.filter((r) => r.verificationStatus !== "verified").map((r) => r.id)

  const verify = async (ids: string[]) => {
    if (!ids.length) return
    setVerifying(ids.length === 1 ? ids[0] : "bulk")
    setError("")
    try {
      const res = await fetch("/api/admin/reverify-collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.error || "Verification failed")
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed")
    } finally {
      setVerifying(null)
    }
  }

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={<ShieldCheck />}
        title="Reverify Collections"
        description="Collections added on the Collections page stay here until an operations manager verifies them. Verified rows become the final collection."
      />

      <div className="grid gap-3 rounded-[14px] border border-[#ebe9e4] bg-white p-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="space-y-1.5">
          <Label className="text-xs text-[#1B7339]">Verification</Label>
          <Select value={verification} onValueChange={(v) => setVerification(v as typeof verification)}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending verification</SelectItem>
              <SelectItem value="verified">Complete verification</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-[#1B7339]">Month</Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All months</SelectItem>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-[#1B7339]">LSU</Label>
          <Select value={lsu} onValueChange={setLsu}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All LSUs</SelectItem>
              {lsuOptions.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-[#1B7339]">Operations manager</Label>
          <Select value={manager} onValueChange={setManager}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All managers</SelectItem>
              {managerOptions.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-[#1B7339]">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8a8a]" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ID, brand, LSU…"
              className="bg-white pl-9"
            />
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="overflow-hidden rounded-[14px] border border-[#ebe9e4] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ebe9e4] px-4 py-3">
          <p className="text-sm text-[#5A5A5A]">
            {loading ? "Loading…" : `${rows.length} collection${rows.length === 1 ? "" : "s"}`}
          </p>
          {verification !== "verified" && pendingIds.length > 0 ? (
            <Button
              size="sm"
              className="rounded-full bg-[#1B7339] hover:bg-[#145a2c]"
              disabled={!selected.length || verifying === "bulk"}
              onClick={() => verify(selected)}
            >
              {verifying === "bulk" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 h-4 w-4" />
              )}
              Verify selected ({selected.length})
            </Button>
          ) : null}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-[13px]">
            <thead className="bg-[#F7FBF7] text-[11px] uppercase tracking-wide text-[#5A6B5E]">
              <tr>
                <th className="px-3 py-2">
                  <input
                    type="checkbox"
                    aria-label="Select pending"
                    checked={pendingIds.length > 0 && selected.length === pendingIds.length}
                    onChange={(e) => setSelected(e.target.checked ? pendingIds : [])}
                    disabled={!pendingIds.length}
                  />
                </th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">LSU</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Weight</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Verified by</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[#6B6B6B]">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[#6B6B6B]">
                    No collections in this filter.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const verified = row.verificationStatus === "verified"
                  return (
                    <tr key={row.id} className="border-t border-[#f0eee9]">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          aria-label={`Select ${row.customerId}`}
                          checked={selected.includes(row.id)}
                          disabled={verified}
                          onChange={() => toggle(row.id)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-[#141414]">{row.companyName}</div>
                        <div className="text-[12px] text-[#6B6B6B]">{row.customerId}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div>{row.lsuName || "—"}</div>
                        <div className="text-[12px] text-[#6B6B6B]">
                          {row.operationsIncharge || "No operations manager"}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {new Date(row.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                        {row.location ? (
                          <div className="text-[12px] text-[#6B6B6B]">{row.location}</div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2">{Number(row.weight).toFixed(2)} kg</td>
                      <td className="px-3 py-2">
                        {verified ? (
                          <Badge className="bg-[#E8F6EC] text-[#1B7339] hover:bg-[#E8F6EC]">
                            Complete verification
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-amber-300 text-amber-800">
                            Pending verification
                          </Badge>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {verified ? (
                          <>
                            <div className="font-medium">{row.verifiedBy || "—"}</div>
                            <div className="text-[12px] text-[#6B6B6B]">{formatWhen(row.verifiedAt)}</div>
                          </>
                        ) : (
                          <span className="text-[#8a8a8a]">Not verified</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {verified ? (
                          <span className="inline-flex items-center gap-1 text-[12px] text-[#1B7339]">
                            <CheckCircle2 className="h-4 w-4" /> Final
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            className="rounded-full bg-[#1B7339] hover:bg-[#145a2c]"
                            disabled={verifying === row.id}
                            onClick={() => verify([row.id])}
                          >
                            {verifying === row.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Verify"
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
