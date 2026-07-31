import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import {
  expectedCollectionsForMonth,
  isDueForMonth,
  lastDayOfMonthIso,
  monthKey,
} from "@/lib/pending-collections"

export async function GET(request: NextRequest) {
  try {
    const monthParam = request.nextUrl.searchParams.get("month")
    const lsu = String(request.nextUrl.searchParams.get("lsu") || "").trim()
    const now = new Date()
    const month = monthParam || monthKey(new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)))

    const customers = lsu
      ? await sql`
          SELECT id, "companyName", "tradeName", city, state, "lsuName", "lsuTechnicianName",
                 "operationsIncharge", "collectionFrequency", "serviceStartDate", "joinDate",
                 status, "serviceStatus", "primaryPocName", "primaryPocEmail", "primaryPocNumber",
                 "noOfKiosk"
          FROM "Customer"
          WHERE COALESCE(status, 'Active') ILIKE 'active'
            AND COALESCE("serviceStatus", 'ACTIVE') NOT IN ('INACTIVE')
            AND "lsuName" = ${lsu}
          ORDER BY id ASC
        `
      : await sql`
          SELECT id, "companyName", "tradeName", city, state, "lsuName", "lsuTechnicianName",
                 "operationsIncharge", "collectionFrequency", "serviceStartDate", "joinDate",
                 status, "serviceStatus", "primaryPocName", "primaryPocEmail", "primaryPocNumber",
                 "noOfKiosk"
          FROM "Customer"
          WHERE COALESCE(status, 'Active') ILIKE 'active'
            AND COALESCE("serviceStatus", 'ACTIVE') NOT IN ('INACTIVE')
          ORDER BY id ASC
        `

    const collected = await sql`
      SELECT c."customerId" AS id, COUNT(*)::int AS n, COALESCE(SUM(c.weight), 0)::float AS totalWeight
      FROM "Collection" c
      WHERE to_char(c.date, 'YYYY-MM') = ${month}
      GROUP BY c."customerId"
    `
    const collectedMap = new Map(
      (collected as { id: string; n: number; totalWeight: number }[]).map((r) => [r.id, r]),
    )

    const pending = []
    for (const c of customers as {
      id: string
      companyName: string
      tradeName: string | null
      city: string | null
      state: string | null
      lsuName: string | null
      lsuTechnicianName: string | null
      operationsIncharge: string | null
      collectionFrequency: string | null
      serviceStartDate: Date | null
      joinDate: Date | null
      status: string
      serviceStatus: string | null
      primaryPocName: string | null
      primaryPocEmail: string | null
      primaryPocNumber: string | null
      noOfKiosk: number | null
    }[]) {
      const start = c.serviceStartDate || c.joinDate
      if (!start) continue
      if (!isDueForMonth(c.collectionFrequency, new Date(start), month)) continue
      const expected = expectedCollectionsForMonth(c.collectionFrequency)
      const have = collectedMap.get(c.id)?.n || 0
      if (have >= expected) continue
      pending.push({
        customerId: c.id,
        companyName: c.companyName,
        tradeName: c.tradeName,
        city: c.city,
        state: c.state,
        lsuName: c.lsuName,
        lsuTechnicianName: c.lsuTechnicianName,
        operationsIncharge: c.operationsIncharge,
        collectionFrequency: c.collectionFrequency,
        serviceStartDate: c.serviceStartDate,
        primaryPocName: c.primaryPocName,
        primaryPocEmail: c.primaryPocEmail,
        primaryPocNumber: c.primaryPocNumber,
        noOfKiosk: c.noOfKiosk ?? 0,
        month,
        expected,
        recorded: have,
        remaining: expected - have,
        recordedWeight: collectedMap.get(c.id)?.totalWeight || 0,
        suggestedDate: lastDayOfMonthIso(month),
        draftWeight: "",
        draftLocation: c.city || c.lsuName || "",
        draftStatus: "Completed",
      })
    }

    const lsuRows = await sql`
      SELECT DISTINCT "lsuName" AS name
      FROM "Customer"
      WHERE "lsuName" IS NOT NULL AND TRIM("lsuName") <> ''
      ORDER BY "lsuName" ASC
    `

    return NextResponse.json({
      success: true,
      month,
      pending,
      lsuOptions: (lsuRows as { name: string }[]).map((r) => r.name),
      count: pending.length,
    })
  } catch (error) {
    console.error("Error fetching pending collections:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
