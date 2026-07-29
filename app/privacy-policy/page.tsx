"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { InspirePage, InspireCard } from "@/components/marketing/inspire-page"

const sections: { title: string; body: ReactNode }[] = [
  {
    title: "Introduction",
    body: (
      <p>
        BuffIndia Receptacles Private Limited (&quot;we,&quot; &quot;our,&quot; &quot;us&quot;) is committed to
        protecting the privacy of visitors to our website, customers of our cigarette waste management services, and
        users of related portals. This Privacy Policy outlines how we collect, use, disclose, and safeguard your
        information when you visit our website, submit inquiry or partner forms, purchase KraftReborn products, or access
        customer-facing digital services.
      </p>
    ),
  },
  {
    title: "1. Information We Collect",
    body: (
      <>
        <p className="mb-4">We collect the following types of information:</p>
        <h3 className="mb-2 text-[15px] font-semibold text-[#141414]">1.1 Personal Information</h3>
        <p className="mb-4">
          When you interact with our website or services, you may voluntarily provide personal details, such as:
        </p>
        <ul className="mb-4 list-disc space-y-1 pl-5">
          <li>Name and organization / company name</li>
          <li>Email address and phone number</li>
          <li>Billing or shipping address</li>
          <li>Payment information (for purchases, processed via trusted providers)</li>
          <li>Messages, support tickets, and partner program application details</li>
        </ul>
        <h3 className="mb-2 text-[15px] font-semibold text-[#141414]">1.2 Service &amp; Account Information</h3>
        <p className="mb-4">
          For contracted customers, we may process operational data related to waste collection, site locations, impact
          metrics, certificates, and portal account credentials as needed to deliver our services.
        </p>
        <h3 className="mb-2 text-[15px] font-semibold text-[#141414]">1.3 Non-Personal Information</h3>
        <p className="mb-2">We may also collect non-personal data automatically, including:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Cookies and other tracking technologies</li>
          <li>Time spent on our website</li>
          <li>Pages visited and referral sources</li>
          <li>IP address</li>
          <li>Browser type and version, device type</li>
        </ul>
      </>
    ),
  },
  {
    title: "2. How We Use Your Information",
    body: (
      <>
        <p className="mb-4">We use the collected information for the following purposes:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>To process inquiries, purchases, partner applications, and service onboarding.</li>
          <li>To provide, operate, and improve our website, customer portal, and related features.</li>
          <li>To deliver waste collection services, impact reporting, certificates, and KraftReborn fulfilment.</li>
          <li>To send updates, newsletters, and promotional materials, subject to your consent.</li>
          <li>To analyze website performance and enhance user experience.</li>
          <li>To comply with legal and regulatory requirements.</li>
        </ul>
      </>
    ),
  },
  {
    title: "3. How We Share Your Information",
    body: (
      <>
        <p className="mb-4">
          We do not sell your personal information. We may share information only in the following cases:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-[#141414]">Service Providers:</strong> Trusted partners who assist us in operating
            our website, payments, logistics, communications, or hosting (bound by confidentiality obligations).
          </li>
          <li>
            <strong className="text-[#141414]">Legal Compliance:</strong> When required by law or to protect the rights,
            property, or safety of BuffIndia Receptacles Private Limited or others.
          </li>
          <li>
            <strong className="text-[#141414]">Business Transfers:</strong> In case of mergers, acquisitions, or sale of
            assets, your information may be transferred as part of that transaction.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "4. Cookies and Tracking Technologies",
    body: (
      <p>
        We use cookies and similar tracking technologies to enhance your browsing experience, remember preferences, and
        understand how our site is used. By using our website, you consent to the use of cookies where permitted. You
        can manage or disable cookies in your browser settings; however, some website features may not function properly
        without cookies.
      </p>
    ),
  },
  {
    title: "5. Data Security",
    body: (
      <p>
        We implement industry-standard security measures to protect your personal information. However, no method of
        transmission over the internet or electronic storage is 100% secure. While we strive to use acceptable means to
        protect your data, we cannot guarantee its absolute security.
      </p>
    ),
  },
  {
    title: "6. Data Retention",
    body: (
      <p>
        We retain personal information only as long as necessary for the purposes described in this policy, including to
        provide services, comply with legal obligations, resolve disputes, and enforce agreements. Retention periods may
        vary depending on the nature of the data and applicable law. When information is no longer needed, we take
        reasonable steps to delete or anonymize it.
      </p>
    ),
  },
  {
    title: "7. Your Rights",
    body: (
      <>
        <p className="mb-4">
          As a user, you have the following rights regarding your personal data, subject to applicable Indian law
          (including the Digital Personal Data Protection Act, 2023, where applicable):
        </p>
        <ul className="mb-4 list-disc space-y-1 pl-5">
          <li>Access, correct, or update your personal information.</li>
          <li>Request deletion of your personal information, subject to applicable laws and retention needs.</li>
          <li>Opt out of receiving marketing communications by following the unsubscribe link in emails.</li>
          <li>Restrict or object to certain processing of your data where legally available.</li>
        </ul>
        <p>
          To exercise your rights, please contact us at{" "}
          <a href="mailto:campaign@buffindia.com" className="font-medium text-[#1B7339] hover:underline">
            campaign@buffindia.com
          </a>
          .
        </p>
      </>
    ),
  },
  {
    title: "8. Children's Privacy",
    body: (
      <p>
        Our website and services are not directed to children under 18. We do not knowingly collect personal information
        from children. If you believe a child has provided us with personal data, please contact us so we can take
        appropriate steps to delete it.
      </p>
    ),
  },
  {
    title: "9. Links to Third-Party Websites",
    body: (
      <p>
        Our website may contain links to third-party websites (including KraftReborn storefronts and partner signup forms). We
        are not responsible for the privacy practices of these external sites and encourage you to read their privacy
        policies.
      </p>
    ),
  },
  {
    title: "10. Jurisdiction and Governing Law",
    body: (
      <p>
        This Privacy Policy is governed by the laws of India and falls under the jurisdiction of Ahmedabad. Any disputes
        arising out of this policy will be subject to the exclusive jurisdiction of courts in Ahmedabad.
      </p>
    ),
  },
  {
    title: "11. Updates to This Privacy Policy",
    body: (
      <p>
        We may update this Privacy Policy periodically. Any changes will be posted on this page with an updated effective
        date. We encourage you to review this page regularly for any updates.
      </p>
    ),
  },
  {
    title: "12. Contact Us",
    body: (
      <>
        <p className="mb-4">If you have any questions or concerns regarding this Privacy Policy, please contact us at:</p>
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
          <Link href="/terms-of-service" className="font-medium text-[#1B7339] hover:underline">
            Terms of Service
          </Link>
          {" · "}
          <Link href="/contact" className="font-medium text-[#1B7339] hover:underline">
            Contact Us
          </Link>
        </p>
      </>
    ),
  },
]

export default function PrivacyPolicyPage() {
  return (
    <InspirePage
      eyebrow="Legal"
      title="Privacy"
      accent="Policy"
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
