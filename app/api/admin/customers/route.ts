import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { hashPassword } from "@/lib/password"
import {
  COLLECTION_FREQUENCY_OPTIONS,
  formatCustomerId,
  parseCustomerIdNumber,
} from "@/lib/india-locations"
import { generatePortalPassword } from "@/lib/welcome-email"
import { saveBase64Image } from "@/lib/upload"

type CollectionPoc = {
  name: string
  email: string
  number: string
  designation?: string
}

async function ensureCustomerColumns() {
  // Run once per server process — avoid ALTER TABLE on every list request
  const g = globalThis as typeof globalThis & { __buffCustomerCols?: Promise<void> }
  if (!g.__buffCustomerCols) {
    g.__buffCustomerCols = sql
      .query(
        `
    ALTER TABLE "Customer"
      ADD COLUMN IF NOT EXISTS "tradeName" TEXT,
      ADD COLUMN IF NOT EXISTS "city" TEXT,
      ADD COLUMN IF NOT EXISTS "state" TEXT,
      ADD COLUMN IF NOT EXISTS "lsuName" TEXT,
      ADD COLUMN IF NOT EXISTS "lsuTechnicianName" TEXT,
      ADD COLUMN IF NOT EXISTS "operationsIncharge" TEXT,
      ADD COLUMN IF NOT EXISTS "primaryPocName" TEXT,
      ADD COLUMN IF NOT EXISTS "primaryPocEmail" TEXT,
      ADD COLUMN IF NOT EXISTS "primaryPocNumber" TEXT,
      ADD COLUMN IF NOT EXISTS "primaryPocDesignation" TEXT,
      ADD COLUMN IF NOT EXISTS "collectionPocs" TEXT,
      ADD COLUMN IF NOT EXISTS "serviceStartDate" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "noOfKiosk" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "noOfBasicKiosk" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "noOfAdvanceKiosk" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "noOfPanVendorKiosk" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "noOfWallMountKiosk" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "collectionFrequency" TEXT,
      ADD COLUMN IF NOT EXISTS "gstin" TEXT,
      ADD COLUMN IF NOT EXISTS "logoUrl" TEXT,
      ADD COLUMN IF NOT EXISTS "serviceStatus" TEXT DEFAULT 'ACTIVE',
      ADD COLUMN IF NOT EXISTS "contractEndDate" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "welcomeEmailSentAt" TIMESTAMP(3)
  `,
      )
      .then(() => undefined)
      .catch((err) => {
        g.__buffCustomerCols = undefined
        throw err
      })
  }
  await g.__buffCustomerCols
}

async function nextCustomerId(): Promise<string> {
  const rows = await sql`
    SELECT id FROM "Customer" WHERE id ~ '^BI[0-9]+$'
  `
  let max = 0
  for (const row of rows as { id: string }[]) {
    const n = parseCustomerIdNumber(row.id)
    if (n != null && n > max) max = n
  }
  return formatCustomerId(max + 1)
}

function normalizeCollectionPocs(raw: unknown): CollectionPoc[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((p) => ({
      name: String(p?.name || "").trim(),
      email: String(p?.email || "").trim().toLowerCase(),
      number: String(p?.number || "").trim(),
      designation: String(p?.designation || "").trim() || undefined,
    }))
    .filter((p) => p.name || p.email || p.number)
}

