import ExcelJS from "exceljs"
import { sql } from "@/lib/db"
import {
  computeImpactReportData,
  formatInstallDate,
  formatMetricNumber,
  parseLocation,
} from "@/lib/esg-metrics"
import { parsePeriodMonth } from "@/lib/generate-impact-report-pdf"

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

type CollectionRow = {
  weight?: number | string | null
  date?: string | Date | null
  status?: string | null
  notes?: string | null
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number)
  return `${MONTHS_SHORT[(m || 1) - 1]}-${String(y).slice(2)}`
}

function formatDateCell(d: Date) {
  const day = String(d.getDate()).padStart(2, "0")
  const mon = MONTHS_SHORT[d.getMonth()]
  return `${day}-${mon}-${d.getFullYear()}`
}

function estimateFrequency(collections: CollectionRow[]): string {
  if (collections.length < 2) return "As scheduled"
  const dates = collections
    .map((c) => new Date(c.date as string | Date))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime())
  if (dates.length < 2) return "As scheduled"
  const gaps: number[] = []
  for (let i = 1; i < dates.length; i++) {
    gaps.push((dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24))
  }
  const avg = gaps.reduce((s, g) => s + g, 0) / gaps.length
  if (avg <= 10) return "Weekly"
  if (avg <= 20) return "Fortnightly"
  if (avg <= 40) return "Monthly"
  return "As scheduled"
}

function styleHeader(cell: ExcelJS.Cell, fill: string) {
  cell.font = { bold: true, color: { argb: "FF1A1A1A" }, size: 12 }
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } }
  cell.alignment = { vertical: "middle", horizontal: "left" }
}

function styleLabel(cell: ExcelJS.Cell) {
  cell.font = { bold: true, size: 10 }
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC6EFCE" } }
  cell.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  }
}

function styleValue(cell: ExcelJS.Cell) {
  cell.font = { size: 10 }
  cell.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  }
}

function thinBorder(cell: ExcelJS.Cell) {
  cell.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  }
}

