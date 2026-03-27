// Google Sheets API integration
// Your sheet should have columns matching the expected data structure

const SHEET_ID = process.env.GOOGLE_SHEET_ID
const API_KEY = process.env.GOOGLE_API_KEY

// ============================================================================
// GOOGLE SHEET STRUCTURE - COPY THIS TO YOUR SHEET
// ============================================================================
//
// Sheet 1: "Customers" (Tab name must be exactly "Customers")
// Columns (Row 1 - Headers):
// A: id | B: email | C: password | D: companyName | E: contactPerson
// F: phone | G: address | H: industry | I: employeeCount | J: joinDate
// K: status | L: totalWasteCollected | M: pendingCollection | N: certificatesEarned
// O: co2Saved | P: treesEquivalent | Q: lastCollection | R: monthlyTarget
// S: profileImageUrl | T: notes
//
// Sheet 2: "Collections" (Tab name must be exactly "Collections")
// Columns (Row 1 - Headers):
// A: id | B: customerId | C: date | D: weight | E: location
// F: status | G: co2Saved | H: collectorName | I: vehicleNumber | J: notes
//
// Sheet 3: "Certificates" (Tab name must be exactly "Certificates")
// Columns (Row 1 - Headers):
// A: id | B: customerId | C: name | D: issueDate | E: type
// F: description | G: driveFileUrl | H: validUntil | I: issuedBy | J: certificateNumber
//
// Sheet 4: "Reports" (Tab name must be exactly "Reports")
// Columns (Row 1 - Headers):
// A: id | B: customerId | C: name | D: date | E: type
// F: driveFileUrl | G: size | H: description | I: period | J: generatedBy
//
// ============================================================================

export const DEMO_CUSTOMER = {
  id: "demo-001",
  email: "demo@buffindia.com",
  password: "demo123",
  companyName: "Demo Corporation",
  contactPerson: "John Smith",
  phone: "+91 98765 43210",
  address: "123 Green Street, Mumbai, Maharashtra 400001",
  totalWasteCollected: 1250,
  pendingCollection: 45,
  certificatesEarned: 8,
  joinDate: "2023-06-15",
  lastCollection: "2024-12-28",
  status: "Active",
  co2Saved: 3125,
  treesEquivalent: 125,
  industry: "Hospitality",
  employeeCount: 500,
  monthlyTarget: 100,
  profileImageUrl: "",
  notes: "Premium partner since 2023",
}

