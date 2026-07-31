import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

async function refreshCustomerWaste(customerId: string) {
  await sql`
    UPDATE "Customer"
    SET "totalWasteCollected" = (
          SELECT COALESCE(SUM(weight), 0) FROM "Collection" WHERE "customerId" = ${customerId}
        ),
        "cigaretteButtsCollected" = ROUND((
          SELECT COALESCE(SUM(weight), 0) FROM "Collection" WHERE "customerId" = ${customerId}
        ) * 3000),
        "microplasticsUpcycled" = ROUND(((
          SELECT COALESCE(SUM(weight), 0) FROM "Collection" WHERE "customerId" = ${customerId}
        ) * 0.8)::numeric, 2),
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE id = ${customerId}
  `
}

export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get("customerId")
    const month = request.nextUrl.searchParams.get("month")
    const lsu = request.nextUrl.searchParams.get("lsu")
    const take = Math.min(2000, Math.max(1, Number(request.nextUrl.searchParams.get("take") || "500")))

    let rows
    if (customerId && month) {
      rows = await sql`
        SELECT c.id, c."customerId", c.date, c.weight, c.location, c.status, c.notes,
               cu."companyName", cu."lsuName"
        FROM "Collection" c
        JOIN "Customer" cu ON cu.id = c."customerId"
        WHERE c."customerId" = ${customerId}
          AND to_char(c.date, 'YYYY-MM') = ${month}
        ORDER BY c.date DESC
        LIMIT ${take}
      `
    } else if (customerId) {
      rows = await sql`
        SELECT c.id, c."customerId", c.date, c.weight, c.location, c.status, c.notes,
               cu."companyName", cu."lsuName"
        FROM "Collection" c
        JOIN "Customer" cu ON cu.id = c."customerId"
        WHERE c."customerId" = ${customerId}
        ORDER BY c.date DESC
        LIMIT ${take}
      `
    } else if (month && lsu) {
      rows = await sql`
        SELECT c.id, c."customerId", c.date, c.weight, c.location, c.status, c.notes,
               cu."companyName", cu."lsuName"
        FROM "Collection" c
        JOIN "Customer" cu ON cu.id = c."customerId"
        WHERE to_char(c.date, 'YYYY-MM') = ${month}
          AND cu."lsuName" = ${lsu}
        ORDER BY c.date DESC
        LIMIT ${take}
      `
    } else if (month) {
      rows = await sql`
        SELECT c.id, c."customerId", c.date, c.weight, c.location, c.status, c.notes,
               cu."companyName", cu."lsuName"
        FROM "Collection" c
        JOIN "Customer" cu ON cu.id = c."customerId"
        WHERE to_char(c.date, 'YYYY-MM') = ${month}
        ORDER BY c.date DESC
        LIMIT ${take}
      `
    } else if (lsu) {
      rows = await sql`
        SELECT c.id, c."customerId", c.date, c.weight, c.location, c.status, c.notes,
               cu."companyName", cu."lsuName"
        FROM "Collection" c
        JOIN "Customer" cu ON cu.id = c."customerId"
        WHERE cu."lsuName" = ${lsu}
        ORDER BY c.date DESC
        LIMIT ${take}
      `
    } else {
      rows = await sql`
        SELECT c.id, c."customerId", c.date, c.weight, c.location, c.status, c.notes,
               cu."companyName", cu."lsuName"
        FROM "Collection" c
        JOIN "Customer" cu ON cu.id = c."customerId"
        ORDER BY c.date DESC
        LIMIT ${take}
      `
    }

    return NextResponse.json({ success: true, collections: rows })
  } catch (error) {
    console.error("Error fetching collections (admin):", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const customerId = String(body?.customerId || "")
    const weight = Number(body?.weight)
    const location = body?.location ? String(body.location) : null
    const status = body?.status ? String(body.status) : "Completed"
    const collectionDate = body?.date ? String(body.date) : null
    const notes = body?.notes != null ? String(body.notes) : null

    if (!customerId || !Number.isFinite(weight)) {
      return NextResponse.json({ success: false, error: "customerId and weight required" }, { status: 400 })
    }

    const id = `col_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const dateValue = collectionDate ? new Date(collectionDate).toISOString() : new Date().toISOString()

    const rows = await sql`
      INSERT INTO "Collection" (id, "customerId", date, weight, location, status, notes)
      VALUES (${id}, ${customerId}, ${dateValue}, ${weight}, ${location}, ${status}, ${notes})
      RETURNING *
    `

    await refreshCustomerWaste(customerId)

    if (String(status).toLowerCase() === "completed") {
      try {
        const customerRows = await sql`
          SELECT id, email, "primaryPocEmail", "companyName", "contactPerson"
          FROM "Customer" WHERE id = ${customerId} LIMIT 1
        `
        const customer = customerRows[0] as
          | {
              id: string
              email: string
              primaryPocEmail?: string | null
              companyName: string
              contactPerson?: string | null
            }
          | undefined
        if (customer) {
          const d = new Date(dateValue)
          const month = d.toLocaleDateString("en-GB", { month: "long", year: "numeric" })
          const to = String(customer.primaryPocEmail || customer.email || "")
            .toLowerCase()
            .trim()
          if (to.includes("@")) {
            const { sendNotificationEmail } = await import("@/lib/send-notification-email")
            await sendNotificationEmail({
              templateId: "collection_completed",
              to,
              vars: {
                name: customer.contactPerson?.split(" ")[0] || customer.companyName || "Partner",
                company: customer.companyName,
                month,
                weight: String(Number(weight).toFixed(2)),
                location: location || "",
                customerId: customer.id,
              },
            })
          }
        }
      } catch (err) {
        console.error("Collection completed email failed:", err)
      }
    }

    return NextResponse.json({ success: true, collection: rows?.[0] || null })
  } catch (error) {
    console.error("Error creating collection (admin):", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const id = String(body?.id || "")
    if (!id) return NextResponse.json({ success: false, error: "Collection id required" }, { status: 400 })

    const existing = await sql`
      SELECT id, "customerId", date, weight, location, status, notes
      FROM "Collection" WHERE id = ${id} LIMIT 1
    `
    if (!existing?.[0]) {
      return NextResponse.json({ success: false, error: "Collection not found" }, { status: 404 })
    }
    const row = existing[0] as {
      id: string
      customerId: string
      date: Date
      weight: number
      location: string | null
      status: string
      notes: string | null
    }

    const weight =
      body?.weight !== undefined ? Number(body.weight) : Number(row.weight)
    if (!Number.isFinite(weight)) {
      return NextResponse.json({ success: false, error: "Invalid weight" }, { status: 400 })
    }
    const location =
      body?.location !== undefined
        ? body.location
          ? String(body.location)
          : null
        : row.location
    const status = body?.status !== undefined ? String(body.status) : row.status
    const notes =
      body?.notes !== undefined ? (body.notes == null || body.notes === "" ? null : String(body.notes)) : row.notes
    const dateValue =
      body?.date !== undefined
        ? new Date(String(body.date)).toISOString()
        : new Date(row.date).toISOString()
    const customerId =
      body?.customerId !== undefined ? String(body.customerId) : row.customerId

    const updated = await sql`
      UPDATE "Collection"
      SET "customerId" = ${customerId},
          date = ${dateValue},
          weight = ${weight},
          location = ${location},
          status = ${status},
          notes = ${notes}
      WHERE id = ${id}
      RETURNING *
    `

    await refreshCustomerWaste(row.customerId)
    if (customerId !== row.customerId) await refreshCustomerWaste(customerId)

    const withName = await sql`
      SELECT c.id, c."customerId", c.date, c.weight, c.location, c.status, c.notes,
             cu."companyName", cu."lsuName"
      FROM "Collection" c
      JOIN "Customer" cu ON cu.id = c."customerId"
      WHERE c.id = ${id}
      LIMIT 1
    `

    return NextResponse.json({
      success: true,
      collection: withName?.[0] || updated?.[0] || null,
    })
  } catch (error) {
    console.error("Error updating collection (admin):", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
