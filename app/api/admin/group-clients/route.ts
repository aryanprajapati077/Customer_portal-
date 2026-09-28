import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { hashPassword } from "@/lib/password"
import { formatGroupCustomerId, parseGroupCustomerIdNumber } from "@/lib/india-locations"
import { ensureGroupColumns, getGroupLocations } from "@/lib/group-customer-access"
import { generatePortalPassword } from "@/lib/welcome-email"
import { queueEmail } from "@/lib/email-queue"
import {
  defaultEmailEnabled,
  defaultPocStatus,
  normalizeCollectionPocs,
} from "@/lib/poc-config"

async function sendGroupWelcomeEmail(options: {
  to: string
  companyName: string
  customerId: string
  password: string
  locationCount?: number
}) {
  const { sendNotificationEmail } = await import("@/lib/send-notification-email")
  return sendNotificationEmail({
    templateId: "group_portal_welcome",
    to: options.to,
    label: "group-welcome",
    otpHighlight: options.password,
    vars: {
      name: options.companyName.split(" ")[0] || "Partner",
      company: options.companyName,
      customerId: options.customerId,
      email: options.to,
      password: options.password,
      locationCount: String(options.locationCount ?? 0),
    },
  })
}

async function nextGroupCustomerId(): Promise<string> {
  const rows = await sql`SELECT id FROM "Customer" WHERE id ~ '^BIG[0-9]+$'`
  let max = 0
  for (const row of rows as { id: string }[]) {
    const n = parseGroupCustomerIdNumber(row.id)
    if (n != null && n > max) max = n
  }
  return formatGroupCustomerId(max + 1)
}

async function ensurePocColumns() {
  await sql.query(`
    ALTER TABLE "Customer"
      ADD COLUMN IF NOT EXISTS "primaryPocName" TEXT,
      ADD COLUMN IF NOT EXISTS "primaryPocEmail" TEXT,
      ADD COLUMN IF NOT EXISTS "primaryPocNumber" TEXT,
      ADD COLUMN IF NOT EXISTS "primaryPocDesignation" TEXT,
      ADD COLUMN IF NOT EXISTS "primaryPocEmailEnabled" BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS "primaryPocStatus" TEXT DEFAULT 'Active',
      ADD COLUMN IF NOT EXISTS "collectionPocs" TEXT
  `)
}

