import type React from "react"
import type { Metadata } from "next"
import { Inter, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/lib/theme-provider"
import { PreferencesProvider } from "@/lib/preferences-context"
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
  title: "BuffIndia | Butt Free India – End-to-End Cigarette Waste Management",
  description:
    "India's first end-to-end cigarette waste management. We collect, recycle, and transform cigarette waste into sustainable products. Join the movement for a cleaner, greener India.",
  keywords: ["BuffIndia", "Butt Free India", "cigarette waste recycling", "sustainability", "Ahmedabad", "EcoArt"],
  openGraph: {
    title: "BuffIndia | Butt Free India – Cigarette Waste to Sustainable Products",
    description: "India's first end-to-end cigarette waste management. Transform waste into eco-friendly products.",
    type: "website",
  },
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
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <PreferencesProvider>{children}</PreferencesProvider>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
