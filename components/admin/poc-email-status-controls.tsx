"use client"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { POC_STATUS_OPTIONS, type PocStatus } from "@/lib/poc-config"

export function PocEmailStatusControls({
  emailEnabled,
  status,
  onEmailEnabledChange,
  onStatusChange,
  compact,
}: {
  emailEnabled: boolean
  status: PocStatus
  onEmailEnabledChange: (value: boolean) => void
  onStatusChange: (value: PocStatus) => void
  compact?: boolean
}) {
  return (
    <div
      className={
        compact
          ? "flex flex-wrap items-center gap-4 rounded-lg border border-[#E8E8E8] bg-[#FAFAFA] px-3 py-2"
          : "flex flex-wrap items-center gap-4 rounded-lg border border-[#E8E8E8] bg-[#FAFAFA] px-3 py-2.5 sm:col-span-2"
      }
    >
      <div className="flex items-center gap-2">
        <Switch
          checked={emailEnabled}
          onCheckedChange={onEmailEnabledChange}
          className="data-[state=checked]:bg-[#1B7339]"
        />
        <Label className="text-[11px] font-medium text-[#141414]">Send emails</Label>
      </div>
      <div className="flex items-center gap-2">
        <Label className="text-[11px] text-[#6B6B6B]">Status</Label>
        <Select value={status} onValueChange={(v) => onStatusChange(v as PocStatus)}>
          <SelectTrigger className="h-8 w-[120px] rounded-md border-[#D8D8D8] bg-white text-[12px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {POC_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