export const DEMO_COLLECTIONS = [
  {
    id: "col-001",
    customerId: "demo-001",
    date: "2024-12-28",
    weight: 45,
    location: "Main Office",
    status: "Completed",
    co2Saved: 112.5,
    collectorName: "Raj Kumar",
    vehicleNumber: "MH-01-AB-1234",
  },
  {
    id: "col-002",
    customerId: "demo-001",
    date: "2024-12-15",
    weight: 62,
    location: "Branch A",
    status: "Completed",
    co2Saved: 155,
    collectorName: "Amit Singh",
    vehicleNumber: "MH-01-CD-5678",
  },
  {
    id: "col-003",
    customerId: "demo-001",
    date: "2024-12-01",
    weight: 38,
    location: "Main Office",
    status: "Completed",
    co2Saved: 95,
    collectorName: "Raj Kumar",
    vehicleNumber: "MH-01-AB-1234",
  },
  {
    id: "col-004",
    customerId: "demo-001",
    date: "2024-11-15",
    weight: 71,
    location: "Branch B",
    status: "Completed",
    co2Saved: 177.5,
    collectorName: "Vikram Patel",
    vehicleNumber: "MH-01-EF-9012",
  },
  {
    id: "col-005",
    customerId: "demo-001",
    date: "2024-11-01",
    weight: 55,
    location: "Main Office",
    status: "Completed",
    co2Saved: 137.5,
    collectorName: "Raj Kumar",
    vehicleNumber: "MH-01-AB-1234",
  },
  {
    id: "col-006",
    customerId: "demo-001",
    date: "2024-10-15",
    weight: 48,
    location: "Branch A",
    status: "Completed",
    co2Saved: 120,
    collectorName: "Amit Singh",
    vehicleNumber: "MH-01-CD-5678",
  },
  {
    id: "col-007",
    customerId: "demo-001",
    date: "2024-10-01",
    weight: 82,
    location: "Main Office",
    status: "Completed",
    co2Saved: 205,
    collectorName: "Raj Kumar",
    vehicleNumber: "MH-01-AB-1234",
  },
  {
    id: "col-008",
    customerId: "demo-001",
    date: "2024-09-15",
    weight: 59,
    location: "Branch B",
    status: "Completed",
    co2Saved: 147.5,
    collectorName: "Vikram Patel",
    vehicleNumber: "MH-01-EF-9012",
  },
  {
    id: "col-009",
    customerId: "demo-001",
    date: "2024-09-01",
    weight: 44,
    location: "Main Office",
    status: "Completed",
    co2Saved: 110,
    collectorName: "Raj Kumar",
    vehicleNumber: "MH-01-AB-1234",
  },
  {
    id: "col-010",
    customerId: "demo-001",
    date: "2024-08-15",
    weight: 67,
    location: "Branch A",
    status: "Completed",
    co2Saved: 167.5,
    collectorName: "Amit Singh",
    vehicleNumber: "MH-01-CD-5678",
  },
  {
    id: "col-011",
    customerId: "demo-001",
    date: "2024-08-01",
    weight: 53,
    location: "Main Office",
    status: "Completed",
    co2Saved: 132.5,
    collectorName: "Raj Kumar",
    vehicleNumber: "MH-01-AB-1234",
  },
  {
    id: "col-012",
    customerId: "demo-001",
    date: "2024-07-15",
    weight: 76,
    location: "Branch B",
    status: "Completed",
    co2Saved: 190,
    collectorName: "Vikram Patel",
    vehicleNumber: "MH-01-EF-9012",
  },
]

export const DEMO_CERTIFICATES = [
  {
    id: "cert-001",
    customerId: "demo-001",
    name: "ESG Excellence Award 2024",
    issueDate: "2024-12-01",
    type: "Gold",
    description: "Recognized for outstanding sustainability practices",
    driveFileUrl: "https://drive.google.com/file/d/EXAMPLE_FILE_ID_1/view",
    validUntil: "2025-12-01",
    issuedBy: "Buffindia",
    certificateNumber: "BUFF-ESG-2024-001",
  },
  {
    id: "cert-002",
    customerId: "demo-001",
    name: "Carbon Neutral Partner Q4",
    issueDate: "2024-10-15",
    type: "ESG",
    description: "Achieved carbon neutrality for Q4 2024",
    driveFileUrl: "https://drive.google.com/file/d/EXAMPLE_FILE_ID_2/view",
    validUntil: "2025-10-15",
    issuedBy: "Buffindia",
    certificateNumber: "BUFF-CN-Q4-2024-001",
  },
  {
    id: "cert-003",
    customerId: "demo-001",
    name: "1000kg Milestone Certificate",
    issueDate: "2024-09-20",
    type: "Platinum",
    description: "Recycled over 1000kg of cigarette waste",
    driveFileUrl: "https://drive.google.com/file/d/EXAMPLE_FILE_ID_3/view",
    validUntil: "Lifetime",
    issuedBy: "Buffindia",
    certificateNumber: "BUFF-MILE-1000-001",
  },
  {
    id: "cert-004",
    customerId: "demo-001",
    name: "Sustainable Business Partner",
    issueDate: "2024-08-01",
    type: "Silver",
    description: "Certified sustainable business partner",
    driveFileUrl: "https://drive.google.com/file/d/EXAMPLE_FILE_ID_4/view",
    validUntil: "2025-08-01",
    issuedBy: "Buffindia",
    certificateNumber: "BUFF-SBP-2024-001",
  },
  {
    id: "cert-005",
    customerId: "demo-001",
    name: "Green Initiative Leader",
    issueDate: "2024-06-15",
    type: "Bronze",
    description: "Leading green initiative in hospitality sector",
    driveFileUrl: "https://drive.google.com/file/d/EXAMPLE_FILE_ID_5/view",
    validUntil: "2025-06-15",
    issuedBy: "Buffindia",
    certificateNumber: "BUFF-GIL-2024-001",
  },
  {
    id: "cert-006",
    customerId: "demo-001",
    name: "Zero Waste Champion 2024",
    issueDate: "2024-05-01",
    type: "Gold",
    description: "Zero waste to landfill achievement",
    driveFileUrl: "https://drive.google.com/file/d/EXAMPLE_FILE_ID_6/view",
    validUntil: "2025-05-01",
    issuedBy: "Buffindia",
    certificateNumber: "BUFF-ZWC-2024-001",
  },
  {
    id: "cert-007",
    customerId: "demo-001",
    name: "Environmental Stewardship",
    issueDate: "2024-03-15",
    type: "ESG",
    description: "Environmental stewardship certification",
    driveFileUrl: "https://drive.google.com/file/d/EXAMPLE_FILE_ID_7/view",
    validUntil: "2025-03-15",
    issuedBy: "Buffindia",
    certificateNumber: "BUFF-ES-2024-001",
  },
  {
    id: "cert-008",
    customerId: "demo-001",
    name: "Circular Economy Pioneer",
    issueDate: "2024-01-10",
    type: "Platinum",
    description: "Pioneer in circular economy practices",
    driveFileUrl: "https://drive.google.com/file/d/EXAMPLE_FILE_ID_8/view",
    validUntil: "2025-01-10",
    issuedBy: "Buffindia",
    certificateNumber: "BUFF-CEP-2024-001",
  },
]

