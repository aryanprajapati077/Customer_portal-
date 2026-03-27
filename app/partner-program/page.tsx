import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Users, Award, Gift, TrendingUp, Target, ArrowRight, CheckCircle2 } from "lucide-react"

export const metadata: Metadata = {
  title: "Partner Program | BuffIndia – Become an Affiliate Partner",
  description:
    "Join the BuffIndia Affiliate Partner Program. Spread awareness, earn commissions, and drive nationwide sustainability. Sign up today.",
}

export default function PartnerProgramPage() {
  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <section className="pt-28 pb-16 sm:pt-32 sm:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">
            Home / Partner Program
          </Link>

          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Partner with BuffIndia
            </h1>
            <h2 className="text-2xl font-semibold text-muted-foreground mb-8">
              Join the Movement for a Cleaner, Greener India
            </h2>
            <h3 className="text-xl font-semibold text-primary mb-6">Become a BuffIndia Affiliate Partner Today!</h3>
            <p className="text-muted-foreground mb-8">
              Together, let&apos;s create awareness, transform waste, and drive nationwide sustainability.
            </p>
            <a href="https://form.jotform.com/250602909519459" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="rounded-full px-8">
                Sign Up Now
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </a>
          </div>

          <div className="max-w-4xl mx-auto space-y-16">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Why Partner with BuffIndia?</h2>
              <p className="text-center text-muted-foreground mb-8">Make an Impact in Your Community</p>
              <p className="text-muted-foreground text-center mb-8">
                As a BuffIndia Affiliate Partner, you&apos;ll play a crucial role in spreading awareness about cigarette
                waste management while empowering your community to adopt sustainable practices. Here&apos;s how you can
                help:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  "Promote Transformation: Inspire businesses and individuals to adopt sustainable solutions.",
                  "Expand Our Reach: Introduce BuffIndia's solutions to hotels, corporates, bars, restaurants, cafes, and more.",
                  "Raise Awareness: Advocate for responsible cigarette waste disposal in your network.",
                ].map((item) => (
                  <Card key={item} className="p-6 bg-card border-border/50">
                    <CheckCircle2 className="w-8 h-8 text-primary mb-4" />
                    <p className="text-muted-foreground">{item}</p>
                  </Card>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Affiliate Partner Benefits</h2>
              <p className="text-center text-muted-foreground mb-8">Make an Impact in Your Community</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { icon: Target, text: "Exclusive Training: Weekly onboarding sessions and support to help you succeed." },
                  { icon: TrendingUp, text: "Real-Time Updates: Stay informed about the progress of leads you provide." },
                  { icon: Award, text: "Certification of Affiliation: Official recognition of your commitment to sustainability." },
                  { icon: Gift, text: "Complimentary Products: Free vouchers for BuffIndia's upcycled sustainable decor and gifting." },
                  { icon: Users, text: "Financial Rewards: Earn commissions for every lead that converts into a client." },
                ].map((item) => (
                  <Card key={item.text} className="p-6 bg-card border-border/50">
                    <item.icon className="w-8 h-8 text-primary mb-4" />
                    <p className="text-muted-foreground">{item.text}</p>
                  </Card>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-6 text-center">How It Works</h2>
              <p className="text-center text-muted-foreground mb-8">Becoming a Partner Is Simple</p>
              <div className="flex flex-col md:flex-row gap-6 justify-center items-stretch">
                {[
                  { step: "1", title: "Sign Up", desc: "Express your interest by contacting us via the form below." },
                  { step: "2", title: "Promote", desc: "Use BuffIndia's video content and resources to raise awareness in your local area." },
                  { step: "3", title: "Source Leads", desc: "Share the details of potential clients with our sales team." },
                  { step: "4", title: "Earn Rewards", desc: "Receive commissions and exclusive perks for every successful lead conversion." },
                ].map((item) => (
                  <Card key={item.step} className="p-6 bg-card border-border/50 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold mb-4">
                      {item.step}
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.desc}</p>
                  </Card>
                ))}
              </div>
              <div className="text-center mt-8">
                <a href="https://form.jotform.com/250602909519459" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="rounded-full px-8">
                    Sign Up as a Partner
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </a>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Who Can Join</h2>
              <p className="text-center text-muted-foreground mb-8">Calling All Change-Makers!</p>
              <p className="text-muted-foreground text-center mb-6">
                We&apos;re looking for individuals and organizations who share our vision for a cleaner, greener India:
              </p>
              <ul className="space-y-3 max-w-md mx-auto">
                {[
                  "Organizations & Individuals passionate about environmental impact",
                  "Facility Management Service Providers catering to businesses",
                  "NGOs with a focus on sustainability",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <Card className="p-8 sm:p-12 bg-primary/5 border-primary/20">
                <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Highlighting Impact</h2>
                <p className="text-center text-muted-foreground mb-8">
                  Together, We&apos;ve Already Made a Difference
                </p>
                <p className="text-muted-foreground text-center mb-8">
                  Join a growing community of partners who are transforming cigarette waste management across India.
                  Here&apos;s what we&apos;ve accomplished so far:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  {[
                    { value: "22", label: "States Engaged" },
                    { value: "84+", label: "Cities Reached" },
                    { value: "12,000+", label: "Businesses Engaged" },
                    { value: "12", label: "Affiliated Partners" },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <div className="text-3xl font-bold text-primary">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <p className="text-center text-muted-foreground mt-8">
                  Be part of this incredible journey and contribute to even greater impact!
                </p>
              </Card>
            </section>

            <section className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-4">Get Started</h2>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join the BuffIndia Partner Program Today. Take the first step towards becoming a BuffIndia Affiliate
                Partner. Fill out the form below to express your interest, and we&apos;ll be in touch with more details.
              </p>
              <a href="https://form.jotform.com/250602909519459" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="rounded-full px-8">
                  Sign Up Now
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </a>
            </section>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
