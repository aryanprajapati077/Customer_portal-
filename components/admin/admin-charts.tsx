"use client"

import { useMemo, useState } from "react"
import { Loader2 } from "lucide-react"

function shortDate(isoDate: string) {
  const d = new Date(`${isoDate}T12:00:00`)
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

type DailyLogin = { date: string; count: number; uniqueCustomers: number }

export function LoginTrendChart({
  days,
  loading,
}: {
  days: DailyLogin[]
  loading?: boolean
}) {
  const [hover, setHover] = useState<number | null>(null)

  const max = useMemo(
    () => Math.max(1, ...days.map((d) => Math.max(d.count, d.uniqueCustomers))),
    [days],
  )

  const gridTicks = useMemo(() => {
    const step = max <= 5 ? 1 : max <= 20 ? 5 : Math.ceil(max / 4)
    const ticks: number[] = []
    for (let v = 0; v <= max; v += step) ticks.push(v)
    if (ticks[ticks.length - 1] !== max) ticks.push(max)
    return ticks.reverse()
  }, [max])

  if (loading) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#1b7339]" />
      </div>
    )
  }

  if (!days.length) {
    return (
      <p className="py-12 text-center text-sm text-[#6b6b6b]">
        No login data yet — appears after clients sign in to the portal.
      </p>
    )
  }

  const active = hover != null ? days[hover] : null

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium text-[#6b6b6b]">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#1b7339]" />
            Total logins
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#9fd4ad]" />
            Unique clients
          </span>
        </div>
        {active ? (
          <p className="rounded-full border border-[#dce8dc] bg-[#f3faf4] px-3 py-1 text-[11px] font-semibold text-[#1b7339]">
            {shortDate(active.date)} · {active.count} logins · {active.uniqueCustomers} unique
          </p>
        ) : (
          <p className="text-[11px] text-[#8a8a8a]">Hover a day for details</p>
        )}
      </div>

      <div className="relative h-[196px] rounded-xl border border-[#ebe9e4] bg-[#fafaf8] px-3 pb-2 pt-3">
        <div className="pointer-events-none absolute inset-x-3 top-3 bottom-8 flex flex-col justify-between">
          {gridTicks.map((tick) => (
            <div key={tick} className="flex items-center gap-2">
              <span className="w-6 shrink-0 text-right text-[9px] font-medium text-[#aaa]">{tick}</span>
              <div className="h-px flex-1 bg-[#ebe9e4]" />
            </div>
          ))}
        </div>

        <div className="absolute inset-x-3 bottom-2 top-8 flex items-end gap-1 pl-8">
          {days.map((d, i) => {
            const loginPct = d.count <= 0 ? 0 : Math.max(6, Math.round((d.count / max) * 100))
            const uniquePct =
              d.uniqueCustomers <= 0 ? 0 : Math.max(6, Math.round((d.uniqueCustomers / max) * 100))
            const isActive = hover === i

            return (
              <button
                key={d.date}
                type="button"
                className="group flex min-w-0 flex-1 flex-col items-center justify-end focus:outline-none"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                aria-label={`${shortDate(d.date)}: ${d.count} logins, ${d.uniqueCustomers} unique clients`}
              >
                <div className="flex h-[132px] w-full items-end justify-center gap-0.5">
                  <div
                    className={`w-[42%] rounded-t-md transition-all ${
                      isActive ? "bg-[#1b7339] shadow-sm" : "bg-[#1b7339]/85 group-hover:bg-[#1b7339]"
                    }`}
                    style={{ height: `${loginPct}%` }}
                  />
                  <div
                    className={`w-[42%] rounded-t-md transition-all ${
                      isActive ? "bg-[#7bc48e]" : "bg-[#9fd4ad] group-hover:bg-[#7bc48e]"
                    }`}
                    style={{ height: `${uniquePct}%` }}
                  />
                </div>
                <span
                  className={`mt-1 truncate text-[9px] ${
                    isActive ? "font-semibold text-[#1b7339]" : "text-[#8a8a8a]"
                  }`}
                >
                  {shortDate(d.date)}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

type EmailStatusSummary = {
  total: number
  sent: number
  opened: number
  pending: number
  queued: number
  failed: number
  not_eligible: number
}

const EMAIL_STATUS_SEGMENTS: {
  key: keyof Pick<
    EmailStatusSummary,
    "opened" | "sent" | "pending" | "queued" | "failed" | "not_eligible"
  >
  label: string
  color: string
}[] = [
  { key: "opened", label: "Opened", color: "#2563eb" },
  { key: "sent", label: "Received", color: "#1b7339" },
  { key: "pending", label: "Pending", color: "#d97706" },
  { key: "queued", label: "Queued", color: "#0ea5e9" },
  { key: "failed", label: "Failed", color: "#dc2626" },
  { key: "not_eligible", label: "Not eligible", color: "#a3a3a3" },
]

export function EmailStatusStackChart({ summary }: { summary: EmailStatusSummary }) {
  const total = Math.max(1, summary.total)

  return (
    <div className="space-y-3 rounded-xl border border-[#ebe9e4] bg-[#fafaf8] p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] font-semibold text-[#141414]">Delivery breakdown</p>
        <p className="text-[11px] text-[#6b6b6b]">{summary.total} active clients</p>
      </div>

      <div className="flex h-3 overflow-hidden rounded-full bg-white ring-1 ring-[#ebe9e4]">
        {EMAIL_STATUS_SEGMENTS.map((seg) => {
          const count = summary[seg.key]
          if (count <= 0) return null
          const pct = (count / total) * 100
          return (
            <div
              key={seg.key}
              className="h-full transition-[width] duration-300"
              style={{ width: `${pct}%`, backgroundColor: seg.color }}
              title={`${seg.label}: ${count}`}
            />
          )
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {EMAIL_STATUS_SEGMENTS.map((seg) => {
          const count = summary[seg.key]
          const pct = Math.round((count / total) * 100)
          return (
            <div key={seg.key} className="flex items-center gap-2 text-[11px]">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: seg.color }} />
              <span className="font-medium text-[#141414]">{seg.label}</span>
              <span className="text-[#6b6b6b]">
                {count} ({pct}%)
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
