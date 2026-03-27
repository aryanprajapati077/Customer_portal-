import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Sparkles, DollarSign, Users, Package, ArrowRight } from "lucide-react"

const features = [
  {
    icon: DollarSign,
    title: "Budget-Friendly",
    description: "Sustainable products that don't compromise on affordability.",
  },
  {
    icon: Users,
    title: "Empowering Women",
    description: "Products are handcrafted by stay-at-home mothers, supporting women's empowerment.",
  },
  {
    icon: Package,
    title: "Customized Branding & Packaging",
    description: "Perfect for gifting, with your branding, logo, and a sustainability story included.",
  },
  {
    icon: Sparkles,
    title: "Eco-Friendly & Handcrafted",
    description: "Each product is crafted with care using recycled cigarette waste fibers and natural materials.",
  },
]

const useCases = [
  "Celebrating special occasions with thoughtful, eco-friendly items.",
  "Personalized corporate gifting with a sustainability message.",
  "Sustainable home and office decor",
]

const benefits = [
  "Aligning with sustainability goals while saving on costs.",
  "Empowering women artisans and fostering livelihood opportunities.",
  "Supporting waste management and recycling initiatives.",
]

export const metadata: Metadata = {
  title: "Products | EcoArt by BuffIndia – Sustainable Decor & Gifting",
  description:
    "World's first e-commerce store for sustainable decor & gifting. Handcrafted from recycled cigarette waste. Budget-friendly, eco-friendly products.",
}

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <section className="pt-28 pb-16 sm:pt-32 sm:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              <span className="text-foreground">EcoArt by BuffIndia: </span>
              <span className="text-gradient-orange">World's First E-Commerce Store for Sustainable Decor & Gifting</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Handcrafted from recycled cigarette waste, our eco-friendly products are budget-friendly and purposeful
            </p>
          </div>

          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-2xl font-bold text-foreground mb-8 text-center">What Sets EcoArt Apart</h2>
            <p className="text-center text-muted-foreground mb-12 text-lg">Sustainability Meets Craftsmanship</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} className="p-6 bg-card border-border/50 hover-lift">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm">{feature.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Why Choose EcoArt?</h2>
            <p className="text-center text-muted-foreground mb-8 text-lg">
              Purposeful Decor & Gifts for Every Occasion
            </p>
            <p className="text-muted-foreground mb-4">EcoArt products are perfect for:</p>
            <ul className="space-y-2 mb-12">
              {useCases.map((item) => (
                <li key={item} className="flex items-center gap-2 text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-6 text-center">The Bigger Picture – More Than Just Products</h3>
            <p className="text-muted-foreground mb-4">By choosing EcoArt, you're making a difference:</p>
            <ul className="space-y-2 mb-12">
              {benefits.map((item) => (
                <li key={item} className="flex items-center gap-2 text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Explore the Collection</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Discover Unique Creations, Crafted with Purpose. Browse our wide range of sustainable decor and gifting
              items. While this page offers a glimpse of what we create, the full collection is available on our
              e-commerce store.
            </p>
            <a href="https://ecoart.buffindia.com" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="rounded-full px-8">
                Shop Now
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </a>
            <p className="text-sm text-muted-foreground mt-6">Support Sustainability – Shop BuffIndia Products Today!</p>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
