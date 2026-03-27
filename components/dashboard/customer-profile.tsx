"use client"

import type { Customer } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Users,
  Target,
  TrendingUp,
  CheckCircle2,
  IdCard,
  Recycle,
} from "lucide-react"

interface CustomerProfileProps {
  customer: Customer
  collections?: Array<{ date?: string | Date | null }>
}

export function CustomerProfile({ customer, collections }: CustomerProfileProps) {
  const latestCollectionDateRaw = customer.lastCollection || collections?.[0]?.date || null

  const latestCollectionDate = latestCollectionDateRaw
    ? new Date(latestCollectionDateRaw as any).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A"

  const disposalUnits = Number(customer.disposalUnitInstalled) || 0

  const profileItems = [
    { icon: Building2, label: "Company", value: customer.companyName },
    { icon: IdCard, label: "Client ID", value: customer.id },
    { icon: Mail, label: "Email", value: customer.email },
    { icon: Phone, label: "Phone", value: customer.phone || "Not provided" },
    { icon: MapPin, label: "Address", value: customer.address || "Not provided" },
    { icon: Calendar, label: "Member Since", value: customer.joinDate || "N/A" },
    { icon: Users, label: "Employees", value: customer.employeeCount?.toString() || "N/A" },
    { icon: Calendar, label: "Latest Collection Date", value: latestCollectionDate },
    { icon: Recycle, label: "Disposal Units Installed", value: disposalUnits.toString() },
  ]

  const targetProgress = customer.monthlyTarget
    ? Math.min(((customer.totalWasteCollected || 0) / (customer.monthlyTarget * 12)) * 100, 100)
    : 75

  return (
    <Card className="glass border-border/50 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Company Profile</CardTitle>
          <Badge
            variant="outline"
            className={`${
              customer.status?.toLowerCase() === "active"
                ? "bg-secondary/10 text-secondary border-secondary/30"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {customer.status || "Active"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Profile Details */}
          <div className="lg:col-span-2 grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {profileItems.map((item, index) => (
              <div
                key={item.label}
                className="group flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/30 hover:bg-muted/40 hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${index * 60}ms`, animationFillMode: "both" }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground mb-0.5">{item.label}</p>
                  <p className="text-sm font-medium text-foreground truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Progress Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-border/30 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">Annual Progress</span>
            </div>

            <div className="relative pt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-primary">{targetProgress.toFixed(0)}%</span>
                <span className="text-xs text-muted-foreground">
                  {customer.totalWasteCollected || 0} / {(customer.monthlyTarget || 100) * 12} kg
                </span>
              </div>
              <div className="overflow-hidden h-3 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000 ease-out"
                  style={{ width: `${targetProgress}%` }}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 text-secondary" />
              <span>On track to exceed yearly target</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
