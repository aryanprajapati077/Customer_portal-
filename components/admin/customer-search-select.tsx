"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"

export type CustomerSearchOption = {
  id: string
  companyName: string
}

type Props = {
  customers: CustomerSearchOption[]
  value: string
  onChange: (customerId: string) => void
  placeholder?: string
  className?: string
  /** When set, shows an "All customers" option with this value (e.g. "__all__") */
  allValue?: string
  allLabel?: string
}

export function CustomerSearchSelect({
  customers,
  value,
  onChange,
  placeholder = "Search customer by name or ID…",
  className,
  allValue,
  allLabel = "All customers",
}: Props) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = customers.find((c) => c.id === value)
  const isAll = Boolean(allValue && value === allValue)

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return customers.slice(0, 80)
    return customers
      .filter(
        (c) =>
          c.id.toLowerCase().includes(s) ||
          c.companyName.toLowerCase().includes(s),
      )
      .slice(0, 80)
  }, [customers, q])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0)
    } else {
      setQ("")
    }
  }, [open])

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-[#D5E5D9] bg-white px-3 text-left text-[13px] shadow-sm transition hover:border-[#1B7339]/40 focus:outline-none focus:ring-2 focus:ring-[#1B7339]/20"
      >
        <span className={cn("truncate", !selected && !isAll && "text-[#8A8A8A]")}>
          {isAll
            ? allLabel
            : selected
              ? `${selected.companyName} (${selected.id})`
              : "Select customer"}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-[#8A8A8A]" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-[#D5E5D9] bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-[#E8EFEA] px-3 py-2">
            <Search className="h-4 w-4 text-[#8A8A8A]" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={placeholder}
              className="h-8 w-full bg-transparent text-[13px] outline-none placeholder:text-[#A0A0A0]"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {allValue && !q.trim() ? (
              <button
                type="button"
                onClick={() => {
                  onChange(allValue)
                  setOpen(false)
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-[#F3F9F4]",
                  isAll && "bg-[#E8F5E9]",
                )}
              >
                <Check className={cn("h-3.5 w-3.5 shrink-0 text-[#1B7339]", isAll ? "opacity-100" : "opacity-0")} />
                <span className="font-medium text-[#141414]">{allLabel}</span>
              </button>
            ) : null}
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-[12px] text-[#8A8A8A]">No customers found</p>
            ) : (
              filtered.map((c) => {
                const active = c.id === value
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onChange(c.id)
                      setOpen(false)
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-[#F3F9F4]",
                      active && "bg-[#E8F5E9]",
                    )}
                  >
                    <Check
                      className={cn("h-3.5 w-3.5 shrink-0 text-[#1B7339]", active ? "opacity-100" : "opacity-0")}
                    />
                    <span className="min-w-0 flex-1 truncate">
                      <span className="font-medium text-[#141414]">{c.companyName}</span>
                      <span className="ml-1.5 text-[#7A7A7A]">({c.id})</span>
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
