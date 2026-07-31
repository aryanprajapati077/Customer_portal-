import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/password"
import { requireAdminSession } from "@/lib/admin-auth-server"
import { requireSuperAdmin } from "@/lib/admin-auth"
import { sql } from "@/lib/db"
import { ALL_PERMISSION_KEYS, parsePermissions, type AdminPermissionKey } from "@/lib/admin-permissions"

async function ensurePermissionsCol() {
  await sql.query(`ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "permissions" TEXT`)
}

function normalizePerms(raw: unknown): AdminPermissionKey[] {
  if (Array.isArray(raw) && raw.length === 0) return []
  const parsed = parsePermissions(raw)
  if (parsed === null) return [...ALL_PERMISSION_KEYS]
  if (parsed.length) return parsed
  return [...ALL_PERMISSION_KEYS]
}

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!requireSuperAdmin(session)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  await ensurePermissionsCol()
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

  const permRows = await sql.query<{ id: string; permissions: string | null }>(
    `SELECT id, "permissions" FROM "AdminUser"`,
  )
  const permMap = new Map(
    permRows.map((r) => [r.id, parsePermissions(r.permissions) ?? [...ALL_PERMISSION_KEYS]]),
  )

  return NextResponse.json({
    success: true,
    users: users.map((u) => ({
      ...u,
      permissions: permMap.get(u.id) || [],
    })),
    permissionOptions: ALL_PERMISSION_KEYS,
  })
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!requireSuperAdmin(session)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  try {
    await ensurePermissionsCol()
    const { name, email, password, role, permissions } = await request.json()
    const normalizedEmail = String(email || "").toLowerCase().trim()
    const adminName = String(name || "").trim()
    const pass = String(password || "")
    const adminRole = role === "super_admin" ? "super_admin" : "admin"
    const perms = adminRole === "super_admin" ? [...ALL_PERMISSION_KEYS] : normalizePerms(permissions)

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

    await sql.query(`UPDATE "AdminUser" SET "permissions" = $1 WHERE id = $2`, [
      JSON.stringify(perms),
      user.id,
    ])

    return NextResponse.json({ success: true, user: { ...user, permissions: perms } })
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
    await ensurePermissionsCol()
    const { id, active, role, password, permissions } = await request.json()
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
        return NextResponse.json(
          { success: false, error: "Cannot deactivate the only super admin" },
          { status: 400 },
        )
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

    let perms: AdminPermissionKey[] =
      parsePermissions(
        (
          await sql.query<{ permissions: string | null }>(
            `SELECT "permissions" FROM "AdminUser" WHERE id = $1`,
            [user.id],
          )
        )[0]?.permissions,
      ) ?? [...ALL_PERMISSION_KEYS]

    if (permissions !== undefined) {
      perms =
        user.role === "super_admin"
          ? [...ALL_PERMISSION_KEYS]
          : normalizePerms(permissions)
      await sql.query(`UPDATE "AdminUser" SET "permissions" = $1 WHERE id = $2`, [
        JSON.stringify(perms),
        user.id,
      ])
    }

    return NextResponse.json({ success: true, user: { ...user, permissions: perms } })
  } catch (error) {
    console.error("Update admin user error:", error)
    return NextResponse.json({ success: false, error: "Failed to update admin" }, { status: 500 })
  }
}
