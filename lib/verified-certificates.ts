import { prisma } from "@/lib/prisma"

const DEFAULT_CERTIFICATES = [
  { title: "ISO 14001:2015", issuer: "International Organization for Standardization", validUntil: "December 2026", type: "Environmental Management", icon: "shield", sortOrder: 0 },
  { title: "B Corp Certification", issuer: "B Lab", validUntil: "March 2027", type: "Social & Environmental", icon: "award", sortOrder: 1 },
  { title: "GRI Standards Compliance", issuer: "Global Reporting Initiative", validUntil: "Ongoing", type: "Sustainability Reporting", icon: "filecheck", sortOrder: 2 },
  { title: "CDP Climate A-List", issuer: "Carbon Disclosure Project", validUntil: "2024 Recognition", type: "Climate Leadership", icon: "leaf", sortOrder: 3 },
  { title: "Zero Waste Certification", issuer: "TRUE by GBCI", validUntil: "August 2026", type: "Waste Management", icon: "trending", sortOrder: 4 },
  { title: "Fair Trade Certified", issuer: "Fair Trade USA", validUntil: "June 2025", type: "Social Responsibility", icon: "award", sortOrder: 5 },
]

export async function ensureVerifiedCertificatesSeeded() {
  const count = await prisma.verifiedCertificate.count()
  if (count > 0) return
  for (const c of DEFAULT_CERTIFICATES) {
    await prisma.verifiedCertificate.create({ data: c })
  }
}
