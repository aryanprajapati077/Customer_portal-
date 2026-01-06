"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  FileSpreadsheet,
  Users,
  Package,
  Award,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const SHEET_STRUCTURES = {
  customers: {
    name: "Customers",
    icon: Users,
    color: "bg-primary/10 text-primary",
    columns: [
      { name: "id", type: "Text", example: "CUST-001", required: true, description: "Unique customer identifier" },
      {
        name: "email",
        type: "Email",
        example: "customer@company.com",
        required: true,
        description: "Customer login email",
      },
      {
        name: "password",
        type: "Text",
        example: "SecurePass123",
        required: true,
        description: "Customer login password",
      },
      {
        name: "companyName",
        type: "Text",
        example: "Green Corp Ltd",
        required: true,
        description: "Company or organization name",
      },
      {
        name: "contactPerson",
        type: "Text",
        example: "John Smith",
        required: true,
        description: "Primary contact person name",
      },
      {
        name: "phone",
        type: "Phone",
        example: "+91 98765 43210",
        required: false,
        description: "Contact phone number",
      },
      {
        name: "address",
        type: "Text",
        example: "123 Green St, Mumbai",
        required: false,
        description: "Company address",
      },
      {
        name: "industry",
        type: "Text",
        example: "Hospitality",
        required: false,
        description: "Business industry/sector",
      },
      { name: "employeeCount", type: "Number", example: "500", required: false, description: "Number of employees" },
      {
        name: "joinDate",
        type: "Date",
        example: "2024-01-15",
        required: true,
        description: "Date customer joined (YYYY-MM-DD)",
      },
      { name: "status", type: "Text", example: "Active", required: true, description: "Active/Inactive/Suspended" },
      {
        name: "totalWasteCollected",
        type: "Number",
        example: "1250",
        required: true,
        description: "Total waste collected in KG",
      },
      {
        name: "pendingCollection",
        type: "Number",
        example: "45",
        required: false,
        description: "Pending collection in KG",
      },
      {
        name: "certificatesEarned",
        type: "Number",
        example: "8",
        required: false,
        description: "Number of certificates earned",
      },
      { name: "co2Saved", type: "Number", example: "3125", required: false, description: "CO2 saved in KG" },
      {
        name: "treesEquivalent",
        type: "Number",
        example: "125",
        required: false,
        description: "Trees saved equivalent",
      },
      {
        name: "lastCollection",
        type: "Date",
        example: "2024-12-28",
        required: false,
        description: "Last collection date",
      },
      {
        name: "monthlyTarget",
        type: "Number",
        example: "100",
        required: false,
        description: "Monthly collection target in KG",
      },
      {
        name: "profileImageUrl",
        type: "URL",
        example: "https://...",
        required: false,
        description: "Profile image URL",
      },
      { name: "notes", type: "Text", example: "Premium partner", required: false, description: "Additional notes" },
    ],
  },
  collections: {
    name: "Collections",
    icon: Package,
    color: "bg-secondary/10 text-secondary",
    columns: [
      { name: "id", type: "Text", example: "COL-001", required: true, description: "Unique collection ID" },
      {
        name: "customerId",
        type: "Text",
        example: "CUST-001",
        required: true,
        description: "Reference to customer ID",
      },
      {
        name: "date",
        type: "Date",
        example: "2024-12-28",
        required: true,
        description: "Collection date (YYYY-MM-DD)",
      },
      { name: "weight", type: "Number", example: "45", required: true, description: "Weight collected in KG" },
      { name: "location", type: "Text", example: "Main Office", required: true, description: "Collection location" },
      {
        name: "status",
        type: "Text",
        example: "Completed",
        required: true,
        description: "Completed/Pending/Scheduled",
      },
      { name: "co2Saved", type: "Number", example: "112.5", required: false, description: "CO2 saved (weight × 2.5)" },
      { name: "collectorName", type: "Text", example: "Raj Kumar", required: false, description: "Collector name" },
      {
        name: "vehicleNumber",
        type: "Text",
        example: "MH-01-AB-1234",
        required: false,
        description: "Collection vehicle number",
      },
      { name: "notes", type: "Text", example: "Regular pickup", required: false, description: "Additional notes" },
    ],
  },
  certificates: {
    name: "Certificates",
    icon: Award,
    color: "bg-amber-500/10 text-amber-600",
    columns: [
      { name: "id", type: "Text", example: "CERT-001", required: true, description: "Unique certificate ID" },
      {
        name: "customerId",
        type: "Text",
        example: "CUST-001",
        required: true,
        description: "Reference to customer ID",
      },
      {
        name: "name",
        type: "Text",
        example: "ESG Excellence Award 2024",
        required: true,
        description: "Certificate name/title",
      },
      {
        name: "issueDate",
        type: "Date",
        example: "2024-12-01",
        required: true,
        description: "Issue date (YYYY-MM-DD)",
      },
      { name: "type", type: "Text", example: "Gold", required: true, description: "Gold/Platinum/Silver/Bronze/ESG" },
      {
        name: "description",
        type: "Text",
        example: "Outstanding sustainability",
        required: false,
        description: "Certificate description",
      },
      {
        name: "driveFileUrl",
        type: "URL",
        example: "https://drive.google.com/file/d/xxx/view",
        required: true,
        description: "Google Drive link to PDF certificate",
      },
      {
        name: "validUntil",
        type: "Date/Text",
        example: "2025-12-01 or Lifetime",
        required: false,
        description: "Validity period",
      },
      { name: "issuedBy", type: "Text", example: "Buffindia", required: false, description: "Issuing authority" },
      {
        name: "certificateNumber",
        type: "Text",
        example: "BUFF-ESG-2024-001",
        required: false,
        description: "Official certificate number",
      },
    ],
  },
  reports: {
    name: "Reports",
    icon: FileText,
    color: "bg-accent/10 text-accent",
    columns: [
      { name: "id", type: "Text", example: "REP-001", required: true, description: "Unique report ID" },
      {
        name: "customerId",
        type: "Text",
        example: "CUST-001",
        required: true,
        description: "Reference to customer ID",
      },
      {
        name: "name",
        type: "Text",
        example: "Monthly Impact Report - Dec 2024",
        required: true,
        description: "Report name/title",
      },
      { name: "date", type: "Date", example: "2024-12-31", required: true, description: "Report date (YYYY-MM-DD)" },
      { name: "type", type: "Text", example: "Monthly", required: true, description: "Monthly/Quarterly/Annual" },
      {
        name: "driveFileUrl",
        type: "URL",
        example: "https://drive.google.com/file/d/xxx/view",
        required: true,
        description: "Google Drive link to PDF report",
      },
      { name: "size", type: "Text", example: "2.4 MB", required: false, description: "File size" },
      {
        name: "description",
        type: "Text",
        example: "Detailed monthly analysis",
        required: false,
        description: "Report description",
      },
      { name: "period", type: "Text", example: "December 2024", required: false, description: "Report period" },
      { name: "generatedBy", type: "Text", example: "System", required: false, description: "Report generator" },
    ],
  },
}

