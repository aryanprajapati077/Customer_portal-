import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Building2, Hotel, Briefcase } from "lucide-react"

export const metadata: Metadata = {
  title: "References | BuffIndia – Trusted by Leading Organizations",
  description:
    "BuffIndia is trusted by Fortune 500 corporates, premium hotels, and renowned establishments across India. Explore our client references.",
}

export default function ReferencesPage() {
  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <section className="pt-28 pb-16 sm:pt-32 sm:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <a href="/" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">
            Home / References
          </a>

          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">Our References</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              BuffIndia is proud to be supported by major Fortune 500 corporates, premium hotels, and renowned
              establishments across India.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Briefcase,
                  title: "Fortune 500 Corporates",
                  desc: "Leading corporations trust BuffIndia for their cigarette waste management and sustainability goals.",
                },
                {
                  icon: Hotel,
                  title: "Premium Hotels",
                  desc: "Renowned hotel chains across India have partnered with BuffIndia for responsible waste disposal.",
                },
                {
                  icon: Building2,
                  title: "Establishments Nationwide",
                  desc: "Over 12,000+ businesses across 84+ cities and 22 states have joined the BuffIndia movement.",
                },
              ].map((item) => (
                <Card key={item.title} className="p-8 bg-card border-border/50 text-center">
                  <item.icon className="w-14 h-14 text-primary mx-auto mb-6" />
                  <h3 className="font-semibold text-foreground text-lg mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </Card>
              ))}
            </div>

            <div className="mt-16 text-center">
              <p className="text-muted-foreground mb-4">
                Join the growing community of businesses making a difference. Contact us to become a reference partner.
              </p>
              <a href="/contact" className="text-primary font-medium hover:underline">
                Get In Touch →
              </a>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
