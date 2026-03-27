import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { randomBytes } from "crypto"

function generateCuid(): string {
  const timestamp = Date.now().toString(36)
  const random = randomBytes(10).toString("hex")
  return `c${timestamp}${random}`.slice(0, 25)
}

export async function GET() {
  try {
    const rows = await sql`
      SELECT id, email, "companyName", "contactPerson", phone, address, status,
             "totalWasteCollected", "disposalUnitInstalled", "updatedAt",
             "isGroup", "parentCustomerId"
      FROM "Customer"
      ORDER BY "updatedAt" DESC
      LIMIT 200
    `
    return NextResponse.json({ success: true, customers: rows })
  } catch (error) {
    console.error("Error fetching customers:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id: providedId,
      email,
      password,
      companyName,
      contactPerson,
      phone,
      address,
      industry,
      employeeCount,
      status,
      disposalUnitInstalled,
      totalWasteCollected,
      cigaretteButtsCollected,
      microplasticsUpcycled,
      waterResourcesProtected,
      pendingCollection,
      certificatesEarned,
      co2Saved,
      treesEquivalent,
      monthlyTarget,
      profileImageUrl,
      notes,
      isGroup,
      parentCustomerId,
    } = body

    if (!email || !password || !companyName) {
      return NextResponse.json(
        { success: false, error: "Email, password, and company name are required" },
        { status: 400 }
      )
    }

    const emailLower = String(email).toLowerCase().trim()

    const existing = await sql`
      SELECT id FROM "Customer" WHERE email = ${emailLower} LIMIT 1
    `
    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json({ success: false, error: "Email already exists" }, { status: 400 })
    }

    const num = (v: unknown, def = 0) =>
      v != null && Number.isFinite(Number(v)) ? Number(v) : def
    const int = (v: unknown, def = 0) => Math.floor(num(v, def))

    const id = (providedId && String(providedId).trim()) || generateCuid()
    if (providedId && String(providedId).trim()) {
      const idExists = await sql`SELECT id FROM "Customer" WHERE id = ${id} LIMIT 1`
      if (Array.isArray(idExists) && idExists.length > 0) {
        return NextResponse.json({ success: false, error: "ID already exists" }, { status: 400 })
      }
    }
    const now = new Date().toISOString()

    const rows = await sql`
      INSERT INTO "Customer" (
        id, email, password, "companyName", "contactPerson", phone, address, industry,
        "employeeCount", status, "disposalUnitInstalled",
        "totalWasteCollected", "cigaretteButtsCollected", "microplasticsUpcycled",
        "waterResourcesProtected", "pendingCollection", "certificatesEarned",
        "co2Saved", "treesEquivalent", "monthlyTarget", "profileImageUrl", notes,
        "isGroup", "parentCustomerId", "createdAt", "updatedAt"
      ) VALUES (
        ${id},
        ${emailLower},
        ${String(password)},
        ${String(companyName).trim()},
        ${contactPerson ? String(contactPerson).trim() : null},
        ${phone ? String(phone).trim() : null},
        ${address ? String(address).trim() : null},
        ${industry ? String(industry).trim() : null},
        ${int(employeeCount)},
        ${status || "Active"},
        ${int(disposalUnitInstalled)},
        ${num(totalWasteCollected)},
        ${num(cigaretteButtsCollected)},
        ${num(microplasticsUpcycled)},
        ${num(waterResourcesProtected)},
        ${num(pendingCollection)},
        ${int(certificatesEarned)},
        ${num(co2Saved)},
        ${int(treesEquivalent)},
        ${num(monthlyTarget)},
        ${profileImageUrl ? String(profileImageUrl).trim() : null},
        ${notes ? String(notes).trim() : null},
        ${Boolean(isGroup)},
        ${parentCustomerId ? String(parentCustomerId) : null},
        ${now},
        ${now}
      )
      RETURNING id, email, "companyName", "contactPerson", phone, address, status,
                "totalWasteCollected", "disposalUnitInstalled", "monthlyTarget",
                "isGroup", "parentCustomerId", "createdAt", "updatedAt"
    `

    const customerData = Array.isArray(rows) && rows.length > 0 ? rows[0] : { id, email: emailLower, companyName: String(companyName).trim(), contactPerson: contactPerson || null, phone: phone || null, address: address || null, status: status || "Active", totalWasteCollected: num(totalWasteCollected), disposalUnitInstalled: int(disposalUnitInstalled), monthlyTarget: num(monthlyTarget), isGroup: Boolean(isGroup), parentCustomerId: parentCustomerId || null }
    return NextResponse.json({ success: true, customer: customerData })
  } catch (error: unknown) {
    console.error("Error creating customer:", error)
    const errMsg = error instanceof Error ? error.message : "Server error"
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const id = String(body?.id || "")
    if (!id) return NextResponse.json({ success: false, error: "Customer id required" }, { status: 400 })

    const updates: string[] = []
    const values: any[] = []
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
    if (body?.status !== undefined) {
      updates.push(`status = $${i++}`)
      values.push(String(body.status))
    }
    if (body?.isGroup !== undefined) {
      updates.push(`"isGroup" = $${i++}`)
      values.push(Boolean(body.isGroup))
    }
    if (body?.parentCustomerId !== undefined) {
      updates.push(`"parentCustomerId" = $${i++}`)
      values.push(body.parentCustomerId ? String(body.parentCustomerId) : null)
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
                "totalWasteCollected", "disposalUnitInstalled", "monthlyTarget", "updatedAt",
                "isGroup", "parentCustomerId"
    `
    values.push(id)

    const rows = await sql.query(query, values)

    return NextResponse.json({ success: true, customer: rows?.[0] || null })
  } catch (error) {
    console.error("Error updating customer:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

