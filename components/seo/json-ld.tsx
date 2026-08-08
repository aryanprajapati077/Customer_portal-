import { SITE_URL } from "@/lib/site-config"

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Buffindia Receptacles Pvt. Ltd.",
  alternateName: "BuffIndia",
  url: SITE_URL,
  logo: `${SITE_URL}/report-assets/buffindia-logo-brand.png`,
  description:
    "India's first end-to-end cigarette waste management infrastructure — collection, recycling, ESG reporting, and KraftReborn circular products.",
  email: "campaign@buffindia.com",
  telephone: "+91-9512120366",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Village-Kuha, Ahmedabad-Indore Hwy, Kuha",
    addressLocality: "Ahmedabad",
    addressRegion: "Gujarat",
    postalCode: "382433",
    addressCountry: "IN",
  },
  sameAs: [
    "https://in.linkedin.com/company/buffindia",
    "https://twitter.com/buffindia",
    "https://www.instagram.com/buffindia.buttbins/",
  ],
}

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "BuffIndia",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/services?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
}

export function JsonLd() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
    </>
  )
}
