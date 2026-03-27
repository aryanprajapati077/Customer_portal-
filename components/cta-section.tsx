"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Mail } from "lucide-react"

export function CTASection() {
  const [isVisible, setIsVisible] = useState(false)
  const [email, setEmail] = useState("")
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="py-16 sm:py-24 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div
          className={`max-w-4xl mx-auto text-center transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full glass border border-primary/20 mb-6 sm:mb-8">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            <span className="text-xs sm:text-sm font-medium text-foreground">Join the Sustainability Movement</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 sm:mb-6">
            <span className="text-foreground">Ready to Make a </span>
            <br className="hidden sm:block" />
            <span className="text-gradient-orange">Real Difference?</span>
          </h2>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed px-4 sm:px-0">
            Take the first step towards a sustainable future. Contact BuffIndia today to explore our annual service
            packages and join the movement for a cleaner, greener planet.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-lg mx-auto mb-6 sm:mb-8 px-4 sm:px-0">
            <div className="flex-1 relative">
              <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 sm:h-14 pl-10 sm:pl-12 pr-3 sm:pr-4 rounded-full border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors text-sm sm:text-base"
              />
            </div>
            <Link href="/contact">
              <Button
                size="lg"
                className="w-full sm:w-auto h-12 sm:h-14 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 rounded-full px-6 sm:px-8 font-semibold group text-sm sm:text-base"
              >
                Contact Us
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground">
            Join 120+ corporate partners already making an impact
          </p>
        </div>
      </div>
    </section>
  )
}
