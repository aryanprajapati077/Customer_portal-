"use client"

import { useMemo, useState } from "react"
import type { Customer } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CircularProgress } from "@/components/circular-progress"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, BarChart3, PieChartIcon } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { usePreferences } from "@/lib/preferences-context"

const tooltipProps = {
  wrapperStyle: { zIndex: 50, outline: "none" as const },
  allowEscapeViewBox: { x: true, y: true },
  offset: 16,
  contentStyle: {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "12px",
    boxShadow: "0 10px 40px -10px rgba(0,0,0,0.25)",
  },
  labelStyle: { fontWeight: 600, marginBottom: 4 },
}

interface Collection {
  date: string
  weight: number
  location?: string
  [key: string]: string | number | null | undefined
}

interface ImpactVisualizationProps {
  customer: Customer
  collections: Collection[]
}

export function ImpactVisualization({ customer, collections }: ImpactVisualizationProps) {
  const { preferences } = usePreferences()
  const [range, setRange] = useState<"1y" | "5y" | "max">("1y")
  const [activeTab, setActiveTab] = useState<"trend" | "comparison" | "distribution">("trend")
  const weightUnit = preferences.weightUnit
  const weightFactor = weightUnit === "lb" ? 2.20462 : 1

  const filteredCollections = useMemo(() => {
    if (!collections?.length || range === "max") return collections

    // Use latest collection date as the reference "now"
    const latest = collections
      .map((c) => (c.date ? new Date(c.date) : null))
      .filter((d): d is Date => !!d && !Number.isNaN(d.getTime()))
      .sort((a, b) => b.getTime() - a.getTime())[0]

    if (!latest) return collections

    const monthsBack = range === "1y" ? 12 : 60
    const start = new Date(latest)
    start.setMonth(start.getMonth() - monthsBack)

    return collections.filter((c) => {
      const d = c.date ? new Date(c.date) : null
      if (!d || Number.isNaN(d.getTime())) return false
      return d >= start && d <= latest
    })
  }, [collections, range])

  const { chartData, barChartData, pieChartData } = useMemo(() => {
    // Group collections by month (prevents duplicate points and shows monthly sums)
    const monthlyMap = new Map<
      string,
      { month: string; weight: number; microplasticsUpcycled: number; waterResourcesProtected: number }
    >()

    for (const c of filteredCollections) {
      const d = c.date ? new Date(c.date) : null
      if (!d || Number.isNaN(d.getTime())) continue

      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const monthLabel = d.toLocaleDateString("en-US", { month: "short", year: "numeric" }) // e.g. "Mar 2026"

      const weight = Number(c.weight) || 0
      const micro = weight * 0.8
      const water = Math.round(weight * 3000 * 100)

      const existing = monthlyMap.get(key)
      if (existing) {
        existing.weight += weight
        existing.microplasticsUpcycled += micro
        existing.waterResourcesProtected += water
      } else {
        monthlyMap.set(key, { month: monthLabel, weight, microplasticsUpcycled: micro, waterResourcesProtected: water })
      }
    }

    const chartData = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => ({
        month: v.month,
        weight: +(v.weight * weightFactor).toFixed(2),
        microplasticsUpcycled: +(v.microplasticsUpcycled * weightFactor).toFixed(2),
        waterResourcesProtected: Math.round(v.waterResourcesProtected),
      }))

    const barChartData = chartData.map((d) => ({
      month: d.month,
      weight: d.weight,
      microplasticsUpcycled: d.microplasticsUpcycled,
    }))

    // Location distribution for pie chart (range-aware)
    const locationData = filteredCollections.reduce((acc: Record<string, number>, curr) => {
      const location = curr.location?.toString() || "Main Office"
      acc[location] = (acc[location] || 0) + (Number(curr.weight) || 0)
      return acc
    }, {})

    const pieChartData = Object.entries(locationData).map(([name, value]) => ({
      name,
      value: Math.round(value * weightFactor),
    }))

    return { chartData, barChartData, pieChartData }
  }, [filteredCollections, weightFactor])

  // Colors for pie chart
  const COLORS = ["#EA580C", "#16A34A", "#F97316", "#22C55E", "#FB923C"]

  // Calculate progress towards goals
  const yearlyGoal = (customer.monthlyTarget || 100) * 12
  const progressPercentage = Math.min(((customer.totalWasteCollected || 0) / yearlyGoal) * 100, 100)
  const totalWasteKg = Number(customer.totalWasteCollected) || 0
  const cigaretteButtsCount = Math.round(totalWasteKg * 3000)
  const microplasticsUpcycledKg = +(totalWasteKg * 0.8).toFixed(2)
  const waterResourcesProtectedL = Math.round(cigaretteButtsCount * 100)

  return (
    <div className="space-y-6">
      {/* Charts Section with Tabs */}
      <Card className="glass border-border/50">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Impact Analytics</CardTitle>
              <CardDescription>Visualize your sustainability contributions over time</CardDescription>
            </div>
            <ToggleGroup
              type="single"
              value={range}
              onValueChange={(v) => {
                if (v === "1y" || v === "5y" || v === "max") setRange(v)
              }}
              variant="outline"
              size="sm"
              className="bg-muted/40"
            >
              <ToggleGroupItem value="1y" aria-label="Last 1 year">
                1y
              </ToggleGroupItem>
              <ToggleGroupItem value="5y" aria-label="Last 5 years">
                5y
              </ToggleGroupItem>
              <ToggleGroupItem value="max" aria-label="Max range">
                Max
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="mb-6 bg-muted/50">
              <TabsTrigger value="trend" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Trend
              </TabsTrigger>
              <TabsTrigger value="comparison" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Monthly
              </TabsTrigger>
              <TabsTrigger value="distribution" className="gap-2">
                <PieChartIcon className="w-4 h-4" />
                Distribution
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trend" className="mt-0">
              <div
                key={`trend-${range}`}
                className="h-[350px] animate-in fade-in slide-in-from-bottom-2 duration-500"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EA580C" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#EA580C" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorCO2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16A34A" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                    />
                    <YAxis
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                    />
                    <Tooltip
                      {...tooltipProps}
                      formatter={(value: number, name: string) => {
                        if (name === "Water Resources Protected (L)") return [value.toLocaleString(), name]
                        return [value.toLocaleString(), name]
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="weight"
                      name={`Waste Collected (${weightUnit})`}
                      stroke="#EA580C"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorWeight)"
                    />
                    <Area
                      type="monotone"
                      dataKey="microplasticsUpcycled"
                      name={`Microplastics Upcycled (${weightUnit})`}
                      stroke="#16A34A"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCO2)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="comparison" className="mt-0">
              <div
                key={`comparison-${range}`}
                className="h-[350px] animate-in fade-in slide-in-from-bottom-2 duration-500"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <Tooltip
                      {...tooltipProps}
                    />
                    <Legend />
                    <Bar dataKey="weight" name={`Waste (${weightUnit})`} fill="#EA580C" radius={[4, 4, 0, 0]} />
                    <Bar
                      dataKey="microplasticsUpcycled"
                      name={`Microplastics Upcycled (${weightUnit})`}
                      fill="#16A34A"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="distribution" className="mt-0">
              <div
                key={`distribution-${range}`}
                className="h-[350px] flex items-center justify-center animate-in fade-in slide-in-from-bottom-2 duration-500"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={{ stroke: "hsl(var(--muted-foreground))" }}
                    >
                      {pieChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      {...tooltipProps}
                      formatter={(value: number) => [`${value} ${weightUnit}`, "Waste Collected"]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Progress Cards Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Yearly Goal Progress */}
        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Yearly Goal</CardTitle>
            <CardDescription>Progress towards {yearlyGoal} kg target</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-4">
            <CircularProgress value={progressPercentage} size={160} strokeWidth={10} />
            <div className="mt-4 text-center">
              <p className="text-2xl font-bold text-foreground">{customer.totalWasteCollected || 0} kg</p>
              <p className="text-sm text-muted-foreground">of {yearlyGoal} kg goal</p>
            </div>
          </CardContent>
        </Card>

        {/* Microplastics Upcycled */}
        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Microplastics Upcycled</CardTitle>
            <CardDescription>Total microplastics converted into products</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-4">
            <CircularProgress
              value={Math.min((microplasticsUpcycledKg / 1000) * 100, 100)}
              size={160}
              strokeWidth={10}
              color="secondary"
            />
            <div className="mt-4 text-center">
              <p className="text-2xl font-bold text-foreground">{microplasticsUpcycledKg} kg</p>
              <p className="text-sm text-muted-foreground">upcycled</p>
            </div>
          </CardContent>
        </Card>

        {/* Water Resources Protected */}
        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Water Resources Protected</CardTitle>
            <CardDescription>Estimated water protected through recycling</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-4">
            <CircularProgress
              value={Math.min((waterResourcesProtectedL / 100000000) * 100, 100)}
              size={160}
              strokeWidth={10}
              color="accent"
            />
            <div className="mt-4 text-center">
              <p className="text-2xl font-bold text-foreground">{waterResourcesProtectedL} L</p>
              <p className="text-sm text-muted-foreground">protected</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