export async function GET(request: NextRequest) {
  try {
    const nextIdOnly = request.nextUrl.searchParams.get("nextId") === "1"
    const fields = request.nextUrl.searchParams.get("fields") || ""
    const take = Math.min(1000, Math.max(1, Number(request.nextUrl.searchParams.get("take") || "500")))
    const offset = Math.max(0, Number(request.nextUrl.searchParams.get("offset") || "0"))
    const q = String(request.nextUrl.searchParams.get("q") || "").trim()

    // Slim dropdown payload — skip DDL and heavy columns
    if (fields === "options") {
      const pattern = q ? `%${q}%` : null
      const rows = pattern
        ? await sql`
            SELECT id, email, "companyName", status, "kraftrebornCredits"
            FROM "Customer"
            WHERE id ILIKE ${pattern}
               OR email ILIKE ${pattern}
               OR "companyName" ILIKE ${pattern}
            ORDER BY "companyName" ASC NULLS LAST, id ASC
            LIMIT ${take}
          `
        : await sql`
            SELECT id, email, "companyName", status, "kraftrebornCredits"
            FROM "Customer"
            ORDER BY "companyName" ASC NULLS LAST, id ASC
            LIMIT ${take}
          `
      return NextResponse.json({ success: true, customers: rows })
    }

    await ensureCustomerColumns()

    if (nextIdOnly) {
      const id = await nextCustomerId()
      return NextResponse.json({ success: true, nextId: id })
    }

    const pattern = q ? `%${q}%` : null
    const rows = pattern
      ? await sql`
          SELECT id, email, "companyName", "tradeName", city, state, gstin, "logoUrl",
                 "lsuName", "lsuTechnicianName", "operationsIncharge",
                 "contactPerson", phone, address, status,
                 "primaryPocName", "primaryPocEmail", "primaryPocNumber", "primaryPocDesignation",
                 "collectionPocs", "collectionFrequency",
                 "noOfKiosk", "noOfBasicKiosk", "noOfAdvanceKiosk", "noOfPanVendorKiosk", "noOfWallMountKiosk",
                 "serviceStartDate",
                 "serviceStatus", "contractEndDate",
                 "totalWasteCollected", "disposalUnitInstalled", "monthlyTarget",
                 "kraftrebornCredits", "updatedAt", "createdAt",
                 "isGroup", "parentCustomerId", "welcomeEmailSentAt"
          FROM "Customer"
          WHERE id ILIKE ${pattern}
             OR email ILIKE ${pattern}
             OR "companyName" ILIKE ${pattern}
             OR "tradeName" ILIKE ${pattern}
             OR gstin ILIKE ${pattern}
             OR city ILIKE ${pattern}
             OR state ILIKE ${pattern}
          ORDER BY id ASC
          LIMIT ${take} OFFSET ${offset}
        `
      : await sql`
          SELECT id, email, "companyName", "tradeName", city, state, gstin, "logoUrl",
                 "lsuName", "lsuTechnicianName", "operationsIncharge",
                 "contactPerson", phone, address, status,
                 "primaryPocName", "primaryPocEmail", "primaryPocNumber", "primaryPocDesignation",
                 "collectionPocs", "collectionFrequency",
                 "noOfKiosk", "noOfBasicKiosk", "noOfAdvanceKiosk", "noOfPanVendorKiosk", "noOfWallMountKiosk",
                 "serviceStartDate",
                 "serviceStatus", "contractEndDate",
                 "totalWasteCollected", "disposalUnitInstalled", "monthlyTarget",
                 "kraftrebornCredits", "updatedAt", "createdAt",
                 "isGroup", "parentCustomerId", "welcomeEmailSentAt"
          FROM "Customer"
          ORDER BY id ASC
          LIMIT ${take} OFFSET ${offset}
        `
    return NextResponse.json({ success: true, customers: rows })
  } catch (error) {
    console.error("Error fetching customers:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureCustomerColumns()
    const body = await request.json()

    const brandName = String(body.brandName || body.companyName || "").trim()
    const tradeName = String(body.tradeName || "").trim()
    const city = String(body.city || "").trim()
    const state = String(body.state || "").trim()
    const lsuName = String(body.lsuName || "").trim()
    const lsuTechnicianName = String(body.lsuTechnicianName || "").trim()
    const operationsIncharge = String(body.operationsIncharge || "").trim()
    const primaryPocName = String(body.primaryPocName || "").trim()
    const primaryPocEmail = String(body.primaryPocEmail || "").trim().toLowerCase()
    const primaryPocNumber = String(body.primaryPocNumber || "").trim()
    const primaryPocDesignation = String(body.primaryPocDesignation || "").trim()
    const collectionFrequency = String(body.collectionFrequency || "").trim()
    const serviceStartDateRaw = String(body.serviceStartDate || "").trim()
    const gstin = String(body.gstin || "").trim().toUpperCase()
    const collectionPocs = normalizeCollectionPocs(body.collectionPocs)

    const num = (v: unknown, def = 0) =>
      v != null && Number.isFinite(Number(v)) ? Number(v) : def
    const int = (v: unknown, def = 0) => Math.floor(num(v, def))

    const noOfKiosk = int(body.noOfKiosk)
    const noOfBasicKiosk = int(body.noOfBasicKiosk)
    const noOfAdvanceKiosk = int(body.noOfAdvanceKiosk)
    const noOfPanVendorKiosk = int(body.noOfPanVendorKiosk)
    const noOfWallMountKiosk = int(body.noOfWallMountKiosk)
    const kraftrebornCredits =
      body.kraftrebornCredits !== "" && body.kraftrebornCredits != null
        ? Math.max(0, Math.floor(num(body.kraftrebornCredits)))
        : NaN

    const missing: string[] = []
    if (!brandName) missing.push("Customer Brand Name")
    if (!tradeName) missing.push("Customer Trade Name")
    if (!city) missing.push("City")
    if (!state) missing.push("State")
    if (!lsuName) missing.push("LSU Name")
    if (!lsuTechnicianName) missing.push("LSU Technician Name")
    if (!operationsIncharge) missing.push("Operations Incharge")
    if (!primaryPocName) missing.push("Primary POC name")
    if (!primaryPocEmail) missing.push("Primary POC Email")
    if (!primaryPocNumber) missing.push("Primary POC Number")
    if (!serviceStartDateRaw) missing.push("Service Start Date")
    if (!collectionFrequency) missing.push("Collection Frequency")
    if (body.noOfKiosk === "" || body.noOfKiosk == null || noOfKiosk < 0) {
      missing.push("No. Of Kiosk")
    }
    if (
      body.kraftrebornCredits === "" ||
      body.kraftrebornCredits == null ||
      !Number.isFinite(kraftrebornCredits) ||
      kraftrebornCredits < 0
    ) {
      missing.push("KR Amount")
    }
    if (!collectionPocs.length) {
      missing.push("Collection POC details")
    } else if (collectionPocs.some((p) => !p.name || !p.email || !p.number)) {
      missing.push("Collection POC name, email, and number (all rows)")
    }

    if (missing.length) {
      return NextResponse.json(
        { success: false, error: `Required: ${missing.join(", ")}` },
        { status: 400 },
      )
    }

    if (
      !COLLECTION_FREQUENCY_OPTIONS.includes(
        collectionFrequency as (typeof COLLECTION_FREQUENCY_OPTIONS)[number],
      )
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid collection frequency" },
        { status: 400 },
      )
    }

    const serviceStartDate = new Date(serviceStartDateRaw)
    if (Number.isNaN(serviceStartDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid service start date" },
        { status: 400 },
      )
    }

    const emailLower = primaryPocEmail
    const existing = await sql`
      SELECT id FROM "Customer" WHERE email = ${emailLower} LIMIT 1
    `
    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json(
        { success: false, error: "Primary POC email already exists" },
        { status: 400 },
      )
    }

    const id = await nextCustomerId()
    const tempPassword = generatePortalPassword(10)
    const passwordHash = await hashPassword(tempPassword)
    const now = new Date().toISOString()
    const address = [city, state].filter(Boolean).join(", ")
    const collectionPocsJson = JSON.stringify(collectionPocs)

    let logoUrl: string | null = null
    if (body.logoBase64 && String(body.logoBase64).startsWith("data:")) {
      try {
        const saved = await saveBase64Image(String(body.logoBase64), "logos", `customer-${id}`)
        logoUrl = saved.url
      } catch (logoErr) {
        console.error("Logo upload failed, continuing without file path:", logoErr)
        // Still store data URL so create succeeds; img src accepts data:
        logoUrl = String(body.logoBase64)
      }
    } else if (body.logoUrl) {
      logoUrl = String(body.logoUrl).trim() || null
    }

    const rows = await sql`
      INSERT INTO "Customer" (
        id, email, password, "companyName", "tradeName", city, state, gstin, "logoUrl",
        "lsuName", "lsuTechnicianName", "operationsIncharge",
        "primaryPocName", "primaryPocEmail", "primaryPocNumber", "primaryPocDesignation",
        "collectionPocs", "serviceStartDate",
        "noOfKiosk", "noOfBasicKiosk", "noOfAdvanceKiosk", "noOfPanVendorKiosk", "noOfWallMountKiosk",
        "collectionFrequency", "kraftrebornCredits",
        "contactPerson", phone, address, status, "disposalUnitInstalled",
        "joinDate", "isGroup", "parentCustomerId",
        "createdAt", "updatedAt"
      ) VALUES (
        ${id},
        ${emailLower},
        ${passwordHash},
        ${brandName},
        ${tradeName},
        ${city},
        ${state},
        ${gstin || null},
        ${logoUrl},
        ${lsuName},
        ${lsuTechnicianName},
        ${operationsIncharge},
        ${primaryPocName},
        ${primaryPocEmail},
        ${primaryPocNumber},
        ${primaryPocDesignation || null},
        ${collectionPocsJson},
        ${serviceStartDate.toISOString()},
        ${noOfKiosk},
        ${noOfBasicKiosk},
        ${noOfAdvanceKiosk},
        ${noOfPanVendorKiosk},
        ${noOfWallMountKiosk},
        ${collectionFrequency},
        ${kraftrebornCredits},
        ${primaryPocName},
        ${primaryPocNumber},
        ${address},
        ${"Active"},
        ${noOfKiosk},
        ${serviceStartDate.toISOString()},
        ${false},
        ${null},
        ${now},
        ${now}
      )
      RETURNING id, email, "companyName", "tradeName", city, state, gstin, "logoUrl",
                "primaryPocName", "primaryPocEmail", "primaryPocNumber",
                "collectionFrequency", "noOfKiosk", "kraftrebornCredits", "serviceStartDate",
                "contactPerson", phone, address, status,
                "disposalUnitInstalled", "createdAt", "updatedAt"
    `

    const customerData =
      Array.isArray(rows) && rows.length > 0
        ? rows[0]
        : {
            id,
            email: emailLower,
            companyName: brandName,
            tradeName,
            city,
            state,
          }

    // Welcome email is NOT sent on create — admin sends in bulk after entering all clients.
    return NextResponse.json({
      success: true,
      customer: customerData,
      welcomeEmailSent: false,
      welcomeEmailDeferred: true,
    })
  } catch (error: unknown) {
    console.error("Error creating customer:", error)
    const errMsg = error instanceof Error ? error.message : "Server error"
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await ensureCustomerColumns()
    const body = await request.json()
    const id = String(body?.id || "")
    if (!id) return NextResponse.json({ success: false, error: "Customer id required" }, { status: 400 })

    const hasAbsCredits = body?.kraftrebornCredits !== undefined
    const hasDeltaCredits = body?.kraftrebornCreditsDelta !== undefined
    if (hasAbsCredits && hasDeltaCredits) {
      return NextResponse.json(
        { success: false, error: "Provide either kraftrebornCredits or kraftrebornCreditsDelta" },
        { status: 400 },
      )
    }
    let creditsDelta: number | null = null

    const updates: string[] = []
    const values: unknown[] = []
    let i = 1

    if (body?.disposalUnitInstalled !== undefined) {
      const v = Number(body.disposalUnitInstalled)
      updates.push(`"disposalUnitInstalled" = $${i++}`)
      values.push(Number.isFinite(v) ? v : 0)
    }
    if (body?.monthlyTarget !== undefined) {
      const v = Number(body.monthlyTarget)
      updates.push(`"monthlyTarget" = $${i++}`)
      values.push(Number.isFinite(v) ? v : 0)
    }
    if (hasAbsCredits) {
      const v = Number(body.kraftrebornCredits)
      updates.push(`"kraftrebornCredits" = $${i++}`)
      values.push(Number.isFinite(v) ? v : 0)
    }
    if (hasDeltaCredits) {
      const v = Number(body.kraftrebornCreditsDelta)
      if (!Number.isFinite(v)) {
        return NextResponse.json({ success: false, error: "Invalid kraftrebornCreditsDelta" }, { status: 400 })
      }
      const delta = Math.floor(v)
      creditsDelta = delta
      updates.push(`"kraftrebornCredits" = COALESCE("kraftrebornCredits", 0) + $${i++}`)
      values.push(delta)
    }
    if (body?.status !== undefined) {
      updates.push(`status = $${i++}`)
      values.push(String(body.status))
    }
    if (body?.serviceStatus !== undefined) {
      updates.push(`"serviceStatus" = $${i++}`)
      values.push(String(body.serviceStatus).toUpperCase())
    }
    if (body?.contractEndDate !== undefined) {
      updates.push(`"contractEndDate" = $${i++}`)
      values.push(body.contractEndDate ? new Date(String(body.contractEndDate)).toISOString() : null)
    }
    if (body?.isGroup !== undefined) {
      updates.push(`"isGroup" = $${i++}`)
      values.push(Boolean(body.isGroup))
    }
    if (body?.parentCustomerId !== undefined) {
      updates.push(`"parentCustomerId" = $${i++}`)
      values.push(body.parentCustomerId ? String(body.parentCustomerId) : null)
    }
    if (body?.email !== undefined) {
      const email = String(body.email).toLowerCase().trim()
      if (!email.includes("@")) {
        return NextResponse.json({ success: false, error: "Valid email required" }, { status: 400 })
      }
      updates.push(`email = $${i++}`)
      values.push(email)
    }
    if (body?.primaryPocEmail !== undefined) {
      const email = String(body.primaryPocEmail).toLowerCase().trim()
      if (!email.includes("@")) {
        return NextResponse.json({ success: false, error: "Valid primary POC email required" }, { status: 400 })
      }
      updates.push(`"primaryPocEmail" = $${i++}`)
      values.push(email)
      // Keep login email in sync when primary POC is the login identity
      if (body?.syncLoginEmail) {
        updates.push(`email = $${i++}`)
        values.push(email)
      }
    }

    const setText = (col: string, raw: unknown) => {
      updates.push(`"${col}" = $${i++}`)
      values.push(raw == null || raw === "" ? null : String(raw).trim())
    }
    if (body?.companyName !== undefined || body?.brandName !== undefined) {
      const name = String(body.companyName ?? body.brandName ?? "").trim()
      if (!name) return NextResponse.json({ success: false, error: "Brand name required" }, { status: 400 })
      updates.push(`"companyName" = $${i++}`)
      values.push(name)
    }
    if (body?.tradeName !== undefined) setText("tradeName", body.tradeName)
    if (body?.gstin !== undefined) {
      updates.push(`gstin = $${i++}`)
      values.push(String(body.gstin || "").trim().toUpperCase() || null)
    }
    if (body?.city !== undefined) setText("city", body.city)
    if (body?.state !== undefined) setText("state", body.state)
    if (body?.lsuName !== undefined) setText("lsuName", body.lsuName)
    if (body?.lsuTechnicianName !== undefined) setText("lsuTechnicianName", body.lsuTechnicianName)
    if (body?.operationsIncharge !== undefined) setText("operationsIncharge", body.operationsIncharge)
    if (body?.primaryPocName !== undefined) {
      setText("primaryPocName", body.primaryPocName)
      updates.push(`"contactPerson" = $${i++}`)
      values.push(String(body.primaryPocName || "").trim() || null)
    }
    if (body?.primaryPocNumber !== undefined) {
      setText("primaryPocNumber", body.primaryPocNumber)
      updates.push(`phone = $${i++}`)
      values.push(String(body.primaryPocNumber || "").trim() || null)
    }
    if (body?.primaryPocDesignation !== undefined) setText("primaryPocDesignation", body.primaryPocDesignation)
    if (body?.collectionPocs !== undefined) {
      const pocs = normalizeCollectionPocs(body.collectionPocs)
      updates.push(`"collectionPocs" = $${i++}`)
      values.push(pocs.length ? JSON.stringify(pocs) : null)
    }
    if (body?.collectionFrequency !== undefined) setText("collectionFrequency", body.collectionFrequency)
    if (body?.serviceStartDate !== undefined) {
      updates.push(`"serviceStartDate" = $${i++}`)
      values.push(body.serviceStartDate ? new Date(String(body.serviceStartDate)).toISOString() : null)
    }
    if (body?.noOfKiosk !== undefined) {
      const v = Math.max(0, Math.floor(Number(body.noOfKiosk) || 0))
      updates.push(`"noOfKiosk" = $${i++}`)
      values.push(v)
      updates.push(`"disposalUnitInstalled" = $${i++}`)
      values.push(v)
    }
    for (const col of [
      "noOfBasicKiosk",
      "noOfAdvanceKiosk",
      "noOfPanVendorKiosk",
      "noOfWallMountKiosk",
    ] as const) {
      if (body?.[col] !== undefined) {
        updates.push(`"${col}" = $${i++}`)
        values.push(Math.max(0, Math.floor(Number(body[col]) || 0)))
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 })
    }

    updates.push(`"updatedAt" = CURRENT_TIMESTAMP`)

    const query = `
      UPDATE "Customer"
      SET ${updates.join(", ")}
      WHERE id = $${i}
      RETURNING id, email, "companyName", "contactPerson", phone, address, status,
                "primaryPocEmail",
                "totalWasteCollected", "disposalUnitInstalled", "monthlyTarget",
                "kraftrebornCredits", "updatedAt",
                "isGroup", "parentCustomerId"
    `
    values.push(id)

    const beforeRows = hasAbsCredits || hasDeltaCredits
      ? await sql`SELECT "kraftrebornCredits", email, "primaryPocEmail", "companyName", "contactPerson" FROM "Customer" WHERE id = ${id} LIMIT 1`
      : []

    const rows = await sql.query(query, values)

    if ((hasAbsCredits || hasDeltaCredits) && beforeRows[0]) {
      const before = beforeRows[0] as {
        kraftrebornCredits?: number
        email?: string
        primaryPocEmail?: string | null
        companyName?: string
        contactPerson?: string | null
      }
      const prev = Number(before.kraftrebornCredits) || 0
      const next = hasDeltaCredits ? prev + (creditsDelta ?? 0) : Number(body.kraftrebornCredits)
      const added = next - prev
      if (Number.isFinite(added) && added > 0) {
        const to = String(before.primaryPocEmail || before.email || "")
          .toLowerCase()
          .trim()
        if (to.includes("@")) {
          try {
            const { sendNotificationEmail } = await import("@/lib/send-notification-email")
            await sendNotificationEmail({
              templateId: "kraftreborn_balance_added",
              to,
              vars: {
                name: before.contactPerson?.split(" ")[0] || before.companyName || "Partner",
                company: before.companyName || "",
                amount: String(Math.round(added)),
                balance: String(Math.round(next)),
                customerId: id,
              },
            })
          } catch (err) {
            console.error("Balance added email failed:", err)
          }
        }
      }
    }

    if (body?.resolveEmailIssue || body?.email || body?.primaryPocEmail) {
      const { resolveEmailDeliveryLogsForCustomer } = await import("@/lib/email-delivery-log")
      await resolveEmailDeliveryLogsForCustomer(id, body?.oldEmail ? String(body.oldEmail) : undefined)
      if (body?.emailLogId) {
        const { resolveEmailDeliveryLog } = await import("@/lib/email-delivery-log")
        await resolveEmailDeliveryLog(String(body.emailLogId))
      }
    }

    return NextResponse.json({ success: true, customer: rows?.[0] || null })
  } catch (error) {
    console.error("Error updating customer:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
