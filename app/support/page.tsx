"use client"

import { useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { useAuth } from "@/lib/auth-context"
import { SUPPORT_FAQ, SUPPORT_CONTACT, SUPPORT_TOPICS } from "@/lib/support-knowledge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  MessageCircle,
  Mail,
  Phone,
  Clock,
  MapPin,
  Loader2,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  FileText,
  ShoppingBag,
  KeyRound,
} from "lucide-react"

const issueCards = [
  {
    icon: KeyRound,
    title: "Can't sign in",
    desc: "Reset password with OTP or contact your account manager for credentials.",
    href: "/forgot-password",
  },
  {
    icon: ShoppingBag,
    title: "Shop & orders",
    desc: "Credits apply at completion. Track pending orders on your dashboard.",
    href: "/dashboard/shop",
  },
  {
    icon: FileText,
    title: "Reports & certificates",
    desc: "Refresh dashboard data, then download ESG reports and certificates.",
    href: "/dashboard",
  },
]

export default function SupportPage() {
  const { customer } = useAuth()
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [email, setEmail] = useState(customer?.email || "")
  const [name, setName] = useState(customer?.contactPerson || customer?.companyName || "")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSending(true)
    try {
      const res = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          message,
          email,
          name,
          customerId: customer?.id,
          category: "general",
          source: "support-page",
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to submit")
      setSent(true)
      setSubject("")
      setMessage("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-28 pb-12 sm:pt-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-4">
              <HelpCircle className="w-7 h-7" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">Support Center</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Find answers to common portal issues, browse FAQs, or submit a ticket — our team responds within 1 business day.
            </p>
            {!customer && (
              <p className="mt-4 text-sm">
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>{" "}
                for faster support with your account details pre-filled.
              </p>
            )}
          </div>

          {/* Common issues */}
          <div className="grid sm:grid-cols-3 gap-4 mb-12">
            {issueCards.map((card) => (
              <Link key={card.title} href={card.href}>
                <Card className="h-full hover:border-primary/40 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <card.icon className="w-8 h-8 text-primary mb-2" />
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                    <CardDescription>{card.desc}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* FAQ */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Frequently asked questions</CardTitle>
                  <CardDescription>Issues customers most often run into on the portal</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {SUPPORT_FAQ.map((faq, i) => (
                      <AccordionItem key={faq.category} value={`faq-${i}`}>
                        <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground space-y-3">
                          <p>{faq.answer}</p>
                          {faq.links && faq.links.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {faq.links.map((link) => (
                                <Link
                                  key={link.href}
                                  href={link.href}
                                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                >
                                  {link.label}
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              ))}
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>

              {/* Topic grid */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-base">Browse by topic</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {SUPPORT_TOPICS.map((t) => (
                      <span
                        key={t.id}
                        className="text-sm px-3 py-1.5 rounded-full bg-muted/60 border border-border/50"
                      >
                        {t.icon} {t.label}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Use the{" "}
                    <span className="inline-flex items-center gap-1 font-medium text-foreground">
                      <MessageCircle className="w-4 h-4 text-primary" /> Help chat
                    </span>{" "}
                    button at the bottom-right of any page for instant answers.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Contact + ticket */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact us</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <a href={`tel:${SUPPORT_CONTACT.phone.replace(/-/g, "")}`} className="flex items-start gap-3 hover:text-primary transition-colors">
                    <Phone className="w-5 h-5 shrink-0 text-primary mt-0.5" />
                    <span>{SUPPORT_CONTACT.phone}</span>
                  </a>
                  <a href={`mailto:${SUPPORT_CONTACT.email}`} className="flex items-start gap-3 hover:text-primary transition-colors">
                    <Mail className="w-5 h-5 shrink-0 text-primary mt-0.5" />
                    <span>{SUPPORT_CONTACT.email}</span>
                  </a>
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <Clock className="w-5 h-5 shrink-0 text-primary mt-0.5" />
                    <span>{SUPPORT_CONTACT.hours}</span>
                  </div>
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <MapPin className="w-5 h-5 shrink-0 text-primary mt-0.5" />
                    <span>{SUPPORT_CONTACT.address}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Submit a ticket</CardTitle>
                  <CardDescription>We'll email you back at the address below</CardDescription>
                </CardHeader>
                <CardContent>
                  {sent ? (
                    <div className="flex flex-col items-center text-center py-6 gap-3">
                      <CheckCircle2 className="w-12 h-12 text-green-600" />
                      <p className="font-medium">Ticket submitted!</p>
                      <p className="text-sm text-muted-foreground">We'll reply within 1 business day.</p>
                      <Button variant="outline" size="sm" onClick={() => setSent(false)}>
                        Submit another
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="support-name">Name</Label>
                        <Input
                          id="support-name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          placeholder="Your name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="support-email">Email</Label>
                        <Input
                          id="support-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          placeholder="you@company.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="support-subject">Subject</Label>
                        <Input
                          id="support-subject"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          required
                          placeholder="What do you need help with?"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="support-message">Message</Label>
                        <Textarea
                          id="support-message"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          required
                          rows={4}
                          placeholder="Describe your issue in detail..."
                        />
                      </div>
                      {error && <p className="text-sm text-destructive">{error}</p>}
                      <Button type="submit" className="w-full" disabled={sending}>
                        {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Send ticket
                      </Button>
                    </form>
                  )}
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
