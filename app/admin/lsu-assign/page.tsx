"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, MapPinned, Save } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/admin-list-card"

type Team = { id: string; lsuName: string; technicianName: string }
type Manager = { id: string; name: string }
type Assignment = { lsuName: string; operationsManagerId: string; operationsManagerName: string }

const NONE = "__none__"

export default function LsuAssignPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [managers, setManagers] = useState<Manager[]>([])
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/lsu-assignments")
      const data = await res.json()
      if (!data?.success) throw new Error(data?.error || "Could not load assignments")
      const nextTeams = (data.teams || []) as Team[]
      const nextAssignments = (data.assignments || []) as Assignment[]
      const map: Record<string, string> = {}
      for (const team of nextTeams) map[team.lsuName] = NONE
      for (const row of nextAssignments) {
        if (row.lsuName) map[row.lsuName] = row.operationsManagerId || NONE
      }
      setTeams(nextTeams)
      setManagers((data.managers || []) as Manager[])
      setDraft(map)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load assignments")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const save = async () => {
    setSaving(true)
    setError("")
    setMessage("")
    try {
      const res = await fetch("/api/admin/lsu-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignments: teams.map((team) => ({
            lsuName: team.lsuName,
            operationsManagerId: draft[team.lsuName] === NONE ? "" : draft[team.lsuName] || "",
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.error || "Could not save")
      setMessage("LSU assignments saved. Customers on those LSUs now use the selected operations manager.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={<MapPinned />}
        title="LSU Assign"
        description="Assign each LSU to an operations manager. Saving updates the operations manager on customers that use that LSU."
      />

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}
      {message ? (
        <div className="rounded-xl border border-[#C8E6C9] bg-[#F4FBF5] px-3 py-2 text-sm text-[#1B7339]">
          {message}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[14px] border border-[#ebe9e4] bg-white">
        <div className="flex items-center justify-between border-b border-[#ebe9e4] px-4 py-3">
          <p className="text-sm text-[#5A5A5A]">{loading ? "Loading…" : `${teams.length} LSU teams`}</p>
          <Button
            className="rounded-full bg-[#1B7339] hover:bg-[#145a2c]"
            disabled={loading || saving || teams.length === 0}
            onClick={save}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save assignments
          </Button>
        </div>
        {loading ? (
          <div className="px-4 py-10 text-center text-[#6B6B6B]">
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
          </div>
        ) : teams.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-[#6B6B6B]">
            No active LSU teams. Add them under Dropdowns first.
          </p>
        ) : (
          <div className="divide-y divide-[#f0eee9]">
            {teams.map((team) => (
              <div
                key={team.id}
                className="grid items-center gap-3 px-4 py-3 md:grid-cols-[1.2fr_1.4fr]"
              >
                <div>
                  <p className="text-sm font-medium text-[#141414]">{team.lsuName}</p>
                  <p className="text-[12px] text-[#6B6B6B]">Technician: {team.technicianName || "—"}</p>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-[11px] uppercase tracking-wide text-[#6B6B6B]">
                    Operations manager
                  </Label>
                  <Select
                    value={draft[team.lsuName] || NONE}
                    onValueChange={(v) => setDraft((prev) => ({ ...prev, [team.lsuName]: v }))}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Unassigned</SelectItem>
                      {managers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
