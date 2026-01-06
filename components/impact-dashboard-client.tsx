"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { TrendingUp, Recycle, Factory, TreePine, Wind } from "lucide-react"
import { AnimatedCounter } from "@/components/animated-counter"
import { ImpactChart } from "@/components/impact-chart"
import { CircularProgress } from "@/components/circular-progress"

interface ImpactDashboardClientProps {
  impact: {
    wasteCollected: number
    productsCreated: number
    treesEquivalent: number
    co2Prevented: number
  } | null
}

export function ImpactDashboardClient({ impact }: ImpactDashboardClientProps) {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  const impactMetrics = [
    {
      icon: Recycle,
      label: "Waste Collected",
      value: impact?.wasteCollected || 2847,
      suffix: " tons",
      change: "+12.5%",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Factory,
      label: "Products Created",
      value: (impact?.productsCreated || 1200000) / 1000000,
      suffix: "M",
      decimals: 1,
      change: "+8.3%",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      icon: TreePine,
      label: "Trees Equivalent",
      value: impact?.treesEquivalent || 45600,
      suffix: "",
      change: "+15.2%",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: Wind,
      label: "CO₂ Prevented",
      value: (impact?.co2Prevented || 850000) / 1000,
      suffix: "K kg",
      change: "+9.7%",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ]

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section id="impact" ref={sectionRef} className="py-16 sm:py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-background to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
          <div
            className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-secondary/10 border border-secondary/20 mb-4 sm:mb-6 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary" />
            <span className="text-xs sm:text-sm font-medium text-secondary">Real-Time Impact Metrics</span>
          </div>
          <h2
            className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 sm:mb-6 transition-all duration-700 delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="text-foreground">Measurable </span>
            <span className="text-gradient-green">Impact</span>
          </h2>
          <p
            className={`text-base sm:text-lg text-muted-foreground leading-relaxed px-4 sm:px-0 transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Track our environmental contributions in real-time. Every metric represents tangible progress toward a
            cleaner, more sustainable world.
          </p>
        </div>

        <div
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16 transition-all duration-700 delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {impactMetrics.map((metric, index) => (
            <Card
              key={metric.label}
              className="p-5 sm:p-6 bg-card border-border/50 hover-lift group cursor-default"
              style={{ transitionDelay: `${300 + index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div
                  className={`p-2.5 sm:p-3 rounded-xl ${metric.bgColor} group-hover:scale-110 transition-transform duration-300`}
                >
                  <metric.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${metric.color}`} />
                </div>
                <span className="text-xs sm:text-sm font-medium text-secondary">{metric.change}</span>
              </div>
              <div className={`text-2xl sm:text-3xl font-bold ${metric.color} mb-1`}>
                <AnimatedCounter end={metric.value} suffix={metric.suffix} decimals={metric.decimals || 0} />
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">{metric.label}</p>
            </Card>
          ))}
        </div>

        <div
          className={`grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 transition-all duration-700 delay-500 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <Card className="lg:col-span-2 p-5 sm:p-8 bg-card border-border/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-1">Impact Over Time</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Monthly waste collection and recycling metrics
                </p>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-primary" />
                  <span className="text-xs sm:text-sm text-muted-foreground">Collected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-secondary" />
                  <span className="text-xs sm:text-sm text-muted-foreground">Recycled</span>
                </div>
              </div>
            </div>
            <ImpactChart />
          </Card>

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6">
            <Card className="p-5 sm:p-6 bg-card border-border/50 flex flex-col">
              <h4 className="text-xs sm:text-sm font-medium text-muted-foreground mb-3 sm:mb-4">
                Recycling Efficiency
              </h4>
              <div className="flex items-center justify-center flex-1">
                <CircularProgress value={94} color="primary" />
              </div>
              <p className="text-center text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4">
                Industry-leading efficiency rate
              </p>
            </Card>
            <Card className="p-5 sm:p-6 bg-card border-border/50 flex flex-col">
              <h4 className="text-xs sm:text-sm font-medium text-muted-foreground mb-3 sm:mb-4">Carbon Offset Goal</h4>
              <div className="flex items-center justify-center flex-1">
                <CircularProgress value={78} color="secondary" />
              </div>
              <p className="text-center text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4">
                2024 annual target progress
              </p>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
