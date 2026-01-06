"use client"

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

interface Collection {
  date: string
  weight: number
  location?: string
  co2Saved?: number
  [key: string]: string | number | null | undefined
}

interface ImpactVisualizationProps {
  customer: Customer
  collections: Collection[]
}

export function ImpactVisualization({ customer, collections }: ImpactVisualizationProps) {
  // Process collections data for charts
  const chartData = collections
    .slice(-12)
    .map((collection) => ({
      date: collection.date ? new Date(collection.date).toLocaleDateString("en-US", { month: "short" }) : "N/A",
      weight: Number(collection.weight) || 0,
      co2Saved: Number(collection.co2Saved) || (Number(collection.weight) || 0) * 2.5,
    }))
    .sort((a, b) => {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      return months.indexOf(a.date) - months.indexOf(b.date)
    })

  // Aggregate data by month for bar chart
  const monthlyData = chartData.reduce((acc: Record<string, { weight: number; co2: number }>, curr) => {
    if (!acc[curr.date]) {
      acc[curr.date] = { weight: 0, co2: 0 }
    }
    acc[curr.date].weight += curr.weight
    acc[curr.date].co2 += curr.co2Saved
    return acc
  }, {})

  const barChartData = Object.entries(monthlyData).map(([month, data]) => ({
    month,
    weight: data.weight,
    co2: Math.round(data.co2),
  }))

  // Location distribution for pie chart
  const locationData = collections.reduce((acc: Record<string, number>, curr) => {
    const location = curr.location?.toString() || "Main Office"
    acc[location] = (acc[location] || 0) + (Number(curr.weight) || 0)
    return acc
  }, {})

  const pieChartData = Object.entries(locationData).map(([name, value]) => ({
    name,
    value: Math.round(value),
  }))

  // Colors for pie chart
  const COLORS = ["#EA580C", "#16A34A", "#F97316", "#22C55E", "#FB923C"]

  // Calculate progress towards goals
  const yearlyGoal = (customer.monthlyTarget || 100) * 12
  const progressPercentage = Math.min(((customer.totalWasteCollected || 0) / yearlyGoal) * 100, 100)

  return (
    <div className="space-y-6">
      {/* Charts Section with Tabs */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Impact Analytics</CardTitle>
          <CardDescription>Visualize your sustainability contributions over time</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="trend" className="w-full">
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
              <div className="h-[350px]">
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
                      dataKey="date"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                    />
                    <YAxis
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        boxShadow: "0 10px 40px -10px rgba(0,0,0,0.2)",
                      }}
                      labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="weight"
                      name="Waste Collected (kg)"
                      stroke="#EA580C"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorWeight)"
                    />
                    <Area
                      type="monotone"
                      dataKey="co2Saved"
                      name="CO2 Saved (kg)"
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
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="weight" name="Waste (kg)" fill="#EA580C" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="co2" name="CO2 Saved (kg)" fill="#16A34A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="distribution" className="mt-0">
              <div className="h-[350px] flex items-center justify-center">
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
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                      }}
                      formatter={(value: number) => [`${value} kg`, "Waste Collected"]}
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

        {/* CO2 Impact */}
        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Carbon Impact</CardTitle>
            <CardDescription>Total CO2 emissions saved</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-4">
            <CircularProgress
              value={Math.min(((customer.co2Saved || 0) / 5000) * 100, 100)}
              size={160}
              strokeWidth={10}
              color="secondary"
            />
            <div className="mt-4 text-center">
              <p className="text-2xl font-bold text-foreground">{customer.co2Saved || 0} kg</p>
              <p className="text-sm text-muted-foreground">CO2 prevented</p>
            </div>
          </CardContent>
        </Card>

        {/* Environmental Equivalents */}
        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Trees Equivalent</CardTitle>
            <CardDescription>Environmental impact visualization</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-4">
            <CircularProgress
              value={Math.min(((customer.treesEquivalent || 0) / 200) * 100, 100)}
              size={160}
              strokeWidth={10}
              color="accent"
            />
            <div className="mt-4 text-center">
              <p className="text-2xl font-bold text-foreground">{customer.treesEquivalent || 0}</p>
              <p className="text-sm text-muted-foreground">trees worth of impact</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
