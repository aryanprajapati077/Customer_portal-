import type React from "react"
import type { Metadata } from "next"
import { Inter, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/lib/auth-context"
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

export const metadata: Metadata = {
  title: "Buffindia | Transforming Cigarette Waste Into Sustainable Impact",
  description:
    "Leading the revolution in cigarette waste recycling. We transform harmful waste into sustainable products, creating measurable environmental impact for a cleaner future.",
  keywords: ["ESG", "sustainability", "cigarette waste recycling", "environmental impact", "green technology"],
  openGraph: {
    title: "Buffindia | ESG-Driven Waste Revolution",
    description: "Transforming cigarette waste into sustainable products. Join the environmental revolution.",
    type: "website",
  },
    generator: 'v0.app'
}

export const viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}>
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
