"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { InspirePage, InspireCard } from "@/components/marketing/inspire-page"

const sections: { title: string; body: ReactNode }[] = [
  {
    title: "1. Acceptance of Terms",
    body: (
      <p>
        By accessing and using the BuffIndia website, digital portals, partner forms, and services, you agree to be bound
        by these Terms of Service. If you do not agree with any part of these terms, please do not use our website or
        services. If you accept on behalf of an organization, you represent that you have authority to bind that
        organization.
      </p>
    ),
  },
  {
    title: "2. About BuffIndia",
    body: (
      <p>
        BuffIndia Receptacles Private Limited provides end-to-end cigarette waste management in India, including disposal
        unit installation, awareness activities, door-to-door collection, recycling, impact reporting, and related KraftReborn
        / upcycled product offerings. Descriptions on marketing pages are for general information; specific commercial
        terms are set out in quotations, proposals, or service agreements.
      </p>
    ),
  },
  {
    title: "3. Use of Website & Services",
    body: (
      <>
        <p className="mb-4">
          You agree to use our website and services only for lawful purposes and in accordance with applicable laws and
          regulations. You must not:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Attempt to gain unauthorized access to systems, accounts, or data</li>
          <li>Interfere with or disrupt the website, portal, or collection operations</li>
          <li>Misrepresent your identity or affiliation when contacting us or applying as a partner</li>
          <li>Use our content, marks, or materials in a misleading or infringing manner</li>
        </ul>
      </>
    ),
  },
  {
    title: "4. Service Agreements & Equipment",
    body: (
      <p>
        Disposal units and related equipment provided on a rental or service basis remain the property of BuffIndia unless
        otherwise agreed in writing. Customers are responsible for reasonable care of units on their premises, providing
        safe access for installation and collection, and complying with site-specific obligations in their service
        agreement. Fees, term length, renewal, and deliverables (including branded KraftReborn where applicable) are governed
        by the applicable commercial contract.
      </p>
    ),
  },
  {
    title: "5. Partner & Affiliate Program",
    body: (
      <p>
        Participation in the BuffIndia Affiliate Partner Program is subject to acceptance, training requirements, and
        program rules communicated at onboarding. Commissions and benefits apply only to qualified leads that convert
        according to our then-current partner terms. We may modify or discontinue the program with reasonable notice.
      </p>
    ),
  },
  {
    title: "6. KraftReborn Products & Purchases",
    body: (
      <p>
        Product descriptions on this site are illustrative. Purchases made via KraftReborn or other storefronts may be subject
        to separate checkout terms, shipping policies, and refund rules of that storefront. Custom branding requests
        depend on artwork quality, lead times, and confirmation by our team.
      </p>
    ),
  },
  {
    title: "7. Accounts & Customer Portal",
    body: (
      <p>
        Where we provide login credentials for a customer portal or dashboard, you are responsible for maintaining the
        confidentiality of your credentials and for activity under your account. Notify us promptly of any unauthorized
        use. We may suspend access to protect security or for breach of these terms or your service agreement.
      </p>
    ),
  },
  {
    title: "8. Intellectual Property",
    body: (
      <p>
        All content on this website, including text, graphics, logos, images, and process descriptions, is the property of
        BuffIndia Receptacles Private Limited or its licensors and is protected by intellectual property laws. You may not
        reproduce, distribute, or use our content without prior written permission, except for fair personal,
        non-commercial viewing of the site.
      </p>
    ),
  },
  {
    title: "9. Impact Metrics & Disclaimers",
    body: (
      <p>
        Environmental and social impact figures (including estimates of cigarette butts, water protected, or upcycled
        material) are based on operational data and published or industry-referenced conversion factors. They are provided
        for informational and reporting purposes and are not guarantees of specific regulatory outcomes. Website content is
        provided &quot;as is&quot; without warranties of any kind to the fullest extent permitted by law.
      </p>
    ),
  },
  {
    title: "10. Limitation of Liability",
    body: (
      <p>
        To the maximum extent permitted by law, BuffIndia shall not be liable for any indirect, incidental, special, or
        consequential damages arising from your use of our website or services. Our aggregate liability arising out of
        website use shall be limited as permitted by applicable law; liability under a signed service agreement is
        governed by that agreement.
      </p>
    ),
  },
  {
    title: "11. Indemnification",
    body: (
      <p>
        You agree to indemnify and hold harmless BuffIndia Receptacles Private Limited and its officers, employees, and
        agents from claims arising out of your misuse of the website, violation of these terms, or infringement of any
        rights of a third party, to the extent permitted by law.
      </p>
    ),
  },
  {
    title: "12. Termination",
    body: (
      <p>
        We may suspend or terminate access to the website or related digital services if you breach these terms or for
        operational or legal reasons. Provisions that by their nature should survive (including intellectual property,
        limitation of liability, and governing law) will survive termination.
      </p>
    ),
  },
  {
    title: "13. Changes to These Terms",
    body: (
      <p>
        We may update these Terms of Service from time to time. Changes will be posted on this page with an updated
        effective date. Continued use of the website after changes constitutes acceptance of the revised terms.
      </p>
    ),
  },
  {
    title: "14. Governing Law",
    body: (
      <p>
        These Terms of Service are governed by the laws of India and fall under the jurisdiction of Ahmedabad. Any
        disputes shall be subject to the exclusive jurisdiction of courts in Ahmedabad.
      </p>
    ),
  },
  {
    title: "15. Contact Us",
    body: (
      <>
        <p className="mb-4">For questions regarding these Terms of Service, please contact:</p>
        <p className="font-medium text-[#141414]">BuffIndia Receptacles Private Limited</p>
        <p>
          Email:{" "}
          <a href="mailto:campaign@buffindia.com" className="font-medium text-[#1B7339] hover:underline">
            campaign@buffindia.com
          </a>
        </p>
        <p>Phone: +91 9512120366</p>
        <p className="mt-2">Village-Kuha, Ahmedabad-Indore Hwy, Kuha, Ahmedabad, Gujarat, India- 382433</p>
        <p className="mt-6">
          Related:{" "}
          <Link href="/privacy-policy" className="font-medium text-[#1B7339] hover:underline">
            Privacy Policy
          </Link>
          {" · "}
          <Link href="/contact" className="font-medium text-[#1B7339] hover:underline">
            Contact Us
          </Link>
          {" · "}
          <Link href="/services" className="font-medium text-[#1B7339] hover:underline">
            Our Services
          </Link>
        </p>
      </>
    ),
  },
]

export default function TermsOfServicePage() {
  return (
    <InspirePage
      eyebrow="Legal"
      title="Terms of"
      accent="Service"
      subtitle="BuffIndia Receptacles Private Limited · Ahmedabad Jurisdiction · Effective Date: 1-1-2025"
    >
      <div className="mx-auto max-w-3xl space-y-4">
        {sections.map((section, i) => (
          <InspireCard key={section.title} delay={Math.min(i * 0.03, 0.24)}>
            <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.25rem,2.5vw,1.5rem)] tracking-tight text-[#141414]">
              {section.title}
            </h2>
            <div className="mt-3 space-y-2 text-[14px] leading-relaxed text-[#5A5A5A]">{section.body}</div>
          </InspireCard>
        ))}
      </div>
    </InspirePage>
  )
}
