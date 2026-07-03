"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, Award, Calendar, FileCheck, Shield, TrendingUp, Leaf, type LucideIcon } from "lucide-react"

const ICON_MAP: Record<string, LucideIcon> = {
  shield: Shield,
  award: Award,
  filecheck: FileCheck,
  leaf: Leaf,
  trending: TrendingUp,
}

const reports = [
  {
    title: "Annual Sustainability Report 2024",
    type: "ESG Report",
    date: "January 2024",
    size: "4.2 MB",
    icon: TrendingUp,
    featured: true,
    description: "Comprehensive overview of our environmental, social, and governance performance.",
  },
  {
    title: "Carbon Footprint Assessment",
    type: "Environmental",
    date: "Q4 2024",
    size: "2.8 MB",
    icon: Leaf,
    featured: false,
    description: "Detailed analysis of our carbon emissions and reduction strategies.",
  },
  {
    title: "Impact Measurement Report",
    type: "Impact Report",
    date: "December 2024",
    size: "3.5 MB",
    icon: FileCheck,
    featured: false,
    description: "Quantified metrics showing our environmental and social impact.",
  },
  {
    title: "Supply Chain Transparency Report",
    type: "Governance",
    date: "November 2024",
    size: "1.9 MB",
    icon: Shield,
    featured: false,
    description: "Full disclosure of our supply chain practices and partnerships.",
  },
]

const certificatesFallback = [
  {
    title: "ISO 14001:2015",
    issuer: "International Organization for Standardization",
    validUntil: "December 2026",
    type: "Environmental Management",
    icon: Shield,
    pdfUrl: null as string | null,
  },
  {
    title: "B Corp Certification",
    issuer: "B Lab",
    validUntil: "March 2027",
    type: "Social & Environmental",
    icon: Award,
    pdfUrl: null,
  },
  {
    title: "GRI Standards Compliance",
    issuer: "Global Reporting Initiative",
    validUntil: "Ongoing",
    type: "Sustainability Reporting",
    icon: FileCheck,
    pdfUrl: null,
  },
  {
    title: "CDP Climate A-List",
    issuer: "Carbon Disclosure Project",
    validUntil: "2024 Recognition",
    type: "Climate Leadership",
    icon: Leaf,
    pdfUrl: null,
  },
  {
    title: "Zero Waste Certification",
    issuer: "TRUE by GBCI",
    validUntil: "August 2026",
    type: "Waste Management",
    icon: TrendingUp,
    pdfUrl: null,
  },
  {
    title: "Fair Trade Certified",
    issuer: "Fair Trade USA",
    validUntil: "June 2025",
    type: "Social Responsibility",
    icon: Award,
    pdfUrl: null,
  },
]

type CertDisplay = {
  title: string
  issuer: string
  validUntil: string
  type: string
  icon: LucideIcon
  pdfUrl: string | null
}

export function ReportsCertificates() {
  const [isVisible, setIsVisible] = useState(false)
  const [certificates, setCertificates] = useState<CertDisplay[]>(certificatesFallback)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/verified-certificates")
        const data = await res.json()
        if (data?.success && data.certificates?.length) {
          setCertificates(
            data.certificates.map((c: { title: string; issuer: string; validUntil: string; type: string; icon: string; pdfUrl?: string | null }) => ({
              title: c.title,
              issuer: c.issuer,
              validUntil: c.validUntil,
              type: c.type,
              icon: ICON_MAP[c.icon] || Shield,
              pdfUrl: c.pdfUrl || null,
            })),
          )
        }
      } catch {
        // keep fallback
      }
    })()
  }, [])

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
    <section id="reports" ref={sectionRef} className="py-16 sm:py-24 lg:py-32 relative bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-20">
          <div
            className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 mb-4 sm:mb-6 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            <span className="text-xs sm:text-sm font-medium text-primary">Transparency & Trust</span>
          </div>
          <h2
            className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 sm:mb-6 transition-all duration-700 delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="text-foreground">Reports & </span>
            <span className="text-gradient-orange">Certificates</span>
          </h2>
          <p
            className={`text-base sm:text-lg text-muted-foreground leading-relaxed px-4 sm:px-0 transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Access our comprehensive reports and verified certifications. Full transparency in our environmental and
            social commitments.
          </p>
        </div>

        {/* Reports Section */}
        <div
          className={`mb-12 sm:mb-20 transition-all duration-700 delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3">
            <Download className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            Download Reports
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {reports.map((report, index) => (
              <Card
                key={report.title}
                className={`p-5 sm:p-6 hover-lift group cursor-pointer transition-all ${
                  report.featured ? "border-2 border-primary/30 bg-primary/5" : "border-border/50"
                }`}
                style={{ transitionDelay: `${300 + index * 100}ms` }}
              >
                <div className="flex gap-4 sm:gap-5">
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 ${
                      report.featured ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <report.icon className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="mb-2">
                      {report.featured && (
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded mb-2 inline-block">
                          Featured
                        </span>
                      )}
                      <h4 className="font-semibold text-foreground text-base sm:text-lg leading-tight">
                        {report.title}
                      </h4>
                    </div>

                    <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2">
                      {report.description}
                    </p>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          {report.type}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          {report.date}
                        </span>
                        <span>{report.size}</span>
                      </div>

                      <Button
                        size="sm"
                        variant={report.featured ? "default" : "outline"}
                        className={`rounded-full w-full sm:w-auto ${
                          report.featured ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""
                        }`}
                      >
                        <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Certificates Section */}
        <div
          className={`transition-all duration-700 delay-500 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3">
            <Award className="w-5 h-5 sm:w-6 sm:h-6 text-secondary" />
            Verified Certificates
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {certificates.map((cert, index) => (
              <Card
                key={cert.title}
                className="p-5 sm:p-6 hover-lift group border-border/50"
                style={{ transitionDelay: `${500 + index * 75}ms` }}
              >
                <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0">
                    <cert.icon className="w-5 h-5 sm:w-6 sm:h-6 text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm sm:text-base text-foreground mb-1">{cert.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">{cert.issuer}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-3 sm:mb-4">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium text-foreground text-right">{cert.type}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Valid Until</span>
                    <span className="font-medium text-secondary">{cert.validUntil}</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-full group-hover:border-secondary group-hover:text-secondary transition-colors bg-transparent text-xs sm:text-sm"
                  onClick={() => {
                    if (cert.pdfUrl) window.open(cert.pdfUrl, "_blank")
                  }}
                  disabled={!cert.pdfUrl}
                >
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  Download Certificate
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
