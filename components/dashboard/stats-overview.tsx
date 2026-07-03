"use client"

import Link from "next/link"
import type { Customer } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Cigarette, Recycle, Droplets, Calendar, Building2, Package, Sparkles, ExternalLink } from "lucide-react"
import { AnimatedCounter } from "@/components/animated-counter"
import { usePreferences } from "@/lib/preferences-context"

interface CollectionForTotals {
  weight?: number | string | null
}

interface StatsOverviewProps {
  customer: Customer
  collections?: CollectionForTotals[]
}

export function StatsOverview({ customer, collections }: StatsOverviewProps) {
  const { preferences } = usePreferences()
  const collectionsTotalWasteKg =
    collections?.reduce((sum, c) => sum + (Number(c.weight) || 0), 0) ?? 0

  // Prefer all-time sum from collections (day 1 → latest). Fallback to customer.totalWasteCollected if collections not loaded yet.
  const totalWasteKg = collections && collections.length > 0 ? collectionsTotalWasteKg : Number(customer.totalWasteCollected) || 0
  // Formulas provided:
  // 1kg waste = 3000 butts
  // microplastics upcycled = 80% of total waste
  // water protected = 100 L per butt
  const cigaretteButtsCount = Math.round(totalWasteKg * 3000)
  const microplasticsUpcycledKg = +(totalWasteKg * 0.8).toFixed(2)
  const waterResourcesProtectedL = Math.round(cigaretteButtsCount * 100)

  const stats = [
    {
      label: "Total Waste Collected",
      value: preferences.weightUnit === "lb" ? totalWasteKg * 2.20462 : totalWasteKg,
      suffix: preferences.weightUnit,
      decimals: 1,
      icon: Package,
      color: "primary",
      description: "Total waste processed",
    },
    {
      label: "Cigarette Butts Collected",
      value: cigaretteButtsCount,
      suffix: "",
      icon: Cigarette,
      color: "secondary",
      description: "Total butts collected",
    },
    {
      label: "Microplastics Upcycled",
      value: preferences.weightUnit === "lb" ? microplasticsUpcycledKg * 2.20462 : microplasticsUpcycledKg,
      suffix: preferences.weightUnit,
      decimals: 1,
      icon: Recycle,
      color: "accent",
      description: "Microplastics converted to products",
    },
    {
      label: "Water Resources Protected",
      value: waterResourcesProtectedL,
      suffix: " L",
      icon: Droplets,
      color: "chart-1",
      description: "Water protected through recycling",
    },
    {
      label: "Kraftreborn Credits",
      value: Number(customer.kraftrebornCredits) || 0,
      suffix: "",
      icon: Sparkles,
      color: "primary",
      description: "1 credit = ₹1 · Tap to shop Kraft Reborn products",
      href: "/dashboard/shop",
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((stat, index) => {
          const isClickable = Boolean((stat as { href?: string }).href)
          const card = (
          <Card
            key={stat.label}
            className={`glass border-border/50 hover-lift group overflow-hidden relative ${
              isClickable ? "cursor-pointer ring-offset-background hover:ring-2 hover:ring-primary/30" : "cursor-default"
            }`}
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
                  <AnimatedCounter
                    end={Number(stat.value) || 0}
                    duration={2000}
                    suffix={stat.suffix ? ` ${stat.suffix}` : ""}
                    decimals={(stat as any).decimals ?? 0}
                  />
                </div>
                <p className="text-sm font-medium text-foreground flex items-center gap-1">
                  {stat.label}
                  {isClickable && <ExternalLink className="w-3 h-3 opacity-60" />}
                </p>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
          )

          if (isClickable) {
            return (
              <Link key={stat.label} href={(stat as { href: string }).href} className="block">
                {card}
              </Link>
            )
          }
          return card
        })}
      </div>
    </div>
  )
}
