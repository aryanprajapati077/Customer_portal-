"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { useAuth } from "@/lib/auth-context"
import { usePreferences, type WeightUnit } from "@/lib/preferences-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const { customer, isLoading } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { preferences, setWeightUnit } = usePreferences()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!isLoading && !customer) router.push("/login")
  }, [customer, isLoading, router])

  if (isLoading || !customer) return null

  const weightUnit: WeightUnit = preferences.weightUnit
  const isLb = weightUnit === "lb"

  return (
    <div className="min-h-screen bg-background">
      <div className="relative z-10">
        <DashboardHeader customer={customer} />

        <main className="container mx-auto px-4 lg:px-8 py-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
              <p className="text-sm text-muted-foreground">Personalize your dashboard experience</p>
            </div>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Appearance</CardTitle>
                <CardDescription>Light / Dark mode</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Theme</p>
                    <p className="text-xs text-muted-foreground">Choose how the portal looks</p>
                  </div>
                  <div className="min-w-[180px]">
                    <Select value={mounted ? theme : "system"} onValueChange={(v) => setTheme(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Measurements</CardTitle>
                <CardDescription>Choose your preferred units</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Weight unit</p>
                    <p className="text-xs text-muted-foreground">Used across waste & microplastics metrics</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs ${!isLb ? "text-foreground" : "text-muted-foreground"}`}>kg</span>
                    <Switch checked={isLb} onCheckedChange={(checked) => setWeightUnit(checked ? "lb" : "kg")} />
                    <span className={`text-xs ${isLb ? "text-foreground" : "text-muted-foreground"}`}>lb</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