export const DEMO_REPORTS = [
  {
    id: "rep-001",
    customerId: "demo-001",
    name: "Monthly Impact Report - December 2024",
    date: "2024-12-31",
    type: "Monthly",
    driveFileUrl: "https://drive.google.com/file/d/EXAMPLE_REPORT_1/view",
    size: "2.4 MB",
    description: "Detailed monthly impact analysis",
    period: "December 2024",
    generatedBy: "System",
  },
  {
    id: "rep-002",
    customerId: "demo-001",
    name: "Monthly Impact Report - November 2024",
    date: "2024-11-30",
    type: "Monthly",
    driveFileUrl: "https://drive.google.com/file/d/EXAMPLE_REPORT_2/view",
    size: "2.1 MB",
    description: "Detailed monthly impact analysis",
    period: "November 2024",
    generatedBy: "System",
  },
  {
    id: "rep-003",
    customerId: "demo-001",
    name: "Q4 2024 Sustainability Report",
    date: "2024-12-31",
    type: "Quarterly",
    driveFileUrl: "https://drive.google.com/file/d/EXAMPLE_REPORT_3/view",
    size: "5.8 MB",
    description: "Comprehensive quarterly ESG report",
    period: "Q4 2024",
    generatedBy: "ESG Team",
  },
  {
    id: "rep-004",
    customerId: "demo-001",
    name: "Monthly Impact Report - October 2024",
    date: "2024-10-31",
    type: "Monthly",
    driveFileUrl: "https://drive.google.com/file/d/EXAMPLE_REPORT_4/view",
    size: "2.3 MB",
    description: "Detailed monthly impact analysis",
    period: "October 2024",
    generatedBy: "System",
  },
  {
    id: "rep-005",
    customerId: "demo-001",
    name: "Q3 2024 Sustainability Report",
    date: "2024-09-30",
    type: "Quarterly",
    driveFileUrl: "https://drive.google.com/file/d/EXAMPLE_REPORT_5/view",
    size: "6.2 MB",
    description: "Comprehensive quarterly ESG report",
    period: "Q3 2024",
    generatedBy: "ESG Team",
  },
  {
    id: "rep-006",
    customerId: "demo-001",
    name: "H1 2024 ESG Report",
    date: "2024-06-30",
    type: "Annual",
    driveFileUrl: "https://drive.google.com/file/d/EXAMPLE_REPORT_6/view",
    size: "12.3 MB",
    description: "Half-yearly ESG comprehensive report",
    period: "H1 2024",
    generatedBy: "ESG Team",
  },
  {
    id: "rep-007",
    customerId: "demo-001",
    name: "Annual ESG Report 2023",
    date: "2024-01-15",
    type: "Annual",
    driveFileUrl: "https://drive.google.com/file/d/EXAMPLE_REPORT_7/view",
    size: "18.7 MB",
    description: "Full year sustainability report",
    period: "FY 2023",
    generatedBy: "ESG Team",
  },
]

