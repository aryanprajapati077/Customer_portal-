"use client";

import type { Customer } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import {
  Cigarette,
  Award,
  TrendingUp,
  Leaf,
  Calendar,
  Building2,
} from "lucide-react";
import { AnimatedCounter } from "@/components/animated-counter";

interface CollectionLike {
  weight?: number | null;
  co2Saved?: number | null;
}

interface StatsOverviewProps {
  customer: Customer;
  /** When provided, totals are derived from these collections (from API) so stats match collection history. */
  collections?: CollectionLike[];
}

function safeNumber(n: unknown): number {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

export function StatsOverview({ customer, collections }: StatsOverviewProps) {
  const fromCollections =
    Array.isArray(collections) && collections.length > 0
      ? {
          totalWaste: collections.reduce((s, c) => s + safeNumber(c.weight), 0),
          totalCO2: collections.reduce(
            (s, c) => s + safeNumber(c.co2Saved ?? safeNumber(c.weight) * 2.5),
            0,
          ),
        }
      : null;
  const totalWaste = fromCollections
    ? fromCollections.totalWaste
    : safeNumber(customer.totalWasteCollected);
  const totalCO2 = fromCollections
    ? fromCollections.totalCO2
    : safeNumber(customer.co2Saved) || Math.round(totalWaste * 2.5);
  const treesEquivalent =
    safeNumber(customer.treesEquivalent) || Math.round(totalWaste / 10);
  const stats = [
    {
      label: "Total Waste Collected",
      value: totalWaste,
      suffix: " kg",
      icon: Cigarette,
      color: "primary",
      description: "Cigarette butts recycled",
    },
    {
      label: "CO2 Saved",
      value: totalCO2,
      suffix: " kg",
      icon: Leaf,
      color: "secondary",
      description: "Carbon footprint reduced",
    },
    {
      label: "Trees Equivalent",
      value: treesEquivalent,
      suffix: "",
      icon: TrendingUp,
      color: "accent",
      description: "Environmental impact",
    },
    {
      label: "Certificates Earned",
      value: safeNumber(customer.certificatesEarned),
      suffix: "",
      icon: Award,
      color: "chart-1",
      description: "ESG certifications",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="glass border-border/50 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/5 to-transparent" />
        <CardContent className="p-6 relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                Welcome back,{" "}
                {customer.contactPerson?.split(" ")[0] || "Partner"}!
              </h1>
              <p className="text-muted-foreground">
                Here&apos;s your sustainability impact overview
              </p>
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
                  <AnimatedCounter
                    end={stat.value}
                    duration={2000}
                    suffix={stat.suffix}
                  />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {stat.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