export async function generateImpactReportExcel(
  customerId: string,
  options?: { period?: string },
) {
  const asOfDate = parsePeriodMonth(options?.period)

  const [customerRows, collectionRows] = await Promise.all([
    sql`
      SELECT id, "companyName", address, "joinDate", "disposalUnitInstalled",
             "totalWasteCollected", "kraftrebornCredits", "contactPerson", email
      FROM "Customer"
      WHERE id = ${customerId}
      LIMIT 1
    `,
    asOfDate
      ? sql`
          SELECT weight, date, status, notes
          FROM "Collection"
          WHERE "customerId" = ${customerId}
            AND date <= ${asOfDate.toISOString()}
          ORDER BY date ASC
        `
      : sql`
          SELECT weight, date, status, notes
          FROM "Collection"
          WHERE "customerId" = ${customerId}
          ORDER BY date ASC
        `,
  ])

  const customer = customerRows[0] as Record<string, unknown> | undefined
  if (!customer) throw new Error("Customer not found")

  const collections = collectionRows as CollectionRow[]
  const reportData = computeImpactReportData(
    {
      id: String(customer.id),
      companyName: String(customer.companyName),
      address: customer.address as string | null,
      joinDate: customer.joinDate as string | Date | null,
      disposalUnitInstalled: Number(customer.disposalUnitInstalled) || 0,
      totalWasteCollected: Number(customer.totalWasteCollected) || 0,
      kraftrebornCredits: Number(customer.kraftrebornCredits) || 0,
    },
    collections,
    asOfDate,
  )

  // Month-wise aggregation
  const byMonth = new Map<
    string,
    { count: number; wasteKg: number; statuses: string[]; remarks: string[] }
  >()
  for (const c of collections) {
    const d = new Date(c.date as string | Date)
    if (Number.isNaN(d.getTime())) continue
    const key = monthKey(d)
    const cur = byMonth.get(key) || { count: 0, wasteKg: 0, statuses: [], remarks: [] }
    cur.count += 1
    cur.wasteKg += Number(c.weight) || 0
    if (c.status) cur.statuses.push(String(c.status))
    if (c.notes?.trim()) cur.remarks.push(String(c.notes).trim())
    byMonth.set(key, cur)
  }

  // Ensure continuous months from first collection / join to as-of
  const end = asOfDate ?? new Date()
  let start = customer.joinDate ? new Date(customer.joinDate as string | Date) : end
  if (collections.length > 0) {
    const first = new Date(collections[0].date as string | Date)
    if (!Number.isNaN(first.getTime()) && first < start) start = first
  }
  start = new Date(start.getFullYear(), start.getMonth(), 1)
  const monthKeys: string[] = []
  const cursor = new Date(start)
  while (cursor <= end) {
    monthKeys.push(monthKey(cursor))
    cursor.setMonth(cursor.getMonth() + 1)
  }
  // Cap to last 24 months for readability if very long
  const limitedKeys = monthKeys.length > 24 ? monthKeys.slice(-24) : monthKeys

  const workbook = new ExcelJS.Workbook()
  workbook.creator = "BuffIndia"
  workbook.created = new Date()
  const sheet = workbook.addWorksheet("Impact Report", {
    views: [{ showGridLines: true }],
  })

  sheet.columns = [
    { width: 32 },
    { width: 22 },
    { width: 22 },
    { width: 24 },
    { width: 24 },
    { width: 22 },
    { width: 24 },
    { width: 18 },
    { width: 22 },
  ]

  // ── 1. CUSTOMER DETAILS ──
  sheet.mergeCells("A1:D1")
  styleHeader(sheet.getCell("A1"), "FFC6EFCE")
  sheet.getCell("A1").value = "1. CUSTOMER DETAILS"
  sheet.getRow(1).height = 22

  const customerDetails: [string, string | number][] = [
    ["Customer Name", reportData.companyName],
    ["Customer ID", reportData.customerId],
    ["Location", parseLocation(customer.address as string | null)],
    ["Service Start Date", formatInstallDate(customer.joinDate as string | Date | null)],
    ["Number of Kiosks / Disposal Units", reportData.disposalUnitsInstalled],
    ["Reporting Period", reportData.reportingPeriodRange],
    ["Report Generated On", formatDateCell(new Date())],
    ["Collection Frequency", estimateFrequency(collections)],
  ]

  customerDetails.forEach(([label, value], i) => {
    const row = 2 + i
    styleLabel(sheet.getCell(`A${row}`))
    sheet.getCell(`A${row}`).value = label
    sheet.mergeCells(`C${row}:D${row}`)
    styleValue(sheet.getCell(`C${row}`))
    sheet.getCell(`C${row}`).value = value
    thinBorder(sheet.getCell(`B${row}`))
    thinBorder(sheet.getCell(`D${row}`))
  })

  // ── 2. IMPACT SUMMARY ──
  const summaryStart = 11
  sheet.mergeCells(`A${summaryStart}:D${summaryStart}`)
  styleHeader(sheet.getCell(`A${summaryStart}`), "FFBDD7EE")
  sheet.getCell(`A${summaryStart}`).value = "2. IMPACT SUMMARY (CUMULATIVE)"
  sheet.getRow(summaryStart).height = 22

  const summaryHeader = summaryStart + 1
  ;["Metric", "Unit", "", "Total"].forEach((h, i) => {
    const cell = sheet.getCell(summaryHeader, i + 1)
    cell.value = h
    cell.font = { bold: true, size: 10 }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDDEBF7" } }
    thinBorder(cell)
  })

  const summaryRows: [string, string, number | string][] = [
    ["Waste Collected", "kg", reportData.totalWasteKg],
    ["Waste Recycled", "kg", reportData.totalWasteRecycledKg],
    ["Cigarette Butts Collected", "Numbers", reportData.cigaretteButts],
    ["Microplastics Upcycled", "kg", reportData.microplasticUpcycledKg],
    ["Water Protected", "Liters", reportData.waterResourcesProtectedL],
    ["Total Collections Completed", "Numbers", collections.length],
  ]

  summaryRows.forEach(([metric, unit, total], i) => {
    const row = summaryHeader + 1 + i
    sheet.getCell(`A${row}`).value = metric
    sheet.getCell(`B${row}`).value = unit
    sheet.getCell(`D${row}`).value = typeof total === "number" ? total : total
    ;["A", "B", "C", "D"].forEach((col) => {
      thinBorder(sheet.getCell(`${col}${row}`))
      sheet.getCell(`${col}${row}`).font = { size: 10 }
    })
    if (typeof total === "number") {
      sheet.getCell(`D${row}`).numFmt = total % 1 === 0 ? "#,##0" : "#,##0.00"
    }
  })

  // ── 3. MONTH-WISE IMPACT DETAILS ──
  const monthStart = summaryHeader + summaryRows.length + 2
  sheet.mergeCells(`A${monthStart}:I${monthStart}`)
  styleHeader(sheet.getCell(`A${monthStart}`), "FFFFF2CC")
  sheet.getCell(`A${monthStart}`).value = "3. MONTH-WISE IMPACT DETAILS"
  sheet.getRow(monthStart).height = 22

  const monthHeaderRow = monthStart + 1
  const monthHeaders = [
    "Month",
    "Number of Collections",
    "Waste Collected (kg)",
    "Waste Recycled (kg)",
    "Microplastics Upcycled (kg)",
    "Water Protected (L)",
    "Cigarette Butts Collected",
    "Collection Status",
    "Remarks",
  ]
  monthHeaders.forEach((h, i) => {
    const cell = sheet.getCell(monthHeaderRow, i + 1)
    cell.value = h
    cell.font = { bold: true, size: 10 }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF2CC" } }
    cell.alignment = { wrapText: true, vertical: "middle" }
    thinBorder(cell)
  })
  sheet.getRow(monthHeaderRow).height = 32

  let totals = {
    count: 0,
    waste: 0,
    recycled: 0,
    micro: 0,
    water: 0,
    butts: 0,
  }

  limitedKeys.forEach((key, i) => {
    const row = monthHeaderRow + 1 + i
    const data = byMonth.get(key) || { count: 0, wasteKg: 0, statuses: [], remarks: [] }
    const waste = +data.wasteKg.toFixed(2)
    const recycled = waste
    const micro = +(waste * 0.8).toFixed(2)
    const butts = Math.round(waste * 3000)
    const water = butts * 100
    const status =
      data.count === 0
        ? "No Collection"
        : data.statuses.every((s) => s.toLowerCase() === "completed")
          ? "Completed"
          : data.statuses[data.statuses.length - 1] || "Completed"

    const values = [
      monthLabel(key),
      data.count,
      waste,
      recycled,
      micro,
      water,
      butts,
      status,
      data.remarks.join("; ") || "",
    ]
    values.forEach((v, col) => {
      const cell = sheet.getCell(row, col + 1)
      cell.value = v
      cell.font = { size: 10 }
      thinBorder(cell)
      if (typeof v === "number" && col > 0 && col < 7) {
        cell.numFmt = Number.isInteger(v) ? "#,##0" : "#,##0.00"
      }
    })

    totals.count += data.count
    totals.waste += waste
    totals.recycled += recycled
    totals.micro += micro
    totals.water += water
    totals.butts += butts
  })

  const totalRow = monthHeaderRow + 1 + limitedKeys.length
  const totalValues = [
    "TOTAL",
    totals.count,
    +totals.waste.toFixed(2),
    +totals.recycled.toFixed(2),
    +totals.micro.toFixed(2),
    totals.water,
    totals.butts,
    "",
    "",
  ]
  totalValues.forEach((v, col) => {
    const cell = sheet.getCell(totalRow, col + 1)
    cell.value = v
    cell.font = { bold: true, size: 10 }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F2F2" } }
    thinBorder(cell)
    if (typeof v === "number") {
      cell.numFmt = Number.isInteger(v) ? "#,##0" : "#,##0.00"
    }
  })

  // ── Notes ──
  const notesRow = totalRow + 2
  sheet.getCell(`A${notesRow}`).value = "Notes:"
  sheet.getCell(`A${notesRow}`).font = { bold: true, size: 10 }
  const notes = [
    "1 kg of cigarette waste is estimated to be equal to 3,000 cigarette butts.",
    "A single cigarette butt can contaminate up to 100 litres of water.",
    "Figures are cumulative for the reporting period.",
  ]
  notes.forEach((n, i) => {
    sheet.getCell(`A${notesRow + 1 + i}`).value = `- ${n}`
    sheet.getCell(`A${notesRow + 1 + i}`).font = { size: 9, color: { argb: "FF595959" } }
  })

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer())
  const filename = `${reportData.customerId}-Impact-Report-${reportData.reportingPeriod.replace(" ", "-")}.xlsx`

  return {
    buffer,
    filename,
    reportData,
    summaryLine: `${formatMetricNumber(reportData.totalWasteKg)} kg · ${formatMetricNumber(reportData.cigaretteButts)} butts`,
  }
}