// For public sheets, use this simple fetch approach
// Sheet must be published to web or shared publicly
export async function getSheetData(sheetName = "Customers") {
  if (!SHEET_ID) {
    console.log("No GOOGLE_SHEET_ID configured, using demo data")
    return { success: false, data: [], headers: [], error: "No sheet configured" }
  }

  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`

  try {
    const response = await fetch(url, {
      cache: "no-store",
      next: { revalidate: 0 },
    })
    const text = await response.text()

    // Parse the JSONP response from Google Sheets
    const jsonStart = text.indexOf("{")
    const jsonEnd = text.lastIndexOf("}") + 1
    const jsonString = text.slice(jsonStart, jsonEnd)
    const data = JSON.parse(jsonString)

    // Extract column headers
    const headers = data.table.cols.map((col: { label: string }) => col.label || "")

    // Extract rows
    const rows = data.table.rows.map((row: { c: Array<{ v: string | number | null }> }) => {
      const rowData: Record<string, string | number | null> = {}
      row.c.forEach((cell, index) => {
        const header = headers[index]
        if (header) {
          rowData[header] = cell ? cell.v : null
        }
      })
      return rowData
    })

    return { success: true, data: rows, headers }
  } catch (error) {
    console.error("Error fetching sheet data:", error)
    return { success: false, data: [], headers: [], error: "Failed to fetch data" }
  }
}

export async function findCustomerByEmail(email: string) {
  // Check for demo account first
  if (email.toLowerCase() === "demo@buffindia.com") {
    return DEMO_CUSTOMER
  }

  const result = await getSheetData("Customers")
  if (!result.success) return null

  const customer = result.data.find(
    (row: Record<string, string | number | null>) => row.email?.toString().toLowerCase() === email.toLowerCase(),
  )

  return customer || null
}

export async function getCustomerCollections(customerId: string) {
  // Return demo data for demo account
  if (customerId === "demo-001") {
    return DEMO_COLLECTIONS
  }

  const result = await getSheetData("Collections")
  if (!result.success) return []

  return result.data.filter((row: Record<string, string | number | null>) => row.customerId?.toString() === customerId)
}

export async function getCustomerCertificates(customerId: string) {
  // Return demo data for demo account
  if (customerId === "demo-001") {
    return DEMO_CERTIFICATES
  }

  const result = await getSheetData("Certificates")
  if (!result.success) return []

  return result.data.filter((row: Record<string, string | number | null>) => row.customerId?.toString() === customerId)
}

export async function getCustomerReports(customerId: string) {
  // Return demo data for demo account
  if (customerId === "demo-001") {
    return DEMO_REPORTS
  }

  const result = await getSheetData("Reports")
  if (!result.success) return []

  return result.data.filter((row: Record<string, string | number | null>) => row.customerId?.toString() === customerId)
}

// Helper to convert Google Drive view URL to direct download URL
export function getDriveDownloadUrl(viewUrl: string): string {
  // Extract file ID from various Google Drive URL formats
  const patterns = [/\/file\/d\/([a-zA-Z0-9_-]+)/, /id=([a-zA-Z0-9_-]+)/, /\/d\/([a-zA-Z0-9_-]+)/]

  for (const pattern of patterns) {
    const match = viewUrl.match(pattern)
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=download&id=${match[1]}`
    }
  }

  // Return original URL if pattern not matched
  return viewUrl
}

// Helper to check if URL is a valid Google Drive link
export function isGoogleDriveUrl(url: string): boolean {
  return url?.includes("drive.google.com") || url?.includes("docs.google.com")
}
