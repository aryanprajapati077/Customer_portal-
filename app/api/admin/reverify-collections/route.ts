import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAdminSession } from "@/lib/admin-auth-server"
import {
  ensureCollectionVerificationColumns,
  refreshCustomerWaste,
} from "@/lib/collection-verification"

const SELECT = `
  SELECT c.id, c."customerId", c.date, c.weight, c.location, c.status, c.notes,
         c."verificationStatus", c."verifiedBy", c."verifiedAt",
         cu."companyName", cu."lsuName", cu."lsuTechnicianName", cu."operationsIncharge"
  FROM "Collection" c
  JOIN "Customer" cu ON cu.id = c."customerId"
`

export async function GET(request: NextRequest) {
  try {
    await ensureCollectionVerificationColumns()
    const verification = String(request.nextUrl.searchParams.get("verification") || "pending")
    const month = request.nextUrl.searchParams.get("month")
    const lsu = request.nextUrl.searchParams.get("lsu")
    const manager = request.nextUrl.searchParams.get("manager")
    const q = String(request.nextUrl.searchParams.get("q") || "").trim()
    const take = Math.min(2000, Math.max(1, Number(request.nextUrl.searchParams.get("take") || "500")))

    const values: unknown[] = []
    let i = 1
    let text = SELECT + " WHERE 1=1"

    if (verification === "pending") {
      text += ` AND COALESCE(c."verificationStatus", 'pending') <> 'verified'`
    } else if (verification === "verified") {
      text += ` AND c."verificationStatus" = 'verified'`
    }

    if (month && month !== "all") {
      text += ` AND to_char(c.date, 'YYYY-MM') = $${i++}`
      values.push(month)
    }
    if (lsu && lsu !== "all") {
      text += ` AND cu."lsuName" = $${i++}`
      values.push(lsu)
    }
    if (manager && manager !== "all") {
      text += ` AND cu."operationsIncharge" = $${i++}`
      values.push(manager)
    }
    if (q) {
      text += ` AND (
        c."customerId" ILIKE $${i}
        OR cu."companyName" ILIKE $${i}
        OR COALESCE(cu."lsuName", '') ILIKE $${i}
        OR COALESCE(c."verifiedBy", '') ILIKE $${i}
        OR COALESCE(c.location, '') ILIKE $${i}
      )`
      values.push(`%${q}%`)
      i++
    }

    text += ` ORDER BY c.date DESC LIMIT $${i++}`
    values.push(take)

    const rows = await sql.query(text, values)
    return NextResponse.json({ success: true, collections: rows })
  } catch (error) {
    console.error("reverify-collections GET:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

async function notifyCompleted(customerId: string, dateValue: string, weight: number, location: string | null) {
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
    if (!customer) return
    const d = new Date(dateValue)
    const month = d.toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    const to = String(customer.primaryPocEmail || customer.email || "")
      .toLowerCase()
      .trim()
    if (!to.includes("@")) return
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
  } catch (err) {
    console.error("Collection completed email failed:", err)
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureCollectionVerificationColumns()
    const session = await requireAdminSession(request)
    const verifier = session?.name?.trim() || session?.email || "Admin"
    const body = await request.json()
    const ids = Array.isArray(body?.ids)
      ? body.ids.map((id: unknown) => String(id || "").trim()).filter(Boolean)
      : body?.id
        ? [String(body.id)]
        : []
    if (!ids.length) {
      return NextResponse.json({ success: false, error: "Collection id required" }, { status: 400 })
    }

    const verified: string[] = []
    for (const id of ids) {
      const existing = await sql`
        SELECT id, "customerId", date, weight, location, status, "verificationStatus"
        FROM "Collection" WHERE id = ${id} LIMIT 1
      `
      const row = existing[0] as
        | {
            id: string
            customerId: string
            date: Date
            weight: number
            location: string | null
            status: string
            verificationStatus: string | null
          }
        | undefined
      if (!row) continue
      if (row.verificationStatus === "verified" && String(row.status).toLowerCase() === "completed") {
        verified.push(id)
        continue
      }

      const now = new Date().toISOString()
      await sql`
        UPDATE "Collection"
        SET status = 'Completed',
            "verificationStatus" = 'verified',
            "verifiedBy" = ${verifier},
            "verifiedAt" = ${now}
        WHERE id = ${id}
      `
      await refreshCustomerWaste(row.customerId)
      await notifyCompleted(row.customerId, new Date(row.date).toISOString(), Number(row.weight), row.location)
      verified.push(id)
    }

    return NextResponse.json({ success: true, verified, verifiedBy: verifier })
  } catch (error) {
    console.error("reverify-collections POST:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
