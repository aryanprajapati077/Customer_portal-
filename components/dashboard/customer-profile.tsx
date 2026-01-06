"use client"

import type { Customer } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin, Phone, Mail, Calendar, Users, Target, TrendingUp, CheckCircle2 } from "lucide-react"

interface CustomerProfileProps {
  customer: Customer
}

export function CustomerProfile({ customer }: CustomerProfileProps) {
  const profileItems = [
    { icon: Building2, label: "Company", value: customer.companyName },
    { icon: Mail, label: "Email", value: customer.email },
    { icon: Phone, label: "Phone", value: customer.phone || "Not provided" },
    { icon: MapPin, label: "Address", value: customer.address || "Not provided" },
    { icon: Calendar, label: "Member Since", value: customer.joinDate || "N/A" },
    { icon: Users, label: "Employees", value: customer.employeeCount?.toString() || "N/A" },
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
          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
            {profileItems.map((item, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
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
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-border/30">
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
