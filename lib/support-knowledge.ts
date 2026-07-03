export type SupportCategory =
  | "login"
  | "password"
  | "dashboard"
  | "credits"
  | "shop"
  | "orders"
  | "reports"
  | "certificates"
  | "collections"
  | "account"
  | "general"

export interface SupportTopic {
  id: SupportCategory
  label: string
  icon: string
  answer: string
  keywords: string[]
  links?: { label: string; href: string }[]
}

export const SUPPORT_TOPICS: SupportTopic[] = [
  {
    id: "login",
    label: "Login issues",
    icon: "🔐",
    keywords: ["login", "sign in", "cannot login", "can't login", "access", "unauthorized", "session"],
    answer:
      "To sign in, use the email and password registered for your company. If you see 'Unauthorized' on the dashboard, sign out and sign in again — your session may have expired. New clients receive credentials from Buffindia after onboarding.",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Forgot password", href: "/forgot-password" },
    ],
  },
  {
    id: "password",
    label: "Forgot password",
    icon: "🔑",
    keywords: ["password", "forgot", "reset", "otp", "email code", "locked"],
    answer:
      "Click 'Forgot password?' on the login page. Enter your registered email — you'll receive a 6-digit OTP (valid 10 minutes). Enter the OTP on the reset page and choose a new password (minimum 6 characters).",
    links: [{ label: "Reset password", href: "/forgot-password" }],
  },
  {
    id: "dashboard",
    label: "Dashboard & metrics",
    icon: "📊",
    keywords: ["dashboard", "metrics", "waste", "stats", "impact", "not updating", "refresh", "data"],
    answer:
      "Your dashboard shows total waste collected, cigarette butts, microplastics upcycled, water protected, and Kraftreborn credits. Click 'Refresh Data' at the top to pull the latest numbers. Group accounts can switch between child companies using the company dropdown in the header.",
    links: [{ label: "Open dashboard", href: "/dashboard" }],
  },
  {
    id: "credits",
    label: "KR credits",
    icon: "✨",
    keywords: ["credit", "credits", "kraftreborn", "kr", "redeem", "balance", "rupee"],
    answer:
      "Kraftreborn credits are sustainability rewards — 1 credit = ₹1. Use them in the Kraft Reborn Shop to order circular craft products. Credits are deducted when your order is marked 'Completed' by our team (not at checkout). Check your balance on the dashboard stats card or shop header.",
    links: [{ label: "Kraft Reborn Shop", href: "/dashboard/shop" }],
  },
  {
    id: "shop",
    label: "Shop & checkout",
    icon: "🛍️",
    keywords: ["shop", "cart", "checkout", "product", "buy", "logo", "upload logo", "custom"],
    answer:
      "Browse products at Kraft Reborn Shop → Add to cart (choose quantity) → Checkout. Enable 'Use KR Credits' at checkout. If products support logo customisation, you can upload your company logo during checkout. Orders start as Pending until fulfilled.",
    links: [
      { label: "Shop", href: "/dashboard/shop" },
      { label: "Cart", href: "/dashboard/shop/cart" },
    ],
  },
  {
    id: "orders",
    label: "Order status",
    icon: "📦",
    keywords: ["order", "pending", "shipped", "completed", "delivery", "when", "status"],
    answer:
      "After checkout your order is Pending. Our team processes it (Processing → Shipped → Completed). KR credits are deducted only when status becomes Completed. You'll get a notification and impact certificate after completion. Contact us if an order stays pending over 5 business days.",
  },
  {
    id: "reports",
    label: "ESG reports",
    icon: "📄",
    keywords: ["report", "esg", "pdf", "download report", "monthly", "email report"],
    answer:
      "Download your ESG Impact Report from the dashboard using 'Download ESG Report'. Monthly reports also appear in the Reports section — each month auto-syncs when you open the dashboard. Reports are generated from your collection data.",
    links: [{ label: "Dashboard reports", href: "/dashboard" }],
  },
  {
    id: "certificates",
    label: "Certificates",
    icon: "🏅",
    keywords: ["certificate", "cert", "download certificate", "impact certificate", "services"],
    answer:
      "Certificates appear automatically on your dashboard when you have collection data (Certificate of Services) or after a completed Kraft Reborn order (Impact Certificate). Click Download PDF on any certificate card. Certificates sync when you refresh the dashboard.",
    links: [{ label: "Dashboard", href: "/dashboard" }],
  },
  {
    id: "collections",
    label: "Collections data",
    icon: "♻️",
    keywords: ["collection", "pickup", "weight", "missing", "wrong data", "monthly"],
    answer:
      "Collection records show each pickup with date, weight, and location. If data looks wrong, contact your Buffindia account manager — collections are entered by our operations team. Group dashboards aggregate waste across all linked companies.",
  },
  {
    id: "account",
    label: "Account & profile",
    icon: "👤",
    keywords: ["profile", "company name", "email change", "address", "contact person", "settings"],
    answer:
      "Profile details (company name, contact, address) are managed by Buffindia admin. To update your information, submit a support ticket below or email support@buffindia.com with your company ID.",
    links: [{ label: "Settings", href: "/settings" }],
  },
  {
    id: "general",
    label: "Contact human support",
    icon: "💬",
    keywords: ["human", "agent", "call", "phone", "help", "support", "contact", "talk"],
    answer:
      "Our team is available Mon–Sat, 9 AM – 6 PM IST. Phone: +91-9512120366 · Email: support@buffindia.com. You can also submit a ticket from this chat — we typically respond within 1 business day.",
    links: [
      { label: "Support center", href: "/support" },
      { label: "Contact page", href: "/contact" },
    ],
  },
]

export const QUICK_PROMPTS = [
  "I can't log in",
  "Forgot my password",
  "How do KR credits work?",
  "Where is my order?",
  "Download ESG report",
  "Certificate not showing",
  "Talk to support",
]

export function findSupportAnswer(query: string): SupportTopic | null {
  const q = query.toLowerCase().trim()
  if (!q) return null

  let best: SupportTopic | null = null
  let bestScore = 0

  for (const topic of SUPPORT_TOPICS) {
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

export const SUPPORT_FAQ = SUPPORT_TOPICS.filter((t) => t.id !== "general").map((t) => ({
  question: t.label,
  answer: t.answer,
  category: t.id,
  links: t.links,
}))

export const SUPPORT_CONTACT = {
  phone: "+91-9512120366",
  email: "support@buffindia.com",
  hours: "Mon–Sat, 9:00 AM – 6:00 PM IST",
  address: "Village-Kuha, Ahmedabad-Indore Hwy, Kuha, Ahmedabad, Gujarat 382433",
}
