import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Award, Target, Lightbulb, TrendingUp } from "lucide-react"

export const metadata: Metadata = {
  title: "Recognitions | BuffIndia – Awards & Achievements",
  description:
    "BuffIndia's recognitions and achievements in cigarette waste management. Supported by Atal Innovation Mission, India's first end-to-end solution.",
}

export default function RecognitionsPage() {
  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <section className="pt-28 pb-16 sm:pt-32 sm:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <a href="/" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">
            Home / Recognitions
          </a>

          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">Our Recognitions</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              BuffIndia has been recognized for innovation and impact in cigarette waste management across India.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  icon: Award,
                  title: "Atal Innovation Mission",
                  desc: "BuffIndia is proud to be supported by the Atal Innovation Mission, recognizing our innovative approach to waste management.",
                },
                {
                  icon: Lightbulb,
                  title: "India's First End-to-End Solution",
                  desc: "Recognized as India's first comprehensive cigarette waste management solution, from collection to upcycling.",
                },
                {
                  icon: Target,
                  title: "Founded 2018",
                  desc: "Established in Ahmedabad with a vision for a Butt Free India. Now serving 12,000+ businesses across 23 states.",
                },
                {
                  icon: TrendingUp,
                  title: "Nationwide Impact",
                  desc: "Reaching 84+ cities, 22 states, and creating livelihoods for students, unskilled labor, and stay-at-home mothers.",
                },
              ].map((item) => (
                <Card key={item.title} className="p-8 bg-card border-border/50">
                  <item.icon className="w-12 h-12 text-primary mb-6" />
                  <h3 className="font-semibold text-foreground text-lg mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
