import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAdminSession } from "@/lib/admin-auth-server"
import { hasAdminPermission } from "@/lib/admin-permissions"

import {
  defaultEmailEnabled,
  defaultPocStatus,
  parseCollectionPocForms,
  type CollectionPocRecord,
} from "@/lib/poc-config"

type CollectionPoc = CollectionPocRecord & {
  emailEnabled?: boolean
  status?: string
}

function parseCollectionPocs(raw: unknown): CollectionPoc[] {
  if (!raw) return []
  if (typeof raw === "string") return parseCollectionPocForms(raw)
  if (Array.isArray(raw)) return parseCollectionPocForms(JSON.stringify(raw))
  return []
}

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }
  if (!hasAdminPermission(session.role, session.permissions, "customer-pocs")) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  try {
    const q = request.nextUrl.searchParams.get("q")?.trim().toLowerCase() || ""
    const rows = await sql`
      SELECT
        id, "companyName", city, state, status,
        email, phone, "contactPerson",
        "primaryPocName", "primaryPocEmail", "primaryPocNumber", "primaryPocDesignation",
        "primaryPocEmailEnabled", "primaryPocStatus",
        "collectionPocs", "serviceStartDate", "joinDate"
      FROM "Customer"
      WHERE COALESCE("isGroup", false) = false
      ORDER BY "companyName" ASC
      LIMIT 2000
    `

    const customers = (rows as Record<string, unknown>[])
      .map((r) => {
        const collectionPocs = parseCollectionPocs(r.collectionPocs)
        return {
          id: String(r.id),
          companyName: String(r.companyName || ""),
          city: r.city ? String(r.city) : "",
          state: r.state ? String(r.state) : "",
          status: String(r.status || ""),
          loginEmail: String(r.email || ""),
          phone: String(r.phone || ""),
          contactPerson: String(r.contactPerson || ""),
          primaryPocName: String(r.primaryPocName || ""),
          primaryPocEmail: String(r.primaryPocEmail || ""),
          primaryPocNumber: String(r.primaryPocNumber || ""),
          primaryPocDesignation: String(r.primaryPocDesignation || ""),
          primaryPocEmailEnabled: defaultEmailEnabled(r.primaryPocEmailEnabled as boolean | null),
          primaryPocStatus: defaultPocStatus(r.primaryPocStatus as string | null),
          collectionPocs,
          serviceStartDate: r.serviceStartDate
            ? new Date(r.serviceStartDate as string | Date).toISOString().slice(0, 10)
            : "",
          joinDate: r.joinDate
            ? new Date(r.joinDate as string | Date).toISOString().slice(0, 10)
            : "",
        }
      })
      .filter((c) => {
        if (!q) return true
        const hay = [
          c.id,
          c.companyName,
          c.city,
          c.state,
          c.primaryPocName,
          c.primaryPocEmail,
          c.primaryPocNumber,
          ...c.collectionPocs.map((p) => `${p.name} ${p.email} ${p.number}`),
        ]
          .join(" ")
          .toLowerCase()
        return hay.includes(q)
      })

    return NextResponse.json({ success: true, customers })
  } catch (error) {
    console.error("Customer POCs GET error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
