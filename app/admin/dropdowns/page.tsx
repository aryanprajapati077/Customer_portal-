"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Loader2, ListTree, Plus, RefreshCw, Trash2, UserCog } from "lucide-react"

type LsuTeam = {
  id: string
  lsuName: string
  technicianName: string
  active: boolean
}

type OpsManager = {
  id: string
  name: string
  active: boolean
}

export default function AdminDropdownsPage() {
  const [teams, setTeams] = useState<LsuTeam[]>([])
  const [managers, setManagers] = useState<OpsManager[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingManager, setSavingManager] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncingManagers, setSyncingManagers] = useState(false)
  const [error, setError] = useState("")
  const [managerError, setManagerError] = useState("")
  const [lsuName, setLsuName] = useState("")
  const [technicianName, setTechnicianName] = useState("")
  const [active, setActive] = useState(true)
  const [managerName, setManagerName] = useState("")
  const [managerActive, setManagerActive] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [teamsRes, managersRes] = await Promise.all([
        fetch("/api/admin/lsu-teams?all=1"),
        fetch("/api/admin/operations-managers?all=1"),
      ])
      const teamsData = await teamsRes.json()
      const managersData = await managersRes.json()
      if (teamsData.success) setTeams(teamsData.teams || [])
      if (managersData.success) setManagers(managersData.managers || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const syncFromSheets = async () => {
    setSyncing(true)
    setError("")
    try {
      const res = await fetch("/api/admin/lsu-teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "syncFromSheets" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Sync failed")
      if (data.teams) setTeams(data.teams)
      else await load()
      alert(data.message || `Synced ${data.total || 0} LSU teams`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed")
    } finally {
      setSyncing(false)
    }
  }

  const syncManagers = async () => {
    setSyncingManagers(true)
    setManagerError("")
    try {
      const res = await fetch("/api/admin/operations-managers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "syncFromCustomers" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Sync failed")
      if (data.managers) setManagers(data.managers)
      else await load()
      alert(data.message || `Synced ${data.total || 0} managers`)
    } catch (err) {
      setManagerError(err instanceof Error ? err.message : "Sync failed")
    } finally {
      setSyncingManagers(false)
    }
  }

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lsuName.trim() || !technicianName.trim()) return
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/admin/lsu-teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lsuName: lsuName.trim(),
          technicianName: technicianName.trim(),
          active,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to add")
      setLsuName("")
      setTechnicianName("")
      setActive(true)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed")
    } finally {
      setSaving(false)
    }
  }

  const addManager = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!managerName.trim()) return
    setSavingManager(true)
    setManagerError("")
    try {
      const res = await fetch("/api/admin/operations-managers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: managerName.trim(),
          active: managerActive,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to add")
      setManagerName("")
      setManagerActive(true)
      await load()
    } catch (err) {
      setManagerError(err instanceof Error ? err.message : "Failed")
    } finally {
      setSavingManager(false)
    }
  }

  const toggleActive = async (team: LsuTeam) => {
    await fetch("/api/admin/lsu-teams", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: team.id, active: !team.active }),
    })
    await load()
  }

  const toggleManagerActive = async (manager: OpsManager) => {
    await fetch("/api/admin/operations-managers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: manager.id, active: !manager.active }),
    })
    await load()
  }

  const remove = async (team: LsuTeam) => {
    if (!confirm(`Delete LSU “${team.lsuName}”?`)) return
    await fetch(`/api/admin/lsu-teams?id=${encodeURIComponent(team.id)}`, {
      method: "DELETE",
    })
    await load()
  }

  const removeManager = async (manager: OpsManager) => {
    if (!confirm(`Remove operations manager “${manager.name}”?`)) return
    await fetch(`/api/admin/operations-managers?id=${encodeURIComponent(manager.id)}`, {
      method: "DELETE",
    })
    await load()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#DCE8DC] bg-[#E8F5E9] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1B7339]">
          <ListTree className="h-3.5 w-3.5" />
          Dropdowns
        </p>
        <h1 className="admin-page-title">Form dropdowns</h1>
        <p className="mt-1.5 text-[14px] text-[#6B6B6B]">
          Manage LSU / technician pairs and operations managers used on Create Customer.
        </p>
      </div>

      {/* LSU / Technician */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[18px] font-semibold text-[#141414]">LSU teams</h2>
            <p className="mt-1 text-[13px] text-[#6B6B6B]">
              Choosing an LSU on Create Customer fills the technician automatically.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="rounded-full border-[#DCE8DC] text-[#1B7339] hover:bg-[#E8F5E9]"
            onClick={syncFromSheets}
            disabled={syncing}
          >
            {syncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sync from Client Master
          </Button>
        </div>

        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <h3 className="mb-4 text-[16px] font-semibold text-[#141414]">Add LSU pair</h3>
          <form onSubmit={add} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="lsu-name">LSU Name *</Label>
                <Input
                  id="lsu-name"
                  value={lsuName}
                  onChange={(e) => setLsuName(e.target.value)}
                  placeholder="e.g. Ahmedabad LSU"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tech-name">LSU Technician Name *</Label>
                <Input
                  id="tech-name"
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  placeholder="e.g. Ravi Patel"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[#E2EBE4] bg-[#F7FBF7] px-3 py-2.5">
              <div>
                <p className="text-[13px] font-medium text-[#141414]">Active</p>
                <p className="text-[11px] text-[#6B6B6B]">Show this pair in the Create Customer form</p>
              </div>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={saving || !lsuName.trim() || !technicianName.trim()}
              className="rounded-full bg-[#1B7339] hover:bg-[#145a2c]"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Add to list
            </Button>
          </form>
        </div>

        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-[16px] font-semibold text-[#141414]">LSU list</h3>
            <Badge variant="outline" className="border-[#DCE8DC] text-[#1B7339]">
              {teams.length} entr{teams.length === 1 ? "y" : "ies"}
            </Badge>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#1B7339]" />
            </div>
          ) : teams.length === 0 ? (
            <p className="text-sm text-[#6B6B6B]">No LSU teams yet. Sync or add a pair above.</p>
          ) : (
            <ul className="divide-y divide-[#EAEAEA] rounded-xl border border-[#EAEAEA]">
              {teams.map((team) => (
                <li
                  key={team.id}
                  className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-[#141414]">{team.lsuName}</p>
                    <p className="mt-0.5 truncate text-[13px] text-[#6B6B6B]">
                      Technician:{" "}
                      <span className="font-medium text-[#141414]">{team.technicianName}</span>
                    </p>
                    <Badge
                      variant="outline"
                      className={
                        team.active
                          ? "mt-2 border-[#C8E6D4] bg-[#E8F5E9] text-[#1B7339]"
                          : "mt-2 border-[#E5E5E5] bg-[#F5F5F5] text-[#8A8A8A]"
                      }
                    >
                      {team.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-[#6B6B6B]">
                        {team.active ? "Active" : "Inactive"}
                      </span>
                      <Switch checked={team.active} onCheckedChange={() => toggleActive(team)} />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full border-[#F0D0D0] text-[#C62828] hover:bg-[#FFF5F5]"
                      onClick={() => remove(team)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Operations Managers */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-[18px] font-semibold text-[#141414]">
              <UserCog className="h-5 w-5 text-[#1B7339]" />
              Operations managers
            </h2>
            <p className="mt-1 text-[13px] text-[#6B6B6B]">
              Active managers appear in the Operations Incharge dropdown on Create Customer. Toggle
              inactive or remove to hide them.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="rounded-full border-[#DCE8DC] text-[#1B7339] hover:bg-[#E8F5E9]"
            onClick={syncManagers}
            disabled={syncingManagers}
          >
            {syncingManagers ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sync from customers
          </Button>
        </div>

        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <h3 className="mb-4 text-[16px] font-semibold text-[#141414]">Add operations manager</h3>
          <form onSubmit={addManager} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ops-name">Manager name *</Label>
              <Input
                id="ops-name"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                placeholder="e.g. Yash"
                required
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[#E2EBE4] bg-[#F7FBF7] px-3 py-2.5">
              <div>
                <p className="text-[13px] font-medium text-[#141414]">Active</p>
                <p className="text-[11px] text-[#6B6B6B]">Show in Create Customer dropdown</p>
              </div>
              <Switch checked={managerActive} onCheckedChange={setManagerActive} />
            </div>

            {managerError && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {managerError}
              </p>
            )}

            <Button
              type="submit"
              disabled={savingManager || !managerName.trim()}
              className="rounded-full bg-[#1B7339] hover:bg-[#145a2c]"
            >
              {savingManager ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Add manager
            </Button>
          </form>
        </div>

        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-[16px] font-semibold text-[#141414]">Managers list</h3>
            <Badge variant="outline" className="border-[#DCE8DC] text-[#1B7339]">
              {managers.length} entr{managers.length === 1 ? "y" : "ies"}
            </Badge>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#1B7339]" />
            </div>
          ) : managers.length === 0 ? (
            <p className="text-sm text-[#6B6B6B]">
              No managers yet. Sync from customers or add a name above.
            </p>
          ) : (
            <ul className="divide-y divide-[#EAEAEA] rounded-xl border border-[#EAEAEA]">
              {managers.map((manager) => (
                <li
                  key={manager.id}
                  className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-[#141414]">{manager.name}</p>
                    <Badge
                      variant="outline"
                      className={
                        manager.active
                          ? "mt-2 border-[#C8E6D4] bg-[#E8F5E9] text-[#1B7339]"
                          : "mt-2 border-[#E5E5E5] bg-[#F5F5F5] text-[#8A8A8A]"
                      }
                    >
                      {manager.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-[#6B6B6B]">
                        {manager.active ? "Active" : "Inactive"}
                      </span>
                      <Switch
                        checked={manager.active}
                        onCheckedChange={() => toggleManagerActive(manager)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full border-[#F0D0D0] text-[#C62828] hover:bg-[#FFF5F5]"
                      onClick={() => removeManager(manager)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
