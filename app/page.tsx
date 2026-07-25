import { Navbar } from "@/components/navbar"
import { LandingHero } from "@/components/landing/hero"
import { LandingProblem } from "@/components/landing/problem"
import { LandingSolution } from "@/components/landing/solution"
import { LandingRecovery } from "@/components/landing/recovery"
import { LandingImpact } from "@/components/landing/impact"
import { LandingCta } from "@/components/landing/cta"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="landing-root min-h-screen overflow-x-hidden">
      <Navbar />
      <LandingHero />
      <LandingProblem />
      <LandingSolution />
      <LandingRecovery />
      <LandingImpact />
      <LandingCta />
      <Footer />
    </main>
  )
}
