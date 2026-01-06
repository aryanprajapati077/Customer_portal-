"use client"

import type { Customer } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Cigarette, Award, TrendingUp, Leaf, Calendar, Building2 } from "lucide-react"
import { AnimatedCounter } from "@/components/animated-counter"

interface StatsOverviewProps {
  customer: Customer
}

export function StatsOverview({ customer }: StatsOverviewProps) {
  const stats = [
    {
      label: "Total Waste Collected",
      value: customer.totalWasteCollected || 0,
      suffix: " kg",
      icon: Cigarette,
      color: "primary",
      description: "Cigarette butts recycled",
    },
    {
      label: "CO2 Saved",
      value: customer.co2Saved || Math.round((customer.totalWasteCollected || 0) * 2.5),
      suffix: " kg",
      icon: Leaf,
      color: "secondary",
      description: "Carbon footprint reduced",
    },
    {
      label: "Trees Equivalent",
      value: customer.treesEquivalent || Math.round((customer.totalWasteCollected || 0) / 10),
      suffix: "",
      icon: TrendingUp,
      color: "accent",
      description: "Environmental impact",
    },
    {
      label: "Certificates Earned",
      value: customer.certificatesEarned || 0,
      suffix: "",
      icon: Award,
      color: "chart-1",
      description: "ESG certifications",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="glass border-border/50 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/5 to-transparent" />
        <CardContent className="p-6 relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                Welcome back, {customer.contactPerson?.split(" ")[0] || "Partner"}!
              </h1>
              <p className="text-muted-foreground">Here&apos;s your sustainability impact overview</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span>{customer.companyName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Member since {customer.joinDate || "2024"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card
            key={stat.label}
            className="glass border-border/50 hover-lift group cursor-default overflow-hidden relative"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                index === 0
                  ? "from-primary/10 to-transparent"
                  : index === 1
                    ? "from-secondary/10 to-transparent"
                    : index === 2
                      ? "from-accent/10 to-transparent"
                      : "from-chart-1/10 to-transparent"
              }`}
            />
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    index === 0
                      ? "bg-primary/10"
                      : index === 1
                        ? "bg-secondary/10"
                        : index === 2
                          ? "bg-accent/10"
                          : "bg-chart-1/10"
                  }`}
                >
                  <stat.icon
                    className={`w-6 h-6 ${
                      index === 0
                        ? "text-primary"
                        : index === 1
                          ? "text-secondary"
                          : index === 2
                            ? "text-accent"
                            : "text-chart-1"
                    }`}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-foreground">
                  <AnimatedCounter value={stat.value} duration={2000} />
                  {stat.suffix}
                </div>
                <p className="text-sm font-medium text-foreground">{stat.label}</p>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
