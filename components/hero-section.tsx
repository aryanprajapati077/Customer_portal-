"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Play, Sparkles } from "lucide-react"
import { AnimatedCounter } from "@/components/animated-counter"

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl animate-pulse-slow" />

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        {/* Radial Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--background)_70%)]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full glass border border-border/50 mb-6 sm:mb-8 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            <span className="text-xs sm:text-sm font-medium text-foreground">
              Butt Free India – India&apos;s First End-to-End Cigarette Waste Management
            </span>
          </div>

          {/* Main Headline */}
          <h1
            className={`text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1] sm:leading-[1.05] mb-6 sm:mb-8 transition-all duration-700 delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="text-foreground">Turning Waste</span>
            <br />
            <span className="text-foreground">Into </span>
            <span className="text-gradient-orange">Impact</span>
          </h1>

          {/* Subheadline */}
          <p
            className={`text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed px-4 sm:px-0 transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            We collect and recycle cigarette waste through designated smoking areas, transforming butts into
            eco-friendly products. Join the movement for a cleaner, greener India.
          </p>

          {/* CTA Buttons */}
          <div
            className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-20 px-4 sm:px-0 transition-all duration-700 delay-300 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <Button
              size="lg"
              className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 rounded-full px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-semibold group"
            >
              Start Your ESG Journey
              <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto rounded-full px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-semibold border-2 hover:bg-muted/50 group bg-transparent"
            >
              <Play className="mr-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
              Watch Our Story
            </Button>
          </div>

          {/* Impact Stats */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 max-w-3xl mx-auto px-4 sm:px-0 transition-all duration-700 delay-400 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="text-center p-5 sm:p-6 rounded-2xl glass hover-lift">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-2">
                <AnimatedCounter end={2.5} suffix="B+" decimals={1} />
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">Cigarette Butts Collected</p>
            </div>
            <div className="text-center p-5 sm:p-6 rounded-2xl glass hover-lift">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-secondary mb-2">
                <AnimatedCounter end={850} suffix="K" />
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">Water Resources Protected in Liters</p>
            </div>
            <div className="text-center p-5 sm:p-6 rounded-2xl glass hover-lift">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-accent mb-2">
                <AnimatedCounter end={120} suffix="+" />
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">Corporate Partners</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 rounded-full bg-muted-foreground/50 animate-pulse" />
        </div>
      </div>
    </section>
  )
}
