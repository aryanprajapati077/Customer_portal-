import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { SupporterLogos } from "@/components/supporter-logos"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Heart, Users, Leaf, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Our Valued Partners | BuffIndia – Support the Butt Free India Campaign",
  description:
    "Building a sustainable future together. BuffIndia collaborates with visionary partners across India—from leading corporates to renowned hotels—for a cleaner, greener environment.",
}

export default function SupporterPage() {
  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <section className="pt-28 pb-16 sm:pt-32 sm:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">
            Home / Our Valued Partners
          </Link>

          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
              Our <span className="text-primary">Valued Partners</span>
            </h1>
            <h2 className="text-xl font-semibold text-muted-foreground mb-4">
              Building a Sustainable Future Together
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We&apos;re proud to collaborate with visionary partners across India who share our mission for a cleaner,
              greener environment.
            </p>
          </div>

          <SupporterLogos />

          <div className="max-w-4xl mx-auto space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: Heart,
                  title: "Individual Supporters",
                  desc: "Spread awareness in your community, advocate for responsible disposal, and inspire others to join the movement.",
                },
                {
                  icon: Users,
                  title: "Organizational Support",
                  desc: "Businesses, NGOs, and institutions can support the campaign through partnerships and awareness initiatives.",
                },
                {
                  icon: Leaf,
                  title: "Campaign Advocacy",
                  desc: "Help drive the Butt Free India mission by promoting sustainable waste practices in your network.",
                },
              ].map((item) => (
                <Card key={item.title} className="p-6 bg-card border-border/50 hover-lift">
                  <item.icon className="w-12 h-12 text-primary mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </Card>
              ))}
            </div>

            <Card className="p-8 bg-primary/5 border-primary/20 text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">Partner With Us</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Join our growing network of partners. Are you passionate about sustainability and looking to create
                meaningful change? Join BuffIndia&apos;s network and contribute to a cleaner, greener India.
              </p>
              <a href="https://form.jotform.com/250602909519459" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="rounded-full px-8">
                  Become a Partner
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </a>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10 pt-10 border-t border-primary/20">
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-primary">86.4M+</div>
                  <div className="text-sm text-muted-foreground">Cigarette Butts Upcycled</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-primary">1,200+</div>
                  <div className="text-sm text-muted-foreground">Corporates & Hotel Partners</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-primary">84+</div>
                  <div className="text-sm text-muted-foreground">Cities Served Across India</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
