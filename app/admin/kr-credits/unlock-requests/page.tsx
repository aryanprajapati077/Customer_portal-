"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AdminPageHeader } from "@/components/admin/admin-list-card"
import { LifeBuoy, Loader2, LockOpen, RefreshCw } from "lucide-react"

type UnlockRequest = {
  id: string
  customerId: string | null
  name: string
  email: string
  subject: string
  message: string
  status: string
  createdAt: string
  companyName: string
  kraftrebornCredits: number | null
  krCreditsLocked: boolean | null
}

export default function KrUnlockRequestsPage() {
  const [rows, setRows] = useState<UnlockRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("open")
  const [actingId, setActingId] = useState<string | null>(null)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/admin/kr-unlock-requests?status=${encodeURIComponent(status)}`)
      const data = await res.json()
      if (!data?.success) throw new Error(data?.error || "Could not load requests")
      setRows(data.requests || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load requests")
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    void load()
  }, [load])

  const unlock = async (row: UnlockRequest) => {
    if (!row.customerId) return
    setActingId(row.id)
    try {
      const res = await fetch("/api/admin/kr-unlock-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: row.customerId, ticketId: row.id, unlock: true }),
      })
      const data = await res.json()
      if (!data?.success) throw new Error(data?.error || "Unlock failed")
      await load()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unlock failed")
    } finally {
      setActingId(null)
    }
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={<LifeBuoy />}
        title="KR Support"
        description="Unlock requests from customers who say service payment is done. Unlocking restores shop redemption."
      />

      <div className="flex flex-wrap items-center gap-2">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px] bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
        <Link
          href="/admin/kr-credits"
          className="ml-auto text-[13px] font-semibold text-[#1B7339] hover:underline"
        >
          ← Back to KR Credits
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="overflow-hidden rounded-[14px] border border-[#ebe9e4] bg-white">
        <div className="border-b border-[#ebe9e4] px-4 py-3 text-sm text-[#5A5A5A]">
          {loading ? "Loading…" : `${rows.length} request${rows.length === 1 ? "" : "s"}`}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-[13px]">
            <thead className="bg-[#F7FBF7] text-[11px] uppercase tracking-wide text-[#5A6B5E]">
              <tr>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Message</th>
                <th className="px-3 py-2">Balance</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Requested</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[#6B6B6B]">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[#6B6B6B]">
                    No unlock requests in this filter.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-t border-[#f0eee9] align-top">
                    <td className="px-3 py-3">
                      <div className="font-medium text-[#141414]">{row.companyName}</div>
                      <div className="text-[12px] text-[#6B6B6B]">{row.customerId || "—"}</div>
                      <div className="text-[12px] text-[#6B6B6B]">{row.email}</div>
                    </td>
                    <td className="max-w-[320px] px-3 py-3">
                      <div className="font-medium">{row.subject}</div>
                      <p className="mt-1 whitespace-pre-wrap text-[12px] text-[#6B6B6B]">{row.message}</p>
                    </td>
                    <td className="px-3 py-3">
                      {row.kraftrebornCredits == null
                        ? "—"
                        : `₹${Math.floor(Number(row.kraftrebornCredits) || 0)}`}
                      <div className="mt-1">
                        {row.krCreditsLocked ? (
                          <Badge className="bg-[#FFF4E5] text-[#C2410C] hover:bg-[#FFF4E5]">Locked</Badge>
                        ) : row.krCreditsLocked === false ? (
                          <Badge className="bg-[#E8F6EC] text-[#1B7339] hover:bg-[#E8F6EC]">Unlocked</Badge>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-3 capitalize">{row.status.replace("_", " ")}</td>
                    <td className="px-3 py-3 text-[12px] text-[#6B6B6B]">
                      {new Date(row.createdAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {row.customerId && row.krCreditsLocked !== false && row.status !== "resolved" ? (
                        <Button
                          size="sm"
                          className="rounded-full bg-[#1B7339] hover:bg-[#145a2c]"
                          disabled={actingId === row.id}
                          onClick={() => void unlock(row)}
                        >
                          {actingId === row.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <LockOpen className="mr-1 h-3.5 w-3.5" />
                              Unlock
                            </>
                          )}
                        </Button>
                      ) : (
                        <span className="text-[12px] text-[#1B7339]">Done</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
