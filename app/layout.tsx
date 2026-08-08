import type React from "react"
import type { Metadata } from "next"
import { Inter, Geist_Mono, Instrument_Serif } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/lib/theme-provider"
import { SupportProvider } from "@/components/support/support-provider"
import { JsonLd } from "@/components/seo/json-ld"
import { SITE_URL, SITE_NAME } from "@/lib/site-config"
import "./globals.css"

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "arial"],
  adjustFontFallback: true,
})

const geistMono = Geist_Mono({ 
  subsets: ["latin"], 
  variable: "--font-geist-mono",
  display: "swap",
  fallback: ["Courier New", "monospace"],
  adjustFontFallback: true,
})

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "BuffIndia | Butt Free India – End-to-End Cigarette Waste Management",
    template: "%s | BuffIndia",
  },
  description:
    "India's first end-to-end cigarette waste management. We collect, recycle, and transform cigarette waste into sustainable products. Join the movement for a cleaner, greener India.",
  keywords: [
    "BuffIndia",
    "Butt Free India",
    "cigarette waste management",
    "cigarette butt recycling",
    "ESG reporting India",
    "sustainability",
    "KraftReborn",
    "Ahmedabad",
    "corporate ESG",
    "hotel waste management",
  ],
  authors: [{ name: "Buffindia Receptacles Pvt. Ltd.", url: SITE_URL }],
  creator: "Buffindia Receptacles Pvt. Ltd.",
  publisher: "Buffindia Receptacles Pvt. Ltd.",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    title: "BuffIndia | Butt Free India – Cigarette Waste to Sustainable Products",
    description:
      "India's first end-to-end cigarette waste management. Transform waste into eco-friendly KraftReborn products with measurable ESG impact.",
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "BuffIndia | Butt Free India",
    description: "End-to-end cigarette waste collection, recycling, and ESG reporting across India.",
    creator: "@buffindia",
  },
  alternates: {
    canonical: SITE_URL,
  },
  category: "environment",
}

export const viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${inter.variable} ${geistMono.variable} ${instrumentSerif.variable} font-sans antialiased`}>
        <JsonLd />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <SupportProvider>{children}</SupportProvider>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