export default function SetupPage() {
  const [copiedText, setCopiedText] = useState<string | null>(null)
  const [expandedSheet, setExpandedSheet] = useState<string>("customers")

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(label)
    setTimeout(() => setCopiedText(null), 2000)
  }

  const generateCSVHeaders = (sheetKey: string) => {
    const sheet = SHEET_STRUCTURES[sheetKey as keyof typeof SHEET_STRUCTURES]
    return sheet.columns.map((col) => col.name).join(",")
  }

  const generateSampleRow = (sheetKey: string) => {
    const sheet = SHEET_STRUCTURES[sheetKey as keyof typeof SHEET_STRUCTURES]
    return sheet.columns.map((col) => col.example).join(",")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            Setup Guide
          </Badge>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 mb-6">
            <FileSpreadsheet className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Google Sheets Setup Guide</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Follow this guide to connect your Google Sheet as the backend database for customer data, collections,
            certificates, and reports.
          </p>
        </div>

        {/* Quick Start Steps */}
        <Card className="mb-8 glass border-border/50 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Quick Setup Steps
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4">
              {[
                {
                  step: 1,
                  title: "Create a new Google Sheet",
                  desc: "Go to sheets.google.com and create a new spreadsheet",
                },
                {
                  step: 2,
                  title: "Create 4 tabs/sheets",
                  desc: 'Name them exactly: "Customers", "Collections", "Certificates", "Reports"',
                },
                { step: 3, title: "Add column headers", desc: "Copy the headers from below for each sheet (Row 1)" },
                {
                  step: 4,
                  title: "Publish to web",
                  desc: 'Go to File → Share → Publish to web → Select "Entire Document" → Publish',
                },
                {
                  step: 5,
                  title: "Copy Sheet ID",
                  desc: "From URL: docs.google.com/spreadsheets/d/[THIS_IS_YOUR_SHEET_ID]/edit",
                },
                {
                  step: 6,
                  title: "Add environment variable",
                  desc: "Add GOOGLE_SHEET_ID to your Vercel project environment variables",
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-semibold">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card className="mb-8 border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground mb-2">Important Notes</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>Tab names must be exactly as specified (case-sensitive)</li>
                  <li>Column headers must be in Row 1 and match exactly</li>
                  <li>Dates should be in YYYY-MM-DD format for consistency</li>
                  <li>For certificates and reports, use Google Drive share links</li>
                  <li>Make sure the sheet is published to web or shared publicly</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sheet Structures */}
        <h2 className="text-2xl font-bold text-foreground mb-6">Sheet Structures</h2>

        <div className="space-y-4">
          {Object.entries(SHEET_STRUCTURES).map(([key, sheet]) => {
            const Icon = sheet.icon
            const isExpanded = expandedSheet === key

            return (
              <Card key={key} className="glass border-border/50 overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-muted/30 transition-colors flex items-center justify-between"
                  onClick={() => setExpandedSheet(isExpanded ? "" : key)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${sheet.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{sheet.name}</h3>
                      <p className="text-sm text-muted-foreground">{sheet.columns.length} columns</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(generateCSVHeaders(key), `${key}-headers`)
                      }}
                    >
                      {copiedText === `${key}-headers` ? (
                        <Check className="w-4 h-4 mr-1 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 mr-1" />
                      )}
                      Copy Headers
                    </Button>
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>

                {isExpanded && (
                  <CardContent className="border-t border-border/50 pt-4">
                    {/* Headers Row Preview */}
                    <div className="mb-4 p-3 rounded-lg bg-muted/30 border border-border/50 overflow-x-auto">
                      <p className="text-xs text-muted-foreground mb-2">Row 1 (Headers):</p>
                      <code className="text-xs text-primary font-mono break-all">{generateCSVHeaders(key)}</code>
                    </div>

                    {/* Sample Data Row */}
                    <div className="mb-6 p-3 rounded-lg bg-secondary/5 border border-secondary/20 overflow-x-auto">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-muted-foreground">Sample Data Row:</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs"
                          onClick={() => copyToClipboard(generateSampleRow(key), `${key}-sample`)}
                        >
                          {copiedText === `${key}-sample` ? (
                            <Check className="w-3 h-3 mr-1 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3 mr-1" />
                          )}
                          Copy
                        </Button>
                      </div>
                      <code className="text-xs text-secondary font-mono break-all">{generateSampleRow(key)}</code>
                    </div>

                    {/* Column Details Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/50">
                            <th className="text-left py-2 px-3 font-medium text-foreground">Column</th>
                            <th className="text-left py-2 px-3 font-medium text-foreground">Type</th>
                            <th className="text-left py-2 px-3 font-medium text-foreground">Required</th>
                            <th className="text-left py-2 px-3 font-medium text-foreground">Example</th>
                            <th className="text-left py-2 px-3 font-medium text-foreground">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sheet.columns.map((col, idx) => (
                            <tr key={col.name} className={idx % 2 === 0 ? "bg-muted/20" : ""}>
                              <td className="py-2 px-3 font-mono text-xs text-primary">{col.name}</td>
                              <td className="py-2 px-3">
                                <Badge variant="outline" className="text-[10px]">
                                  {col.type}
                                </Badge>
                              </td>
                              <td className="py-2 px-3">
                                {col.required ? (
                                  <Badge className="bg-red-500/10 text-red-500 text-[10px]">Required</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px]">
                                    Optional
                                  </Badge>
                                )}
                              </td>
                              <td className="py-2 px-3 text-xs text-muted-foreground font-mono max-w-[200px] truncate">
                                {col.example}
                              </td>
                              <td className="py-2 px-3 text-xs text-muted-foreground">{col.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>

        {/* Google Drive Setup */}
        <Card className="mt-8 glass border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              Setting Up Google Drive Links for Downloads
            </CardTitle>
            <CardDescription>How to add downloadable certificates and reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-semibold text-sm">
                  1
                </div>
                <div>
                  <p className="font-medium text-foreground">Upload your PDF to Google Drive</p>
                  <p className="text-sm text-muted-foreground">
                    Upload the certificate or report PDF file to your Google Drive
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-semibold text-sm">
                  2
                </div>
                <div>
                  <p className="font-medium text-foreground">Right-click and select "Get link"</p>
                  <p className="text-sm text-muted-foreground">Change access to "Anyone with the link can view"</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-semibold text-sm">
                  3
                </div>
                <div>
                  <p className="font-medium text-foreground">Copy the link</p>
                  <p className="text-sm text-muted-foreground">
                    It should look like: https://drive.google.com/file/d/XXXXXXX/view
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-semibold text-sm">
                  4
                </div>
                <div>
                  <p className="font-medium text-foreground">Paste in the driveFileUrl column</p>
                  <p className="text-sm text-muted-foreground">
                    Add the link to your Certificates or Reports sheet in the driveFileUrl column
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-sm text-muted-foreground mb-2">Example Google Drive URL format:</p>
              <code className="text-xs text-primary font-mono">
                https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card className="mt-8 glass border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <CheckCircle2 className="w-5 h-5" />
              Demo Credentials
            </CardTitle>
            <CardDescription>Use these credentials to test the system without setting up Google Sheets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <div className="flex items-center justify-between">
                  <code className="text-primary font-mono">demo@buffindia.com</code>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard("demo@buffindia.com", "demo-email")}>
                    {copiedText === "demo-email" ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                <p className="text-sm text-muted-foreground mb-1">Password</p>
                <div className="flex items-center justify-between">
                  <code className="text-primary font-mono">demo123</code>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard("demo123", "demo-pass")}>
                    {copiedText === "demo-pass" ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-center">
              <Link href="/login">
                <Button className="bg-primary hover:bg-primary/90">
                  Try Demo Login
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