export async function GET() {
  try {
    await ensureGroupColumns()
    await ensurePocColumns()

    const groups = await sql`
      SELECT id, email, "companyName", "isGroup", "createdAt",
             "primaryPocName", "primaryPocEmail", "primaryPocNumber", "primaryPocDesignation",
             "primaryPocEmailEnabled", "primaryPocStatus", "collectionPocs", status
      FROM "Customer"
      WHERE "isGroup" = true
      ORDER BY id ASC
    `

    const available = await sql`
      SELECT id, "companyName", city, state, email
      FROM "Customer"
      WHERE COALESCE("isGroup", false) = false
        AND "parentCustomerId" IS NULL
      ORDER BY "companyName" ASC
    `

    const groupsWithLocations = await Promise.all(
      (
        groups as {
          id: string
          email: string
          companyName: string
          isGroup: boolean
          createdAt: string
          primaryPocName: string | null
          primaryPocEmail: string | null
          primaryPocNumber: string | null
          primaryPocDesignation: string | null
          primaryPocEmailEnabled: boolean | null
          primaryPocStatus: string | null
          collectionPocs: string | null
          status: string
        }[]
      ).map(async (g) => ({
        ...g,
        locations: await getGroupLocations(g.id),
      })),
    )

    return NextResponse.json({
      success: true,
      groups: groupsWithLocations,
      availableCustomers: available,
    })
  } catch (error) {
    console.error("Group clients GET error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureGroupColumns()
    await ensurePocColumns()
    const body = await request.json()
    const action = String(body?.action || "createGroup")

    if (action === "addLocation") {
      const groupId = String(body?.groupId || "").trim()
      const customerId = String(body?.customerId || "").trim()
      if (!groupId || !customerId) {
        return NextResponse.json({ success: false, error: "groupId and customerId required" }, { status: 400 })
      }

      const groupRows = await sql`
        SELECT id FROM "Customer" WHERE id = ${groupId} AND "isGroup" = true LIMIT 1
      `
      if (!groupRows[0]) {
        return NextResponse.json({ success: false, error: "Group not found" }, { status: 404 })
      }

      const childRows = await sql`
        SELECT id, "isGroup", "parentCustomerId"
        FROM "Customer" WHERE id = ${customerId} LIMIT 1
      `
      const child = childRows[0] as { id: string; isGroup?: boolean; parentCustomerId?: string | null } | undefined
      if (!child) {
        return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 })
      }
      if (child.isGroup) {
        return NextResponse.json({ success: false, error: "Cannot add a group as a location" }, { status: 400 })
      }
      if (child.parentCustomerId && child.parentCustomerId !== groupId) {
        return NextResponse.json({ success: false, error: "Customer already linked to another group" }, { status: 400 })
      }

      await sql`
        UPDATE "Customer"
        SET "parentCustomerId" = ${groupId}, "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = ${customerId}
      `

      const locations = await getGroupLocations(groupId)
      return NextResponse.json({ success: true, locations })
    }

    if (action === "removeLocation") {
      const groupId = String(body?.groupId || "").trim()
      const customerId = String(body?.customerId || "").trim()
      if (!groupId || !customerId) {
        return NextResponse.json({ success: false, error: "groupId and customerId required" }, { status: 400 })
      }

      await sql`
        UPDATE "Customer"
        SET "parentCustomerId" = NULL, "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = ${customerId} AND "parentCustomerId" = ${groupId}
      `

      const locations = await getGroupLocations(groupId)
      return NextResponse.json({ success: true, locations })
    }

    if (action === "updatePocs") {
      const groupId = String(body?.groupId || "").trim()
      if (!groupId) {
        return NextResponse.json({ success: false, error: "groupId required" }, { status: 400 })
      }

      const groupRows = await sql`
        SELECT id, email FROM "Customer" WHERE id = ${groupId} AND "isGroup" = true LIMIT 1
      `
      if (!groupRows[0]) {
        return NextResponse.json({ success: false, error: "Group not found" }, { status: 404 })
      }

      const primaryPocName = String(body?.primaryPocName || "").trim()
      const primaryPocEmail = String(body?.primaryPocEmail || "").trim().toLowerCase()
      const primaryPocNumber = String(body?.primaryPocNumber || "").trim()
      const primaryPocDesignation = String(body?.primaryPocDesignation || "").trim()
      const primaryPocEmailEnabled = defaultEmailEnabled(body?.primaryPocEmailEnabled)
      const primaryPocStatus = defaultPocStatus(body?.primaryPocStatus)
      const collectionPocs = normalizeCollectionPocs(body?.collectionPocs)
      const collectionPocsJson = JSON.stringify(collectionPocs)
      const companyName =
        body?.companyName !== undefined
          ? String(body.companyName).trim()
          : undefined

      // Keep group login email in sync with primary POC email when provided.
      const loginEmail = primaryPocEmail.includes("@")
        ? primaryPocEmail
        : String((groupRows[0] as { email: string }).email || "").toLowerCase()

      if (primaryPocEmail.includes("@") && loginEmail !== String((groupRows[0] as { email: string }).email || "").toLowerCase()) {
        const taken = await sql`
          SELECT id FROM "Customer"
          WHERE LOWER(email) = ${loginEmail} AND id <> ${groupId}
          LIMIT 1
        `
        if (taken[0]) {
          return NextResponse.json(
            { success: false, error: "Primary POC email is already used by another account" },
            { status: 409 },
          )
        }
      }

      await sql`
        UPDATE "Customer"
        SET "primaryPocName" = ${primaryPocName || null},
            "primaryPocEmail" = ${primaryPocEmail || null},
            "primaryPocNumber" = ${primaryPocNumber || null},
            "primaryPocDesignation" = ${primaryPocDesignation || null},
            "primaryPocEmailEnabled" = ${primaryPocEmailEnabled},
            "primaryPocStatus" = ${primaryPocStatus},
            "collectionPocs" = ${collectionPocsJson},
            email = ${loginEmail},
            "contactPerson" = ${primaryPocName || null},
            phone = ${primaryPocNumber || null},
            "companyName" = COALESCE(${companyName || null}, "companyName"),
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = ${groupId}
      `

      const updated = await sql`
        SELECT id, email, "companyName", "isGroup", "createdAt",
               "primaryPocName", "primaryPocEmail", "primaryPocNumber", "primaryPocDesignation",
               "primaryPocEmailEnabled", "primaryPocStatus", "collectionPocs", status
        FROM "Customer"
        WHERE id = ${groupId}
        LIMIT 1
      `
      const locations = await getGroupLocations(groupId)
      return NextResponse.json({
        success: true,
        group: { ...(updated[0] as object), locations },
      })
    }

    if (action === "deleteGroup") {
      const groupId = String(body?.groupId || "").trim()
      if (!groupId) {
        return NextResponse.json({ success: false, error: "groupId required" }, { status: 400 })
      }

      const groupRows = await sql`
        SELECT id FROM "Customer" WHERE id = ${groupId} AND "isGroup" = true LIMIT 1
      `
      if (!groupRows[0]) {
        return NextResponse.json({ success: false, error: "Group not found" }, { status: 404 })
      }

      await sql`
        UPDATE "Customer"
        SET "parentCustomerId" = NULL, "updatedAt" = CURRENT_TIMESTAMP
        WHERE "parentCustomerId" = ${groupId}
      `
      await sql`DELETE FROM "Customer" WHERE id = ${groupId}`
      return NextResponse.json({ success: true, deleted: groupId })
    }

    if (action === "resendWelcome") {
      const groupId = String(body?.groupId || "").trim()
      if (!groupId) {
        return NextResponse.json({ success: false, error: "groupId required" }, { status: 400 })
      }

      const groupRows = await sql`
        SELECT id, email, "companyName"
        FROM "Customer"
        WHERE id = ${groupId} AND "isGroup" = true
        LIMIT 1
      `
      const group = groupRows[0] as
        | { id: string; email: string; companyName: string }
        | undefined
      if (!group) {
        return NextResponse.json({ success: false, error: "Group not found" }, { status: 404 })
      }

      const password = generatePortalPassword()
      const hashed = await hashPassword(password)
      await sql`
        UPDATE "Customer"
        SET password = ${hashed}, "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = ${groupId}
      `

      const locations = await getGroupLocations(groupId)
      queueEmail("group-welcome-resend", () =>
        sendGroupWelcomeEmail({
          to: group.email,
          companyName: group.companyName,
          customerId: group.id,
          password,
          locationCount: locations.length,
        }),
      )

      return NextResponse.json({
        success: true,
        welcomeEmailQueued: true,
        generatedPassword: password,
      })
    }

    const companyName = String(body?.companyName || "").trim()
    const primaryPocName = String(body?.primaryPocName || "").trim()
    const primaryPocEmail = String(body?.primaryPocEmail || body?.email || "")
      .trim()
      .toLowerCase()
    const primaryPocNumber = String(body?.primaryPocNumber || "").trim()
    const email = primaryPocEmail || String(body?.email || "").trim().toLowerCase()
    let password = String(body?.password || "").trim()
    if (!companyName || !email) {
      return NextResponse.json(
        { success: false, error: "Group name and login email (or primary POC email) required" },
        { status: 400 },
      )
    }
    if (!password) password = generatePortalPassword()

    const existing = await sql`SELECT id FROM "Customer" WHERE LOWER(email) = ${email} LIMIT 1`
    if (existing[0]) {
      return NextResponse.json({ success: false, error: "Email already in use" }, { status: 409 })
    }

    const id = await nextGroupCustomerId()
    const hashed = await hashPassword(password)

    await sql`
      INSERT INTO "Customer" (
        id, email, password, "companyName", status, "isGroup", "joinDate", "updatedAt",
        "kraftrebornCredits", "noOfKiosk",
        "primaryPocName", "primaryPocEmail", "primaryPocNumber",
        "primaryPocEmailEnabled", "primaryPocStatus",
        "contactPerson", phone, "collectionPocs"
      ) VALUES (
        ${id}, ${email}, ${hashed}, ${companyName}, 'Active', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
        0, 0,
        ${primaryPocName || null}, ${primaryPocEmail || email}, ${primaryPocNumber || null},
        ${true}, ${"Active"},
        ${primaryPocName || null}, ${primaryPocNumber || null}, ${"[]"}
      )
    `

    queueEmail("group-welcome", () =>
      sendGroupWelcomeEmail({
        to: email,
        companyName,
        customerId: id,
        password,
        locationCount: 0,
      }),
    )

    return NextResponse.json({
      success: true,
      group: {
        id,
        email,
        companyName,
        isGroup: true,
        primaryPocName: primaryPocName || null,
        primaryPocEmail: primaryPocEmail || email,
        primaryPocNumber: primaryPocNumber || null,
        collectionPocs: "[]",
        locations: [],
      },
      generatedPassword: password,
      welcomeEmailQueued: true,
    })
  } catch (error) {
    console.error("Group clients POST error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
