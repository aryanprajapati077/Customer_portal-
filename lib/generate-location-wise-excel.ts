import ExcelJS from "exceljs"
import { sql } from "@/lib/db"
import { getGroupLocations, isGroupCustomer } from "@/lib/group-customer-access"
import { resolveReportDateWindow } from "@/lib/report-date-range"

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

// Dates are stored as IST midnight (18:30 UTC the previous day); bucket in IST, not server time.
const IST_OFFSET_MS = 330 * 60 * 1000

function istParts(d: Date) {
  const s = new Date(d.getTime() + IST_OFFSET_MS)
  return { y: s.getUTCFullYear(), m: s.getUTCMonth(), d: s.getUTCDate() }
}

function monthIndex(d: Date) {
  const p = istParts(d)
  return p.y * 12 + p.m
}

function monthLabel(idx: number) {
  return `${MONTHS_SHORT[idx % 12]}-${String(Math.floor(idx / 12)).slice(2)}`
}

function formatInstallDate(d: Date) {
  const p = istParts(d)
  return `${String(p.d).padStart(2, "0")}-${String(p.m + 1).padStart(2, "0")}-${p.y}`
}

function round3(n: number) {
  return Math.round(n * 1000) / 1000
}

function locationLabel(name: string, city: string | null) {
  const c = (city || "").trim()
  if (!c || name.toLowerCase().includes(c.toLowerCase())) return name
  return `${name}, ${c}`
}

function safeFilePart(s: string) {
  return s.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

const FILL_HEADER = "FFA4C2F4"
const FILL_MONTH = "FFD9D2E9"
const FILL_TOTAL = "FFD0E0E3"

function fill(cell: ExcelJS.Cell, argb: string) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb } }
}

function border(cell: ExcelJS.Cell) {
  cell.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  }
}

export class NotGroupClientError extends Error {
  constructor() {
    super("Location-wise collection report is only available for group clients")
  }
}

/**
 * Month × location collection matrix (kg) for a group client, one column per location.
 * Always runs from the group's first installation month; the selected range / period
 * only decides the last month shown.
 */
