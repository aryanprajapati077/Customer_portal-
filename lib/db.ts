// <CHANGE> Replaced Prisma with Neon serverless driver for edge compatibility
import { neon } from "@neondatabase/serverless"

// Create SQL client using the pooled connection string
export const sql = neon(process.env.DATABASE_URL!)

// Helper type definitions for our database models
export type Customer = {
  id: string
  email: string
  password: string
  companyName: string
  contactPerson: string
  phone: string
  address: string
  totalWasteCollected: number
  pendingCollection: number
  certificatesEarned: number
  status: string
  co2Saved: number
  treesEquivalent: number
  industry: string
  employeeCount: number
  monthlyTarget: number
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export type Collection = {
  id: string
  customerId: string
  date: Date
  weight: number
  location: string | null
  status: string
  collectorName: string | null
  vehicleNumber: string | null
  co2Saved: number
  createdAt: Date
}

export type Certificate = {
  id: string
  customerId: string
  name: string
  description: string | null
  issueDate: Date
  pdfUrl: string | null
  wasteProcessed: number
  validUntil: Date | null
}

export type Report = {
  id: string
  customerId: string
  title: string
  type: string
  date: Date
  pdfUrl: string | null
  summary: string | null
}

export type GlobalImpact = {
  id: string
  wasteCollected: number
  productsCreated: number
  treesEquivalent: number
  co2Prevented: number
  updatedAt: Date
}
