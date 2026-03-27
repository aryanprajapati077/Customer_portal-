"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Mail, Phone, MapPin } from "lucide-react"

export default function ContactPage() {
  const [message, setMessage] = useState("")

  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <section className="pt-28 pb-16 sm:pt-32 sm:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">Get In Touch</h1>
            <p className="text-muted-foreground">We're here to answer your questions and explore how we can work together.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="lg:col-span-1 space-y-6">
              <Card className="p-6 bg-card border-border/50">
                <CardHeader className="p-0 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Address</h3>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="text-muted-foreground">
                    Village-Kuha, Ahmedabad-Indore Hwy, Kuha, Ahmedabad, Gujarat, India- 382433
                  </p>
                </CardContent>
              </Card>

              <Card className="p-6 bg-card border-border/50">
                <CardHeader className="p-0 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Phone</h3>
                </CardHeader>
                <CardContent className="p-0">
                  <a href="tel:+919512120366" className="text-muted-foreground hover:text-primary transition-colors">
                    Mobile: +91-9512120366
                  </a>
                </CardContent>
              </Card>

              <Card className="p-6 bg-card border-border/50">
                <CardHeader className="p-0 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Email</h3>
                </CardHeader>
                <CardContent className="p-0">
                  <a
                    href="mailto:campaign@buffindia.com"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    campaign@buffindia.com
                  </a>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card className="p-6 sm:p-8 bg-card border-border/50">
                <CardHeader className="p-0 mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Send Us a Message</h2>
                  <p className="text-muted-foreground">
                    We're here to answer your questions and explore how we can work together.
                  </p>
                </CardHeader>
                <CardContent className="p-0">
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" placeholder="Your name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="your@email.com" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input id="subject" placeholder="Subject" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Your message..."
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                    </div>
                    <Button type="submit" size="lg" className="rounded-full px-8">
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