export async function generateLocationWiseExcel(
  groupId: string,
  options?: { period?: string; range?: string; startDate?: string; endDate?: string },
) {
  if (!(await isGroupCustomer(groupId))) throw new NotGroupClientError()

  const [groupRows, locations] = await Promise.all([
    sql`SELECT "companyName" FROM "Customer" WHERE id = ${groupId} LIMIT 1`,
    getGroupLocations(groupId),
  ])
  if (locations.length === 0) throw new Error("Group has no linked locations")
  const groupName = String((groupRows[0] as { companyName?: string } | undefined)?.companyName || groupId)

  const ids = locations.map((l) => l.id)
  const installRows = (await sql.query(
    `SELECT id, COALESCE("serviceStartDate", "joinDate") AS installed FROM "Customer" WHERE id = ANY($1::text[])`,
    [ids],
  )) as { id: string; installed: string | Date | null }[]
  const installed = new Map<string, Date>()
  for (const r of installRows) {
    if (!r.installed) continue
    const d = new Date(r.installed)
    if (!Number.isNaN(d.getTime())) installed.set(r.id, d)
  }

  const window = resolveReportDateWindow({
    range: options?.range,
    period: options?.period,
    startDate: options?.startDate,
    endDate: options?.endDate,
  })
  const end = window.endDate ?? new Date()
  const earliestInstall = [...installed.values()].reduce<Date | null>(
    (min, d) => (!min || d < min ? d : min),
    null,
  )
  // Always start from the first installation; the selected range only sets the end month.
  const start = earliestInstall

  const values: unknown[] = [ids, end.toISOString()]
  let text = `SELECT "customerId", weight, date FROM "Collection"
    WHERE "customerId" = ANY($1::text[]) AND date <= $2
      AND LOWER(COALESCE(status, 'completed')) = 'completed'`
  if (start) {
    text += ` AND date >= $3`
    values.push(start.toISOString())
  }
  const collections = (await sql.query(text, values)) as {
    customerId: string
    weight: number | string | null
    date: string | Date
  }[]

  // kg per location per month index
  const kg = new Map<string, Map<number, number>>()
  let firstMonth = start ? monthIndex(start) : Number.POSITIVE_INFINITY
  for (const c of collections) {
    const d = new Date(c.date)
    const w = Number(c.weight) || 0
    if (Number.isNaN(d.getTime())) continue
    const mi = monthIndex(d)
    firstMonth = Math.min(firstMonth, mi)
    const byMonth = kg.get(c.customerId) ?? new Map<number, number>()
    byMonth.set(mi, (byMonth.get(mi) ?? 0) + w)
    kg.set(c.customerId, byMonth)
  }
  const lastMonth = monthIndex(end)
  if (!Number.isFinite(firstMonth)) firstMonth = lastMonth
  const months: number[] = []
  for (let m = firstMonth; m <= lastMonth; m++) months.push(m)

  const wb = new ExcelJS.Workbook()
  wb.creator = "Buffindia"
  const ws = wb.addWorksheet("Location-wise Collection", {
    views: [{ state: "frozen", xSplit: 1, ySplit: 2 }],
  })

  const n = locations.length
  const totalCol = n + 2
  ws.getColumn(1).width = 20
  for (let i = 0; i < n; i++) ws.getColumn(i + 2).width = 26
  ws.getColumn(totalCol).width = 16

  const center: Partial<ExcelJS.Alignment> = { horizontal: "center", vertical: "middle", wrapText: true }

  // Header row: Campus | locations… | Total
  const header = ws.getRow(1)
  header.getCell(1).value = "Campus"
  locations.forEach((l, i) => {
    header.getCell(i + 2).value = locationLabel(l.companyName, l.city)
  })
  header.getCell(totalCol).value = "Total"
  header.height = 36

  // Installation date row
  const instRow = ws.getRow(2)
  instRow.getCell(1).value = "Installation Date"
  locations.forEach((l, i) => {
    const d = installed.get(l.id)
    instRow.getCell(i + 2).value = d ? formatInstallDate(d) : "—"
  })
  for (const row of [header, instRow]) {
    for (let c = 1; c <= totalCol; c++) {
      const cell = row.getCell(c)
      cell.font = { bold: true, size: 11 }
      cell.alignment = center
      fill(cell, FILL_HEADER)
      border(cell)
    }
  }

  const colTotals = new Array<number>(n).fill(0)
  let grandTotal = 0
  months.forEach((mi, r) => {
    const row = ws.getRow(3 + r)
    const label = row.getCell(1)
    label.value = monthLabel(mi)
    label.font = { bold: true, size: 11 }
    fill(label, FILL_MONTH)
    let rowTotal = 0
    locations.forEach((l, i) => {
      const cell = row.getCell(i + 2)
      const inst = installed.get(l.id)
      const v = kg.get(l.id)?.get(mi) ?? 0
      // Leave months before the location was installed blank (unless something was collected).
      cell.value = inst && mi < monthIndex(inst) && v === 0 ? null : round3(v)
      colTotals[i] += v
      rowTotal += v
    })
    row.getCell(totalCol).value = round3(rowTotal)
    grandTotal += rowTotal
    for (let c = 1; c <= totalCol; c++) {
      const cell = row.getCell(c)
      cell.alignment = { horizontal: "center", vertical: "middle" }
      border(cell)
    }
  })

  const totalRow = ws.getRow(3 + months.length)
  totalRow.getCell(1).value = "Total"
  colTotals.forEach((v, i) => {
    totalRow.getCell(i + 2).value = round3(v)
  })
  totalRow.getCell(totalCol).value = round3(grandTotal)
  for (let c = 1; c <= totalCol; c++) {
    const cell = totalRow.getCell(c)
    cell.font = { bold: true, size: 11 }
    cell.alignment = { horizontal: "center", vertical: "middle" }
    fill(cell, FILL_TOTAL)
    border(cell)
  }

  const grandRow = ws.getRow(4 + months.length)
  grandRow.getCell(1).value = "Grand Total"
  if (n > 1) ws.mergeCells(grandRow.number, 2, grandRow.number, n + 1)
  grandRow.getCell(2).value = round3(grandTotal)
  for (let c = 1; c <= totalCol; c++) {
    const cell = grandRow.getCell(c)
    cell.font = { bold: true, size: 11 }
    cell.alignment = { horizontal: "center", vertical: "middle" }
    fill(cell, FILL_HEADER)
    border(cell)
  }

  const note = ws.getRow(6 + months.length).getCell(1)
  note.value = "All values in kg of cigarette waste collected (completed collections)."
  note.font = { italic: true, size: 9, color: { argb: "FF6B6B6B" } }

  ws.eachRow((row) => {
    row.eachCell((cell) => {
      cell.font = { name: "Arial", size: 11, ...cell.font }
    })
  })

  const buffer = Buffer.from(await wb.xlsx.writeBuffer())
  const fromLabel = monthLabel(firstMonth)
  const toLabel = monthLabel(lastMonth)
  const filename = `${safeFilePart(groupName)}-Location-wise-Collection-${fromLabel}-to-${toLabel}.xlsx`
  return { buffer, filename }
}
