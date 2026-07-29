"use client"

import { Building2, ChevronDown, MapPin } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export type GroupLocationOption = {
  id: string
  companyName: string
  city?: string | null
  state?: string | null
}

type GroupLocationSwitcherProps = {
  locations: GroupLocationOption[]
  selectedLocationId: string | null
  onChange: (locationId: string | null) => void
  className?: string
}

export function GroupLocationSwitcher({
  locations,
  selectedLocationId,
  onChange,
  className,
}: GroupLocationSwitcherProps) {
  if (locations.length === 0) return null

  const selected = locations.find((l) => l.id === selectedLocationId)
  const label = selected
    ? selected.companyName
    : `All locations (${locations.length})`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-9 max-w-[240px] items-center gap-2 rounded-lg border border-[#DCE8DC] bg-[#F7FBF7] px-3 text-[12.5px] font-semibold text-[#1B7339] hover:bg-[#E8F5E9]",
            className,
          )}
        >
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{label}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>View data for</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onChange(null)}
          className={cn(!selectedLocationId && "bg-[#E8F5E9] font-semibold text-[#1B7339]")}
        >
          All locations ({locations.length})
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {locations.map((loc) => (
          <DropdownMenuItem
            key={loc.id}
            onClick={() => onChange(loc.id)}
            className={cn(
              selectedLocationId === loc.id && "bg-[#E8F5E9] font-semibold text-[#1B7339]",
            )}
          >
            <Building2 className="mr-2 h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{loc.companyName}</span>
            {(loc.city || loc.state) && (
              <span className="ml-1 truncate text-[11px] text-muted-foreground">
                · {[loc.city, loc.state].filter(Boolean).join(", ")}
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
