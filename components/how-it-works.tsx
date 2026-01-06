"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Cigarette, Truck, Factory, Sparkles, Package } from "lucide-react"

const steps = [
  {
    icon: Cigarette,
    title: "Collection",
    description: "Partner organizations collect cigarette waste from designated points across cities.",
    detail: "500+ collection points nationwide",
  },
  {
    icon: Truck,
    title: "Transportation",
    description: "Eco-friendly logistics ensure safe transport to our recycling facilities.",
    detail: "Carbon-neutral delivery fleet",
  },
  {
    icon: Factory,
    title: "Processing",
    description: "Advanced technology separates and processes materials for recycling.",
    detail: "99.5% material recovery rate",
  },
  {
    icon: Sparkles,
    title: "Transformation",
    description: "Waste is transformed into raw materials for sustainable products.",
    detail: "Zero waste to landfill",
  },
  {
    icon: Package,
    title: "New Products",
    description: "Recycled materials become furniture, construction materials, and more.",
    detail: "50+ product categories",
  },
]

export function HowItWorks() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
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

  useEffect(() => {
    if (!isVisible) return

    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [isVisible])

  return (
    <section id="process" ref={sectionRef} className="py-24 lg:py-32 relative bg-muted/30">
      <div className="container mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-20">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Factory className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Our Process</span>
          </div>
          <h2
            className={`text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 transition-all duration-700 delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="text-foreground">From Waste to </span>
            <span className="text-gradient-orange">Wonder</span>
          </h2>
          <p
            className={`text-lg text-muted-foreground leading-relaxed transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Our patented process transforms cigarette waste into valuable sustainable products through a sophisticated,
            zero-waste system.
          </p>
        </div>

        {/* Process Timeline - Desktop */}
        <div
          className={`hidden lg:block relative transition-all duration-700 delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Connection Line */}
          <div className="absolute top-24 left-0 right-0 h-1 bg-border">
            <div
              className="h-full bg-primary transition-all duration-1000 ease-out"
              style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          <div className="grid grid-cols-5 gap-6">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className={`relative transition-all duration-500 ${index <= activeStep ? "opacity-100" : "opacity-40"}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {/* Step Number */}
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-300 ${
                    index <= activeStep
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <step.icon className="w-5 h-5" />
                </div>

                {/* Card */}
                <Card
                  className={`p-6 text-center transition-all duration-300 cursor-pointer ${
                    index === activeStep
                      ? "border-primary/50 shadow-lg shadow-primary/10 scale-105"
                      : "hover:border-border/80"
                  }`}
                  onClick={() => setActiveStep(index)}
                >
                  <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{step.description}</p>
                  <span
                    className={`text-xs font-medium px-3 py-1 rounded-full ${
                      index <= activeStep ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step.detail}
                  </span>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Process Timeline - Mobile */}
        <div className="lg:hidden space-y-6">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className={`flex gap-4 transition-all duration-700 ${
                isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
              }`}
              style={{ transitionDelay: `${300 + index * 100}ms` }}
            >
              {/* Timeline */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    index <= activeStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <step.icon className="w-5 h-5" />
                </div>
                {index < steps.length - 1 && <div className="w-0.5 h-full bg-border mt-2" />}
              </div>

              {/* Content */}
              <Card className="flex-1 p-5">
                <h3 className="text-lg font-semibold text-foreground mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">{step.detail}</span>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
