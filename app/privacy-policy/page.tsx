import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy | BuffIndia",
  description: "BuffIndia Receptacles Private Limited Privacy Policy. How we collect, use, and protect your personal information.",
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <section className="pt-28 pb-16 sm:pt-32 sm:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">
            Home / Privacy Policy
          </Link>

          <h1 className="text-4xl font-bold tracking-tight mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">
            BuffIndia Receptacles Private Limited · Ahmedabad Jurisdiction · Effective Date: 1-1-2025
          </p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                BuffIndia Receptacles Private Limited (&quot;we,&quot; &quot;our,&quot; &quot;us&quot;) is committed to
                protecting the privacy of visitors to our website and ensuring the security of any personal information
                you share with us. This Privacy Policy outlines how we collect, use, disclose, and safeguard your
                information when you visit our website.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">1. Information We Collect</h2>
              <p className="text-muted-foreground mb-4">We collect the following types of information:</p>
              <h3 className="text-lg font-medium text-foreground mb-2">1.1 Personal Information</h3>
              <p className="text-muted-foreground mb-4">
                When you interact with our website, you may voluntarily provide personal details, such as:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-4">
                <li>Payment information (for purchases)</li>
                <li>Address</li>
                <li>Phone number</li>
                <li>Email address</li>
                <li>Name</li>
              </ul>
              <h3 className="text-lg font-medium text-foreground mb-2">1.2 Non-Personal Information</h3>
              <p className="text-muted-foreground mb-2">
                We may also collect non-personal data automatically, including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Cookies and other tracking technologies</li>
                <li>Time spent on our website</li>
                <li>Pages visited</li>
                <li>IP address</li>
                <li>Browser type and version</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">2. How We Use Your Information</h2>
              <p className="text-muted-foreground mb-4">We use the collected information for the following purposes:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>To comply with legal and regulatory requirements.</li>
                <li>To analyze website performance and enhance user experience.</li>
                <li>To send you updates, newsletters, and promotional materials, subject to your consent.</li>
                <li>To provide personalized experiences and improve our website functionality.</li>
                <li>To process your inquiries, purchases, and transactions.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">3. How We Share Your Information</h2>
              <p className="text-muted-foreground mb-4">
                We do not sell or share your personal information with third parties except in the following cases:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>
                  <strong>Business Transfers:</strong> In case of mergers, acquisitions, or sale of assets, your
                  information may be transferred.
                </li>
                <li>
                  <strong>Legal Compliance:</strong> When required by law or to protect the rights, property, or safety
                  of BuffIndia Receptacles Private Limited or others.
                </li>
                <li>
                  <strong>Service Providers:</strong> Trusted partners who assist us in operating our website or
                  providing services (e.g., payment processors).
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">4. Cookies and Tracking Technologies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar tracking technologies to enhance your browsing experience. By using our
                website, you consent to the use of cookies. You can manage or disable cookies in your browser settings;
                however, some website features may not function properly without cookies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">5. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement industry-standard security measures to protect your personal information. However, no
                method of transmission over the internet or electronic storage is 100% secure. While we strive to use
                acceptable means to protect your data, we cannot guarantee its absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">6. Your Rights</h2>
              <p className="text-muted-foreground mb-4">
                As a user, you have the following rights regarding your personal data:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Restrict or object to certain processing of your data.</li>
                <li>Opt-out of receiving marketing communications by following the unsubscribe link in emails</li>
                <li>Request deletion of your personal information, subject to applicable laws.</li>
                <li>Access, correct, or update your personal information.</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                To exercise your rights, please contact us at{" "}
                <a href="mailto:campaign@buffindia.com" className="text-primary hover:underline">
                  campaign@buffindia.com
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">7. Links to Third-Party Websites</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our website may contain links to third-party websites. We are not responsible for the privacy practices
                of these external sites and encourage you to read their privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">8. Jurisdiction and Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                This Privacy Policy is governed by the laws of India and falls under the jurisdiction of Ahmedabad.
                Any disputes arising out of this policy will be subject to the exclusive jurisdiction of courts in
                Ahmedabad.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">9. Updates to This Privacy Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy periodically. Any changes will be posted on this page with an updated
                effective date. We encourage you to review this page regularly for any updates.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">10. Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                If you have any questions or concerns regarding this Privacy Policy, please contact us at:
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
