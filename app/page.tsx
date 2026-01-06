import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { ImpactDashboard } from "@/components/impact-dashboard"
import { HowItWorks } from "@/components/how-it-works"
import { ESGValue } from "@/components/esg-value"
import { ReportsCertificates } from "@/components/reports-certificates"
import { CTASection } from "@/components/cta-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <ImpactDashboard />
      <HowItWorks />
      {/* rest of code here */}
      <ESGValue />
      <ReportsCertificates />
      <CTASection />
      <Footer />
    </main>
  )
}
