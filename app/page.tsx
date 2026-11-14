import { Navbar } from "@/components/navbar"
import { LandingHero } from "@/components/landing/hero"
import { LandingPartners } from "@/components/landing/partners"
import { LandingEnquiryForm } from "@/components/landing/enquiry-form"
import { LandingJourney } from "@/components/landing/journey"
import { LandingProducts } from "@/components/landing/products"
import { LandingStatsBar } from "@/components/landing/stats-bar"
import { LandingLeadForm } from "@/components/landing/lead-form"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="landing-root min-h-screen overflow-x-clip">
      <Navbar />
      <LandingHero />
      <LandingPartners />
      <LandingEnquiryForm />
      <LandingJourney />
      <LandingProducts />
      <LandingStatsBar />
      <LandingLeadForm />
      <Footer />
    </main>
  )
}
