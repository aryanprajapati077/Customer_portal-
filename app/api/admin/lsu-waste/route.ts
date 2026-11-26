import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/admin-auth-server"
import { hasAdminPermission } from "@/lib/admin-permissions"
import { createPickup, deletePickup, fyOf, getLsuWasteReport, lsuWasteExcel, parsePickup, updatePickup } from "@/lib/lsu-waste"

// Same access as Collections / LSU Assign (operations).
async function auth(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session) return { res: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }) }
  if (!hasAdminPermission(session.role, session.permissions, "collections")) {
    return { res: NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }) }
  }
  return { session }
}
const fail = (error: string, status = 400) => NextResponse.json({ success: false, error }, { status })

export async function GET(request: NextRequest) {
  const a = await auth(request)
  if (a.res) return a.res
  try {
    const sp = request.nextUrl.searchParams
    const current = fyOf()
    const fyRaw = Number(sp.get("fy"))
    const fy = Number.isInteger(fyRaw) && fyRaw >= 2018 && fyRaw <= current + 1 ? fyRaw : current
    const report = await getLsuWasteReport(fy)
    if (sp.get("format") === "xlsx") {
      const { buffer, filename } = await lsuWasteExcel(report)
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      })
    }
    return NextResponse.json({ success: true, currentFy: current, report })
  } catch (e) {
    console.error("LSU waste GET error:", e)
    return fail("Server error", 500)
  }
}

export async function POST(request: NextRequest) {
  const a = await auth(request)
  if (a.res) return a.res
  try {
    const parsed = parsePickup(await request.json().catch(() => null))
    if (!parsed.ok) return fail(parsed.error)
    const id = await createPickup(parsed.value, a.session.email || a.session.name || null)
    return NextResponse.json({ success: true, id })
  } catch (e) {
    console.error("LSU waste POST error:", e)
    return fail("Server error", 500)
  }
}

export async function PATCH(request: NextRequest) {
  const a = await auth(request)
  if (a.res) return a.res
  try {
    const body = await request.json().catch(() => null)
    const id = typeof body?.id === "string" ? body.id : ""
    if (!id) return fail("Missing id")
    const parsed = parsePickup(body)
    if (!parsed.ok) return fail(parsed.error)
    if (!(await updatePickup(id, parsed.value))) return fail("Pickup not found", 404)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("LSU waste PATCH error:", e)
    return fail("Server error", 500)
  }
}

export async function DELETE(request: NextRequest) {
  const a = await auth(request)
  if (a.res) return a.res
  try {
    const id = request.nextUrl.searchParams.get("id") || ""
    if (!id) return fail("Missing id")
    if (!(await deletePickup(id))) return fail("Pickup not found", 404)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("LSU waste DELETE error:", e)
    return fail("Server error", 500)
  }
}
