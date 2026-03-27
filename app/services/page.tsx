import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Package,
  Megaphone,
  Truck,
  Recycle,
  Palette,
  Gift,
  BarChart3,
  Users,
  Building2,
  ArrowRight,
} from "lucide-react"

const services = [
  {
    icon: Package,
    title: "Seamless Installation of Unique Disposal Units",
    description:
      "Our innovative cigarette waste disposal units are installed at your premises on an annual rental basis. Designed for convenience and sustainability, these units encourage thoughtful waste disposal habits.",
  },
  {
    icon: Megaphone,
    title: "Building Awareness for Sustainable Habits",
    description:
      "We conduct impactful awareness activities at your location, inspiring patrons and employees to adopt responsible cigarette waste disposal habits. Together, we can drive habitual transformation for a cleaner future.",
  },
  {
    icon: Truck,
    title: "Hassle-Free Waste Collection Services",
    description:
      "Our team ensures timely and efficient door-to-door collection of cigarette waste, allowing you to focus on your business while contributing to sustainability.",
  },
  {
    icon: Recycle,
    title: "BuffIndia Recycle Process",
    description:
      "BuffIndia&apos;s innovative recycle process transforms cigarette waste into eco-friendly products. It's an impactful step towards sustainability.",
  },
  {
    icon: Palette,
    title: "Turning Waste into Wonders – Eco-Art by BuffIndia",
    description:
      "Collected cigarette waste is upcycled into stunning eco-friendly decor and gifting items. These sustainable products not only reduce waste but also create value for your business.",
  },
  {
    icon: Gift,
    title: "Sustainability Delivered, At No Extra Cost",
    description:
      "Receive upcycled products customized with your branding, logo, and sustainability message – perfect for interior decor or gifting, all at no additional cost.",
  },
  {
    icon: BarChart3,
    title: "Data-Driven Impact Insights",
    description:
      "Stay informed with monthly reports detailing your waste management contributions, environmental benefits, and the social impact of your support for BuffIndia's mission.",
  },
  {
    icon: Users,
    title: "Empowering Communities Through Sustainability",
    description:
      "Your partnership supports livelihoods for students, unskilled labor, and stay-at-home mothers. Together, we create a positive ripple effect in society.",
  },
  {
    icon: Building2,
    title: "A Trusted Partner in Sustainability",
    description:
      "BuffIndia is proud to be supported by major Fortune 500 corporates, premium hotels, and renowned establishments across India. Join the growing community of businesses making a difference.",
  },
]

export const metadata: Metadata = {
  title: "Services | BuffIndia – End-to-End Cigarette Waste Management",
  description:
    "From innovative disposal to upcycling, BuffIndia creates a win-win solution for your business and the planet. Annual rental, awareness programs, collection & recycling.",
}

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <section className="pt-28 pb-16 sm:pt-32 sm:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              <span className="text-foreground">Redefining Sustainability: </span>
              <span className="text-gradient-orange">End-to-End Cigarette Waste Management</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              From innovative disposal to upcycling, BuffIndia creates a win-win solution for your business and the
              planet.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {services.map((service, index) => (
              <Card
                key={service.title}
                className="p-6 bg-card border-border/50 hover-lift group"
              >
                <CardHeader className="p-0 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <service.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{service.title}</h3>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="text-muted-foreground leading-relaxed">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <p className="text-xl font-semibold text-foreground mb-6">Be the Change You Want to See</p>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Take the first step towards a sustainable future. Contact BuffIndia today to explore our annual service
              packages and join the movement for a cleaner, greener planet.
            </p>
            <Link href="/contact">
              <Button size="lg" className="rounded-full px-8">
                Contact Us Today
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
