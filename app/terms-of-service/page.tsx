import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Service | BuffIndia",
  description: "BuffIndia Receptacles Private Limited Terms of Service. Terms and conditions for using our website and services.",
}

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <section className="pt-28 pb-16 sm:pt-32 sm:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">
            Home / Terms of Service
          </Link>

          <h1 className="text-4xl font-bold tracking-tight mb-2">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">
            BuffIndia Receptacles Private Limited · Ahmedabad Jurisdiction · Effective Date: 1-1-2025
          </p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using the BuffIndia website and services, you agree to be bound by these Terms of
                Service. If you do not agree with any part of these terms, please do not use our website or services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">2. Use of Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our cigarette waste management services, including disposal unit installation, collection, and recycling,
                are provided subject to these terms. You agree to use our services only for lawful purposes and in
                accordance with applicable laws and regulations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">3. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                All content on this website, including text, graphics, logos, and images, is the property of BuffIndia
                Receptacles Private Limited and is protected by intellectual property laws. You may not reproduce,
                distribute, or use our content without prior written permission.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">4. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                BuffIndia shall not be liable for any indirect, incidental, special, or consequential damages arising
                from your use of our website or services. Our liability is limited to the maximum extent permitted by
                law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">5. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms of Service are governed by the laws of India and fall under the jurisdiction of Ahmedabad.
                Any disputes shall be subject to the exclusive jurisdiction of courts in Ahmedabad.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">6. Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                For questions regarding these Terms of Service, please contact:
              </p>
              <p className="text-foreground font-medium">BuffIndia Receptacles Private Limited</p>
              <p className="text-muted-foreground">
                Email:{" "}
                <a href="mailto:campaign@buffindia.com" className="text-primary hover:underline">
                  campaign@buffindia.com
                </a>
              </p>
              <p className="text-muted-foreground">Phone: +91 9512120366</p>
            </section>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
