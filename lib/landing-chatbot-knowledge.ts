/** Website visitor FAQ — from Buffindia Website Chatbot FAQ Guide */

export const LANDING_WELCOME =
  "👋 Welcome to Buffindia! I'm here to help you with our cigarette waste management solutions. Ask about services, pricing, the impact calculator, ESG reporting, industries, or KraftReborn."

export const WHATSAPP_URL =
  "https://wa.me/919512120366?text=" +
  encodeURIComponent(
    "Hi Buffindia Team,\n\nI was exploring your website and would like to know more about your cigarette waste management solutions.\n\nMy Name:\nCompany:\nCity:\nRequirement:",
  )

export type LandingFaqTopic = {
  id: string
  label: string
  icon: string
  answer: string
  keywords: string[]
  links?: { label: string; href: string }[]
}

export const LANDING_FAQ_TOPICS: LandingFaqTopic[] = [
  {
    id: "what-is",
    label: "What is Buffindia?",
    icon: "🌿",
    keywords: ["what is", "buffindia", "about", "who are you", "company"],
    answer:
      "Buffindia is India's first infrastructure for cigarette waste management, providing collection, recycling, ESG reporting, and circular solutions.",
    links: [{ label: "Our services", href: "/services" }],
  },
  {
    id: "services",
    label: "Services",
    icon: "♻️",
    keywords: ["service", "services", "provide", "offer", "what do you do"],
    answer:
      "We provide end-to-end cigarette waste collection, recycling, ESG reporting, and sustainable product solutions.",
    links: [{ label: "Services", href: "/services" }],
  },
  {
    id: "who-can-use",
    label: "Who can use?",
    icon: "🏢",
    keywords: ["who", "hotel", "corporate", "restaurant", "society", "industries", "eligible"],
    answer:
      "Hotels, corporates, restaurants, cafés, bars, airports, malls, residential societies, educational institutions, and public spaces.",
    links: [{ label: "Impact calculator", href: "/#calculator" }],
  },
  {
    id: "coverage",
    label: "Coverage",
    icon: "🇮🇳",
    keywords: ["india", "cities", "operate", "where", "location", "pan india"],
    answer: "Yes. Buffindia operates across multiple cities across India.",
    links: [{ label: "Contact us", href: "/contact" }],
  },
  {
    id: "how-it-works",
    label: "How it works",
    icon: "⚙️",
    keywords: ["how", "work", "process", "steps", "install"],
    answer:
      "We install collection infrastructure, collect cigarette waste, recycle it, provide ESG reports, and transform waste into sustainable products.",
    links: [{ label: "Partner program", href: "/partner-program" }],
  },
  {
    id: "esg",
    label: "ESG reports",
    icon: "📊",
    keywords: ["esg", "report", "reporting", "sustainability", "impact report"],
    answer: "Yes. We provide ESG reporting to help organisations measure their sustainability impact.",
    links: [{ label: "Calculate impact", href: "/#calculator" }],
  },
  {
    id: "pricing",
    label: "Pricing",
    icon: "💰",
    keywords: ["price", "pricing", "cost", "how much", "fee", "subscription"],
    answer:
      "Pricing depends on your requirements. Please use our Impact Calculator or contact our team for a customised proposal.",
    links: [
      { label: "Impact calculator", href: "/#calculator" },
      { label: "Get proposal", href: "/#calculator" },
    ],
  },
  {
    id: "kraftreborn",
    label: "KraftReborn",
    icon: "✨",
    keywords: ["kraftreborn", "kraft reborn", "products", "circular", "recycled products"],
    answer:
      "KraftReborn products are sustainable products made from recycled cigarette waste and are offered as complimentary products with eligible annual subscriptions.",
    links: [{ label: "KraftReborn", href: "/#kraftreborn" }],
  },
  {
    id: "proposal",
    label: "Get a proposal",
    icon: "📄",
    keywords: ["proposal", "quote", "get started", "sign up", "onboard"],
    answer: "Click 'Get Proposal' on our website or share your requirements with our team.",
    links: [
      { label: "Get proposal", href: "/#calculator" },
      { label: "Contact", href: "/contact" },
    ],
  },
]

export const LANDING_QUICK_PROMPTS = [
  "What is Buffindia?",
  "How does it work?",
  "Pricing",
  "ESG reports",
  "KraftReborn products",
  "Get a proposal",
]

export const LANDING_DEFAULT_REPLY =
  "That's a great question! To provide the most accurate guidance, one of our Buffindia experts would be happy to assist you."

export function findLandingFaqAnswer(query: string): LandingFaqTopic | null {
  const q = query.toLowerCase().trim()
  if (!q) return null

  let best: LandingFaqTopic | null = null
  let bestScore = 0

  for (const topic of LANDING_FAQ_TOPICS) {
    let score = 0
    for (const kw of topic.keywords) {
      if (q.includes(kw.toLowerCase())) score += kw.split(" ").length
    }
    if (topic.label.toLowerCase().includes(q)) score += 2
    if (score > bestScore) {
      bestScore = score
      best = topic
    }
  }

  return bestScore > 0 ? best : null
}
