import { NextResponse } from "next/server"
import { clearAdminCookies } from "@/lib/admin-auth"

export async function POST() {
  const res = NextResponse.json({ success: true })
  clearAdminCookies(res)
  return res
}
