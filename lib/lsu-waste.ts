import ExcelJS from "exceljs"
import { randomUUID } from "crypto"
import { sql } from "@/lib/db"

/**
 * LSU's Waste: cigarette waste collected from customers, grouped by LSU (Customer."lsuName"),
 * and reverse pickups — courier shipments of that waste from each LSU back to the plant.
 * Years are Indian financial years (Apr–Mar); months are bucketed in IST.
 */

export const PICKUP_STATUSES = ["Scheduled", "Picked Up", "In Transit", "Received", "Cancelled"] as const
export type PickupStatus = (typeof PICKUP_STATUSES)[number]

export type ReversePickup = {
  id: string
  lsuName: string
  pickupDate: string // yyyy-mm-dd
  weightKg: number
  boxes: number | null
  courier: string
  awb: string
  status: PickupStatus
  receivedDate: string | null
  receivedWeightKg: number | null
  cost: number | null
  notes: string
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export async function ensureReversePickupTable() {
  const g = globalThis as typeof globalThis & { __lsuReversePickupTable?: Promise<void> }
  if (!g.__lsuReversePickupTable) {
    g.__lsuReversePickupTable = (async () => {
      await sql.query(
        `CREATE TABLE IF NOT EXISTS "LsuReversePickup" (
          "id" TEXT PRIMARY KEY,
          "lsuName" TEXT NOT NULL,
          "pickupDate" DATE NOT NULL,
          "weightKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "boxes" INTEGER,
          "courier" TEXT NOT NULL DEFAULT '',
          "awb" TEXT NOT NULL DEFAULT '',
          "status" TEXT NOT NULL DEFAULT 'Scheduled',
          "receivedDate" DATE,
          "receivedWeightKg" DOUBLE PRECISION,
          "cost" DOUBLE PRECISION,
          "notes" TEXT NOT NULL DEFAULT '',
          "createdBy" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
        )`,
      )
      await sql.query(`CREATE INDEX IF NOT EXISTS "LsuReversePickup_lsu_idx" ON "LsuReversePickup" (LOWER("lsuName"))`)
      await sql.query(`CREATE INDEX IF NOT EXISTS "LsuReversePickup_date_idx" ON "LsuReversePickup" ("pickupDate")`)
    })().catch((e) => {
      g.__lsuReversePickupTable = undefined
      throw e
    })
  }
  await g.__lsuReversePickupTable
}

// ── Financial year helpers ───────────────────────────────────────────────

const IST_MIN = 330
export const FY_MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"]

/** FY that contains `d` in IST, named by its starting year (FY 2026-27 → 2026). */
export function fyOf(d = new Date()) {
  const ist = new Date(d.getTime() + IST_MIN * 60_000)
  return ist.getUTCMonth() >= 3 ? ist.getUTCFullYear() : ist.getUTCFullYear() - 1
}
export const fyLabel = (fy: number) => `FY ${fy}-${String((fy + 1) % 100).padStart(2, "0")}`
export const monthHeaders = (fy: number) => FY_MONTHS.map((m, i) => `${m}-${String((i < 9 ? fy : fy + 1) % 100).padStart(2, "0")}`)

/** UTC instants for the FY's IST bounds (collection dates are stored as UTC instants). */
function fyBounds(fy: number) {
  return {
    start: new Date(Date.UTC(fy, 3, 1) - IST_MIN * 60_000),
    end: new Date(Date.UTC(fy + 1, 3, 1) - IST_MIN * 60_000),
  }
}

const keyOf = (name: string | null | undefined) => (name || "").trim().toLowerCase() || UNASSIGNED_KEY
const UNASSIGNED_KEY = "__unassigned__"
export const UNASSIGNED = "Unassigned"

// ── Report ───────────────────────────────────────────────────────────────

export type LsuWasteRow = {
  lsuName: string
  technician: string
  activeCustomers: number
  activeKiosks: number
  /** kg collected per FY month (index 0 = April) */
  collected: number[]
  collections: number
  collectedTotal: number
  /** kg dispatched by reverse pickup per FY month (cancelled excluded) */
  dispatched: number[]
  dispatchedTotal: number
  receivedTotal: number
  pickups: number
  lastPickupDate: string | null
  /** kg collected after the last pickup (all time); null when the LSU has never had a pickup */
  sinceLastPickup: number | null
}

export type LsuWasteReport = {
  fy: number
  label: string
  months: string[]
  rows: LsuWasteRow[]
  totals: {
    collected: number[]
    collectedTotal: number
    collections: number
    dispatched: number[]
    dispatchedTotal: number
    receivedTotal: number
    pickups: number
    activeCustomers: number
    activeKiosks: number
    lsusWithWaste: number
  }
  pickups: ReversePickup[]
  lsuOptions: string[]
}

const n = (v: unknown) => Number(v) || 0
const r3 = (v: number) => Math.round(v * 1000) / 1000
const ymd = (v: unknown): string | null => {
  if (!v) return null
  if (typeof v === "string") return v.slice(0, 10)
  const d = v as Date
  // DATE columns come back as local-midnight Date objects
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function toPickup(r: Record<string, unknown>): ReversePickup {
  return {
    id: String(r.id),
    lsuName: String(r.lsuName),
    pickupDate: ymd(r.pickupDate) || "",
    weightKg: n(r.weightKg),
    boxes: r.boxes == null ? null : n(r.boxes),
    courier: String(r.courier || ""),
    awb: String(r.awb || ""),
    status: (PICKUP_STATUSES as readonly string[]).includes(String(r.status)) ? (r.status as PickupStatus) : "Scheduled",
    receivedDate: ymd(r.receivedDate),
    receivedWeightKg: r.receivedWeightKg == null ? null : n(r.receivedWeightKg),
    cost: r.cost == null ? null : n(r.cost),
    notes: String(r.notes || ""),
    createdBy: r.createdBy ? String(r.createdBy) : null,
    createdAt: new Date(r.createdAt as string).toISOString(),
    updatedAt: new Date(r.updatedAt as string).toISOString(),
  }
}

export async function getLsuWasteReport(fy: number): Promise<LsuWasteReport> {
  await ensureReversePickupTable()
  const { start, end } = fyBounds(fy)
  const fyStart = `${fy}-04-01`
  const fyEnd = `${fy + 1}-04-01`

  const [teams, customers, monthly, pickupRows, lastPickups] = await Promise.all([
    sql.query<{ lsuName: string; technicianName: string }>(
      `SELECT "lsuName", "technicianName" FROM "LsuTeam" WHERE active = true ORDER BY "sortOrder", "lsuName"`,
    ).catch(() => [] as { lsuName: string; technicianName: string }[]),
    sql.query<{ lsuName: string | null; customers: string; kiosks: string }>(
      `SELECT "lsuName", COUNT(*) AS customers, COALESCE(SUM("noOfKiosk"), 0) AS kiosks
         FROM "Customer"
        WHERE UPPER(COALESCE("serviceStatus", 'ACTIVE')) IN ('ACTIVE', 'RENEWAL_DUE')
        GROUP BY "lsuName"`,
    ),
    sql.query<{ lsuName: string | null; m: string; kg: string; cnt: string }>(
      `SELECT c."lsuName",
              (EXTRACT(YEAR FROM col.date + INTERVAL '330 minutes') * 12 + EXTRACT(MONTH FROM col.date + INTERVAL '330 minutes') - 1) AS m,
              SUM(col.weight) AS kg,
              COUNT(*) FILTER (WHERE col.weight > 0) AS cnt
         FROM "Collection" col
         JOIN "Customer" c ON c.id = col."customerId"
        WHERE LOWER(COALESCE(col.status, 'completed')) = 'completed'
          AND col.date >= $1 AND col.date < $2
        GROUP BY c."lsuName", m`,
      [start.toISOString(), end.toISOString()],
    ),
    sql.query<Record<string, unknown>>(
      `SELECT * FROM "LsuReversePickup" WHERE "pickupDate" >= $1 AND "pickupDate" < $2 ORDER BY "pickupDate" DESC, "createdAt" DESC`,
      [fyStart, fyEnd],
    ),
    // kg collected after each LSU's latest pickup (all time, not just this FY)
    sql.query<{ k: string; last: string | Date; since: string }>(
      `WITH last AS (
         SELECT LOWER(TRIM("lsuName")) AS k, MAX("pickupDate") AS last
           FROM "LsuReversePickup" WHERE status <> 'Cancelled' GROUP BY 1
       )
       SELECT last.k, last.last,
              COALESCE((SELECT SUM(col.weight) FROM "Collection" col JOIN "Customer" c ON c.id = col."customerId"
                         WHERE LOWER(TRIM(c."lsuName")) = last.k
                           AND LOWER(COALESCE(col.status, 'completed')) = 'completed'
                           AND col.date + INTERVAL '330 minutes' >= last.last + INTERVAL '1 day'), 0) AS since
         FROM last`,
    ),
  ])

  const pickups = pickupRows.map(toPickup)
  const monthBase = fy * 12 + 3 // April of the FY as a month index

  type Acc = Omit<LsuWasteRow, "sinceLastPickup" | "lastPickupDate"> & { names: Map<string, number> }
  const acc = new Map<string, Acc>()
  const get = (raw: string | null) => {
    const k = keyOf(raw)
    let a = acc.get(k)
    if (!a) {
      a = {
        lsuName: k === UNASSIGNED_KEY ? UNASSIGNED : (raw || "").trim(),
        technician: "",
        activeCustomers: 0,
        activeKiosks: 0,
        collected: new Array(12).fill(0),
        collections: 0,
        collectedTotal: 0,
        dispatched: new Array(12).fill(0),
        dispatchedTotal: 0,
        receivedTotal: 0,
        pickups: 0,
        names: new Map(),
      }
      acc.set(k, a)
    }
    if (raw && raw.trim()) a.names.set(raw.trim(), (a.names.get(raw.trim()) ?? 0) + 1)
    return a
  }

  for (const t of teams) {
    const a = get(t.lsuName)
    a.technician = t.technicianName && t.technicianName !== "Unassigned" ? t.technicianName : ""
    a.lsuName = t.lsuName.trim() // the team's spelling wins
    a.names.set(a.lsuName, Number.MAX_SAFE_INTEGER)
  }
  for (const c of customers) {
    const a = get(c.lsuName)
    a.activeCustomers += n(c.customers)
    a.activeKiosks += n(c.kiosks)
  }
  for (const m of monthly) {
    const i = n(m.m) - monthBase
    if (i < 0 || i > 11) continue
    const a = get(m.lsuName)
    a.collected[i] += n(m.kg)
    a.collections += n(m.cnt)
  }
  for (const p of pickups) {
    if (p.status === "Cancelled") continue
    const a = get(p.lsuName)
    const [y, mo] = p.pickupDate.split("-").map(Number)
    const i = y * 12 + mo - 1 - monthBase
    if (i >= 0 && i < 12) a.dispatched[i] += p.weightKg
    a.pickups++
    if (p.status === "Received") a.receivedTotal += p.receivedWeightKg ?? p.weightKg
  }

  const last = new Map(lastPickups.map((l) => [l.k, l]))
  const rows: LsuWasteRow[] = [...acc.entries()].map(([k, a]) => {
    // Most common spelling among customers when there is no LSU team record
    const name = k === UNASSIGNED_KEY ? UNASSIGNED : [...a.names.entries()].sort((x, y) => y[1] - x[1])[0]?.[0] || a.lsuName
    const l = last.get(k)
    const { names: _names, ...rest } = a
    return {
      ...rest,
      lsuName: name,
      collected: a.collected.map(r3),
      collectedTotal: r3(a.collected.reduce((s, v) => s + v, 0)),
      dispatched: a.dispatched.map(r3),
      dispatchedTotal: r3(a.dispatched.reduce((s, v) => s + v, 0)),
      receivedTotal: r3(a.receivedTotal),
      lastPickupDate: l ? ymd(l.last) : null,
      sinceLastPickup: l ? r3(n(l.since)) : null,
    }
  })
  rows.sort((x, y) =>
    x.lsuName === UNASSIGNED ? 1 : y.lsuName === UNASSIGNED ? -1 : y.collectedTotal - x.collectedTotal || x.lsuName.localeCompare(y.lsuName),
  )

  const sumCol = (f: (r: LsuWasteRow) => number[]) =>
    Array.from({ length: 12 }, (_, i) => r3(rows.reduce((s, r) => s + f(r)[i], 0)))
  const collected = sumCol((r) => r.collected)
  const dispatched = sumCol((r) => r.dispatched)
  return {
    fy,
    label: fyLabel(fy),
    months: monthHeaders(fy),
    rows,
    totals: {
      collected,
      collectedTotal: r3(collected.reduce((s, v) => s + v, 0)),
      collections: rows.reduce((s, r) => s + r.collections, 0),
      dispatched,
      dispatchedTotal: r3(dispatched.reduce((s, v) => s + v, 0)),
      receivedTotal: r3(rows.reduce((s, r) => s + r.receivedTotal, 0)),
      pickups: rows.reduce((s, r) => s + r.pickups, 0),
      activeCustomers: rows.reduce((s, r) => s + r.activeCustomers, 0),
      activeKiosks: rows.reduce((s, r) => s + r.activeKiosks, 0),
      lsusWithWaste: rows.filter((r) => r.collectedTotal > 0 && r.lsuName !== UNASSIGNED).length,
    },
    pickups,
    lsuOptions: rows.filter((r) => r.lsuName !== UNASSIGNED).map((r) => r.lsuName).sort((a, b) => a.localeCompare(b)),
  }
}

// ── Reverse pickup CRUD ──────────────────────────────────────────────────

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "")
const optNum = (v: unknown): number | null | undefined => {
  if (v === null || v === undefined || v === "") return null
  const x = Number(v)
  return Number.isFinite(x) && x >= 0 ? x : undefined
}
const isYmd = (v: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false
  const d = new Date(`${v}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v // rejects 2026-02-31
}

/** Validate a pickup from a request body. Returns the clean values or an error message. */
export function parsePickup(raw: unknown): { ok: true; value: Omit<ReversePickup, "id" | "createdBy" | "createdAt" | "updatedAt"> } | { ok: false; error: string } {
  const b = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>
  const lsuName = str(b.lsuName, 80)
  if (!lsuName) return { ok: false, error: "Select an LSU" }
  const pickupDate = str(b.pickupDate, 10)
  if (!isYmd(pickupDate)) return { ok: false, error: "Enter a valid pickup date" }
  const weightKg = Number(b.weightKg)
  if (!Number.isFinite(weightKg) || weightKg <= 0) return { ok: false, error: "Weight dispatched must be more than 0 kg" }
  if (weightKg > 10000) return { ok: false, error: "Weight looks too large — enter kg, not grams" }
  const status = str(b.status, 20) as PickupStatus
  if (!(PICKUP_STATUSES as readonly string[]).includes(status)) return { ok: false, error: "Invalid status" }
  const boxes = optNum(b.boxes)
  const receivedWeightKg = optNum(b.receivedWeightKg)
  const cost = optNum(b.cost)
  if (boxes === undefined || receivedWeightKg === undefined || cost === undefined) return { ok: false, error: "Boxes, received weight and cost must be positive numbers" }
  let receivedDate: string | null = str(b.receivedDate, 10) || null
  if (receivedDate && !isYmd(receivedDate)) return { ok: false, error: "Enter a valid received date" }
  if (receivedDate && receivedDate < pickupDate) return { ok: false, error: "Received date can't be before the pickup date" }
  if (status !== "Received") receivedDate = null
  return {
    ok: true,
    value: {
      lsuName,
      pickupDate,
      weightKg,
      boxes: boxes === null ? null : Math.round(boxes),
      courier: str(b.courier, 60),
      awb: str(b.awb, 60),
      status,
      receivedDate,
      receivedWeightKg: status === "Received" ? receivedWeightKg : null,
      cost,
      notes: str(b.notes, 500),
    },
  }
}

export async function createPickup(v: Omit<ReversePickup, "id" | "createdBy" | "createdAt" | "updatedAt">, createdBy: string | null) {
  await ensureReversePickupTable()
  const id = randomUUID()
  await sql.query(
    `INSERT INTO "LsuReversePickup" ("id","lsuName","pickupDate","weightKg","boxes","courier","awb","status","receivedDate","receivedWeightKg","cost","notes","createdBy")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [id, v.lsuName, v.pickupDate, v.weightKg, v.boxes, v.courier, v.awb, v.status, v.receivedDate, v.receivedWeightKg, v.cost, v.notes, createdBy],
  )
  return id
}

export async function updatePickup(id: string, v: Omit<ReversePickup, "id" | "createdBy" | "createdAt" | "updatedAt">) {
  await ensureReversePickupTable()
  const rows = await sql.query(
    `UPDATE "LsuReversePickup" SET "lsuName"=$2,"pickupDate"=$3,"weightKg"=$4,"boxes"=$5,"courier"=$6,"awb"=$7,"status"=$8,
            "receivedDate"=$9,"receivedWeightKg"=$10,"cost"=$11,"notes"=$12,"updatedAt"=NOW()
      WHERE "id"=$1 RETURNING "id"`,
    [id, v.lsuName, v.pickupDate, v.weightKg, v.boxes, v.courier, v.awb, v.status, v.receivedDate, v.receivedWeightKg, v.cost, v.notes],
  )
  return rows.length > 0
}

export async function deletePickup(id: string) {
  await ensureReversePickupTable()
  const rows = await sql.query(`DELETE FROM "LsuReversePickup" WHERE "id"=$1 RETURNING "id"`, [id])
  return rows.length > 0
}

// ── Excel export ─────────────────────────────────────────────────────────

const HEAD = "FF1B7339"
const SUB = "FFE8F3EA"

export async function lsuWasteExcel(report: LsuWasteReport) {
  const wb = new ExcelJS.Workbook()
  wb.creator = "Buffindia"
  const thin = { style: "thin" as const, color: { argb: "FFD0D5DD" } }
  const box = { top: thin, left: thin, bottom: thin, right: thin }
  const styleHeader = (row: ExcelJS.Row) =>
    row.eachCell((c) => {
      c.font = { bold: true, color: { argb: "FFFFFFFF" } }
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEAD } }
      c.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
      c.border = box
    })
  const styleTotal = (row: ExcelJS.Row) =>
    row.eachCell((c) => {
      c.font = { bold: true }
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SUB } }
      c.border = box
    })

  const matrix = (title: string, pick: (r: LsuWasteRow) => number[], total: (r: LsuWasteRow) => number, totals: number[], extra: [string, (r: LsuWasteRow) => string | number, string | number][]) => {
    const ws = wb.addWorksheet(title, { views: [{ state: "frozen", xSplit: 1, ySplit: 2 }] })
    ws.getCell(1, 1).value = `${title} — ${report.label} (kg)`
    ws.getCell(1, 1).font = { bold: true, size: 13 }
    const head = ws.getRow(2)
    ;["LSU", ...extra.map((e) => e[0]), ...report.months, "Total"].forEach((h, i) => (head.getCell(i + 1).value = h))
    styleHeader(head)
    head.height = 30
    report.rows.forEach((r, ri) => {
      const row = ws.getRow(3 + ri)
      const vals = [r.lsuName, ...extra.map((e) => e[1](r)), ...pick(r).map((v) => v || null), total(r)]
      vals.forEach((v, i) => (row.getCell(i + 1).value = v))
      row.eachCell({ includeEmpty: true }, (c) => (c.border = box))
    })
    const t = ws.getRow(3 + report.rows.length)
    ;["Total", ...extra.map((e) => e[2]), ...totals, totals.reduce((s, v) => s + v, 0)].forEach((v, i) => (t.getCell(i + 1).value = typeof v === "number" ? r3(v) : v))
    styleTotal(t)
    ws.getColumn(1).width = 24
    extra.forEach((_, i) => (ws.getColumn(2 + i).width = 13))
    for (let i = 0; i < 13; i++) ws.getColumn(2 + extra.length + i).width = 10
    ws.columns.forEach((col, i) => {
      if (i > extra.length) col.numFmt = "#,##0.###"
    })
  }

  matrix("Waste Collected", (r) => r.collected, (r) => r.collectedTotal, report.totals.collected, [
    ["Technician", (r) => r.technician || "—", ""],
    ["Active customers", (r) => r.activeCustomers, report.totals.activeCustomers],
    ["Active kiosks", (r) => r.activeKiosks, report.totals.activeKiosks],
    ["Collections", (r) => r.collections, report.totals.collections],
  ])
  matrix("Reverse Pickup", (r) => r.dispatched, (r) => r.dispatchedTotal, report.totals.dispatched, [
    ["Pickups", (r) => r.pickups, report.totals.pickups],
    ["Received at plant", (r) => r.receivedTotal || 0, report.totals.receivedTotal],
    ["Last pickup", (r) => r.lastPickupDate || "—", ""],
    ["Since last pickup", (r) => (r.sinceLastPickup == null ? "—" : r.sinceLastPickup), ""],
  ])

  const ws = wb.addWorksheet("Pickups", { views: [{ state: "frozen", ySplit: 1 }] })
  const cols: [string, number, (p: ReversePickup) => string | number | null][] = [
    ["Pickup date", 12, (p) => p.pickupDate],
    ["LSU", 22, (p) => p.lsuName],
    ["Dispatched (kg)", 14, (p) => p.weightKg],
    ["Boxes", 8, (p) => p.boxes],
    ["Courier", 16, (p) => p.courier],
    ["AWB / Tracking", 20, (p) => p.awb],
    ["Status", 12, (p) => p.status],
    ["Received date", 13, (p) => p.receivedDate],
    ["Received (kg)", 13, (p) => p.receivedWeightKg],
    ["Cost (₹)", 11, (p) => p.cost],
    ["Notes", 36, (p) => p.notes],
  ]
  const head = ws.getRow(1)
  cols.forEach(([h, w], i) => {
    head.getCell(i + 1).value = h
    ws.getColumn(i + 1).width = w
  })
  styleHeader(head)
  report.pickups.forEach((p, ri) => {
    const row = ws.getRow(2 + ri)
    cols.forEach(([, , f], i) => (row.getCell(i + 1).value = f(p)))
    row.eachCell({ includeEmpty: true }, (c) => (c.border = box))
  })

  return {
    buffer: Buffer.from(await wb.xlsx.writeBuffer()),
    filename: `LSU-Waste-${report.label.replace(/\s+/g, "-")}.xlsx`,
  }
}
