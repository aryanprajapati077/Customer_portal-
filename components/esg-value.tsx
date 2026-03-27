"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Target, Shield, Users, Globe, Award, BarChart3, Leaf, Building2 } from "lucide-react"

const esgPillars = [
  {
    category: "Environmental",
    icon: Leaf,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
    borderColor: "border-secondary/20",
    metrics: [
      { label: "Carbon Footprint Reduction", value: "85%", icon: Globe },
      { label: "Waste Diverted from Landfills", value: "2.8K tons", icon: Leaf },
      { label: "Water Saved in Production", value: "12M liters", icon: Globe },
    ],
  },
  {
    category: "Social",
    icon: Users,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/20",
    metrics: [
      { label: "Jobs Created", value: "2,500+", icon: Users },
      { label: "Communities Impacted", value: "150+", icon: Building2 },
      { label: "Training Hours Provided", value: "50K+", icon: Award },
    ],
  },
  {
    category: "Governance",
    icon: Shield,
    color: "text-accent",
    bgColor: "bg-accent/10",
    borderColor: "border-accent/20",
    metrics: [
      { label: "Compliance Score", value: "100%", icon: Shield },
      { label: "Transparency Index", value: "A+", icon: BarChart3 },
      { label: "Audit Certifications", value: "12", icon: Award },
    ],
  },
]

const certifications = [
  { name: "ISO 14001", description: "Environmental Management" },
  { name: "B Corp", description: "Social & Environmental Performance" },
  { name: "GRI Standards", description: "Sustainability Reporting" },
  { name: "CDP A-List", description: "Climate Leadership" },
]

export function ESGValue() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

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
    <section id="esg" ref={sectionRef} className="py-16 sm:py-24 lg:py-32 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-20">
          <div
            className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-accent/10 border border-accent/20 mb-4 sm:mb-6 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
            <span className="text-xs sm:text-sm font-medium text-accent">Corporate ESG Value</span>
          </div>
          <h2
            className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 sm:mb-6 transition-all duration-700 delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="text-foreground">Drive Your </span>
            <span className="text-gradient-green">ESG Goals</span>
          </h2>
          <p
            className={`text-base sm:text-lg text-muted-foreground leading-relaxed px-4 sm:px-0 transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Partner with us to strengthen your Environmental, Social, and Governance commitments with measurable,
            verifiable impact.
          </p>
        </div>

        {/* ESG Pillars */}
        <div
          className={`grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-20 transition-all duration-700 delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {esgPillars.map((pillar, index) => (
            <Card
              key={pillar.category}
              className={`p-6 sm:p-8 border-2 ${pillar.borderColor} hover-lift group`}
              style={{ transitionDelay: `${300 + index * 100}ms` }}
            >
              <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div
                  className={`p-3 sm:p-4 rounded-2xl ${pillar.bgColor} group-hover:scale-110 transition-transform duration-300`}
                >
                  <pillar.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${pillar.color}`} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground">{pillar.category}</h3>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {pillar.metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <metric.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${pillar.color} shrink-0`} />
                      <span className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{metric.label}</span>
                    </div>
                    <span className={`text-base sm:text-lg font-bold ${pillar.color} ml-2 shrink-0`}>
                      {metric.value}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Certifications */}
        <div
          className={`transition-all duration-700 delay-500 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h3 className="text-xl sm:text-2xl font-bold text-foreground text-center mb-6 sm:mb-8">
            Trusted Certifications & Standards
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {certifications.map((cert, index) => (
              <Card
                key={cert.name}
                className="p-5 sm:p-6 text-center hover-lift border-border/50"
                style={{ transitionDelay: `${500 + index * 50}ms` }}
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Award className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                </div>
                <h4 className="font-semibold text-sm sm:text-base text-foreground mb-1">{cert.name}</h4>
                <p className="text-xs text-muted-foreground">{cert.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
