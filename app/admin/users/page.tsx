"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, UserPlus, Shield } from "lucide-react"
import { ADMIN_PERMISSIONS, ALL_PERMISSION_KEYS, type AdminPermissionKey } from "@/lib/admin-permissions"

type AdminUser = {
  id: string
  email: string
  name: string
  role: string
  active: boolean
  totpEnabled: boolean
  lastLoginAt: string | null
  createdAt: string
  permissions?: AdminPermissionKey[]
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("admin")
  const [permissions, setPermissions] = useState<AdminPermissionKey[]>([...ALL_PERMISSION_KEYS])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPerms, setEditPerms] = useState<AdminPermissionKey[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/users")
      const data = await res.json()
      if (data.users) setUsers(data.users)
      else if (data.error) setError(data.error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const togglePerm = (key: AdminPermissionKey, list: AdminPermissionKey[], setList: (v: AdminPermissionKey[]) => void) => {
    setList(list.includes(key) ? list.filter((k) => k !== key) : [...list, key])
  }

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          permissions: role === "super_admin" ? ALL_PERMISSION_KEYS : permissions,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed")
      setName("")
      setEmail("")
      setPassword("")
      setRole("admin")
      setPermissions([...ALL_PERMISSION_KEYS])
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed")
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (user: AdminUser) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, active: !user.active }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || "Update failed")
      return
    }
    load()
  }

  const savePermissions = async (userId: string) => {
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, permissions: editPerms }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed")
      setEditingId(null)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#DCE8DC] bg-[#E8F5E9] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1B7339]">
          <Shield className="h-3.5 w-3.5" />
          Super Admin
        </p>
        <h1 className="admin-page-title">Admin Users</h1>
        <p className="mt-1.5 text-[14px] text-[#6B6B6B]">
          Create admins with page-level permissions — they only see granted tabs.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="border-[#E5E5E5] bg-white lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="h-5 w-5 text-[#1B7339]" />
              Add admin user
            </CardTitle>
            <CardDescription>
              New admins sign in with email + password, then set up authenticator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-name">Full name</Label>
                <Input id="new-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-email">Email</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Temporary password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin (permission-based)</SelectItem>
                    <SelectItem value="super_admin">Super Admin (full access)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {role === "admin" && (
                <div className="space-y-2 rounded-xl border border-[#E2EBE4] bg-[#F7FBF7] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-[12px] font-semibold text-[#1B7339]">Page permissions</Label>
                    <button
                      type="button"
                      className="text-[11px] text-[#1B7339] underline"
                      onClick={() =>
                        setPermissions((p) =>
                          p.length === ALL_PERMISSION_KEYS.length ? [] : [...ALL_PERMISSION_KEYS],
                        )
                      }
                    >
                      {permissions.length === ALL_PERMISSION_KEYS.length ? "Clear all" : "Select all"}
                    </button>
                  </div>
                  <div className="max-h-48 space-y-1.5 overflow-y-auto">
                    {ADMIN_PERMISSIONS.map((p) => (
                      <label key={p.key} className="flex cursor-pointer items-center gap-2 text-[12px]">
                        <input
                          type="checkbox"
                          checked={permissions.includes(p.key)}
                          onChange={() => togglePerm(p.key, permissions, setPermissions)}
                        />
                        {p.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                type="submit"
                className="w-full rounded-full bg-[#1B7339] hover:bg-[#145a2c]"
                disabled={saving}
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create admin
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-[#E5E5E5] bg-white lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">All admins</CardTitle>
            <CardDescription>{users.length} account(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#1B7339]" />
              </div>
            ) : (
              <ul className="divide-y divide-[#EAEAEA]">
                {users.map((u) => (
                  <li key={u.id} className="space-y-3 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-[#141414]">{u.name}</p>
                        <p className="text-sm text-[#6B6B6B]">{u.email}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Badge
                            variant={u.role === "super_admin" ? "default" : "secondary"}
                            className={
                              u.role === "super_admin" ? "bg-[#1B7339] hover:bg-[#145a2c]" : ""
                            }
                          >
                            {u.role.replace("_", " ")}
                          </Badge>
                          <Badge variant={u.active ? "outline" : "destructive"}>
                            {u.active ? "Active" : "Inactive"}
                          </Badge>
                          {u.role !== "super_admin" && (
                            <Badge variant="outline" className="border-[#C8E6D4] bg-[#E8F5E9] text-[#1B7339]">
                              {(u.permissions || []).length} pages
                            </Badge>
                          )}
                          {u.totpEnabled && (
                            <Badge
                              variant="outline"
                              className="border-[#C8E6D4] bg-[#E8F5E9] text-[#1B7339]"
                            >
                              2FA on
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {u.role !== "super_admin" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full border-[#DCE8DC]"
                            onClick={() => {
                              if (editingId === u.id) {
                                setEditingId(null)
                              } else {
                                setEditingId(u.id)
                                setEditPerms([...(u.permissions || [])])
                              }
                            }}
                          >
                            {editingId === u.id ? "Close permissions" : "Edit permissions"}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full border-[#DCE8DC]"
                          onClick={() => toggleActive(u)}
                        >
                          {u.active ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </div>

                    {editingId === u.id && (
                      <div className="rounded-xl border border-[#E2EBE4] bg-[#F7FBF7] p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-[12px] font-semibold text-[#1B7339]">Page access</p>
                          <button
                            type="button"
                            className="text-[11px] text-[#1B7339] underline"
                            onClick={() =>
                              setEditPerms((p) =>
                                p.length === ALL_PERMISSION_KEYS.length ? [] : [...ALL_PERMISSION_KEYS],
                              )
                            }
                          >
                            Toggle all
                          </button>
                        </div>
                        <div className="grid gap-1.5 sm:grid-cols-2">
                          {ADMIN_PERMISSIONS.map((p) => (
                            <label key={p.key} className="flex cursor-pointer items-center gap-2 text-[12px]">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.key)}
                                onChange={() => togglePerm(p.key, editPerms, setEditPerms)}
                              />
                              {p.label}
                            </label>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          className="mt-3 rounded-full bg-[#1B7339] hover:bg-[#145a2c]"
                          disabled={saving}
                          onClick={() => savePermissions(u.id)}
                        >
                          Save permissions
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
