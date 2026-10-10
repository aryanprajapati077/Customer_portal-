import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import {
  PENDING_VERIFICATION_STATUS,
  ensureCollectionVerificationColumns,
  refreshCustomerWaste,
} from "@/lib/collection-verification"

export async function GET(request: NextRequest) {
  try {
    await ensureCollectionVerificationColumns()
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
    await ensureCollectionVerificationColumns()
    const body = await request.json()
    const customerId = String(body?.customerId || "")
    const weight = Number(body?.weight)
    const location = body?.location ? String(body.location) : null
    // New entries stay pending until an operations manager verifies them.
    const status = PENDING_VERIFICATION_STATUS
    const collectionDate = body?.date ? String(body.date) : null
    const notes = body?.notes != null ? String(body.notes) : null

    if (!customerId || !Number.isFinite(weight)) {
      return NextResponse.json({ success: false, error: "customerId and weight required" }, { status: 400 })
    }

    const id = `col_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const dateValue = collectionDate ? new Date(collectionDate).toISOString() : new Date().toISOString()

    const rows = await sql`
      INSERT INTO "Collection" (
        id, "customerId", date, weight, location, status, notes, "verificationStatus"
      )
      VALUES (
        ${id}, ${customerId}, ${dateValue}, ${weight}, ${location}, ${status}, ${notes}, 'pending'
      )
      RETURNING *
    `

    return NextResponse.json({ success: true, collection: rows?.[0] || null })
  } catch (error) {
    console.error("Error creating collection (admin):", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await ensureCollectionVerificationColumns()
    const body = await request.json()
    const id = String(body?.id || "")
    if (!id) return NextResponse.json({ success: false, error: "Collection id required" }, { status: 400 })

    const existing = await sql`
      SELECT id, "customerId", date, weight, location, status, notes, "verificationStatus"
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
      verificationStatus?: string | null
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
    let status = body?.status !== undefined ? String(body.status) : row.status
    if (
      status.toLowerCase() === "completed" &&
      row.verificationStatus !== "verified" &&
      String(row.status).toLowerCase() !== "completed"
    ) {
      return NextResponse.json(
        { success: false, error: "Verify this collection on Reverify Collections before it becomes final." },
        { status: 400 },
      )
    }
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

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const id = String(body?.id || request.nextUrl.searchParams.get("id") || "").trim()
    if (!id) {
      return NextResponse.json({ success: false, error: "Collection id required" }, { status: 400 })
    }

    const existing = await sql`
      SELECT id, "customerId"
      FROM "Collection"
      WHERE id = ${id}
      LIMIT 1
    `
    if (!existing?.[0]) {
      return NextResponse.json({ success: false, error: "Collection not found" }, { status: 404 })
    }

    const customerId = String((existing[0] as { customerId: string }).customerId)

    await sql`DELETE FROM "Collection" WHERE id = ${id}`
    await refreshCustomerWaste(customerId)

    return NextResponse.json({ success: true, id, customerId })
  } catch (error) {
    console.error("Error deleting collection (admin):", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
