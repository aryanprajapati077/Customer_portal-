import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/password"
import { requireAdminSession } from "@/lib/admin-auth-server"
import { requireSuperAdmin } from "@/lib/admin-auth"

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!requireSuperAdmin(session)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  const users = await prisma.adminUser.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      totpEnabled: true,
      lastLoginAt: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ success: true, users })
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!requireSuperAdmin(session)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  try {
    const { name, email, password, role } = await request.json()
    const normalizedEmail = String(email || "").toLowerCase().trim()
    const adminName = String(name || "").trim()
    const pass = String(password || "")
    const adminRole = role === "super_admin" ? "super_admin" : "admin"

    if (!normalizedEmail || !adminName || pass.length < 8) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password (min 8 chars) are required" },
        { status: 400 },
      )
    }

    const existing = await prisma.adminUser.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return NextResponse.json({ success: false, error: "An admin with this email already exists" }, { status: 409 })
    }

    const user = await prisma.adminUser.create({
      data: {
        email: normalizedEmail,
        name: adminName,
        passwordHash: await hashPassword(pass),
        role: adminRole,
        createdById: session!.id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        totpEnabled: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error("Create admin user error:", error)
    return NextResponse.json({ success: false, error: "Failed to create admin" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!requireSuperAdmin(session)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  try {
    const { id, active, role, password } = await request.json()
    if (!id) {
      return NextResponse.json({ success: false, error: "User id required" }, { status: 400 })
    }

    const target = await prisma.adminUser.findUnique({ where: { id: String(id) } })
    if (!target) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    if (target.role === "super_admin" && active === false && target.id !== session!.id) {
      const superCount = await prisma.adminUser.count({ where: { role: "super_admin", active: true } })
      if (superCount <= 1) {
        return NextResponse.json({ success: false, error: "Cannot deactivate the only super admin" }, { status: 400 })
      }
    }

    const data: Record<string, unknown> = {}
    if (typeof active === "boolean") data.active = active
    if (role === "admin" || role === "super_admin") data.role = role
    if (password && String(password).length >= 8) {
      data.passwordHash = await hashPassword(String(password))
    }

    const user = await prisma.adminUser.update({
      where: { id: target.id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        totpEnabled: true,
      },
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error("Update admin user error:", error)
    return NextResponse.json({ success: false, error: "Failed to update admin" }, { status: 500 })
  }
}
