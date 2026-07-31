import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/password"
import {
  type AdminSession,
  getAdminTokenFromRequest,
  verifyAdminSessionToken,
} from "@/lib/admin-auth"
import { parsePermissions } from "@/lib/admin-permissions"
import { sql } from "@/lib/db"

let permissionsColReady: Promise<void> | null = null
async function ensureAdminPermissionsColumn() {
  if (!permissionsColReady) {
    permissionsColReady = sql
      .query(`ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "permissions" TEXT`)
      .then(() => undefined)
      .catch((err) => {
        permissionsColReady = null
        throw err
      })
  }
  await permissionsColReady
}

export async function verifyAdminSession(token: string | undefined | null): Promise<AdminSession | null> {
  const parsed = await verifyAdminSessionToken(token)
  if (!parsed) return null

  await ensureAdminPermissionsColumn()
  const user = await prisma.adminUser.findUnique({
    where: { id: parsed.id },
    select: { id: true, role: true, email: true, name: true, active: true },
  })
  if (!user || !user.active) return null

  let permissions: string[] | undefined
  try {
    const rows = await sql.query<{ permissions: string | null }>(
      `SELECT "permissions" FROM "AdminUser" WHERE id = $1 LIMIT 1`,
      [user.id],
    )
    const parsed = parsePermissions(rows[0]?.permissions)
    permissions = parsed === null ? undefined : parsed
  } catch {
    permissions = undefined
  }

  return {
    id: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    permissions,
  }
}

export async function ensureSuperAdmin() {
  const existing = await prisma.adminUser.findFirst({ where: { role: "super_admin", active: true } })
  if (existing) return existing

  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim()
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) return null

  const legacy = await prisma.adminCredential.findUnique({ where: { id: "admin" } })
  const passwordHash = legacy?.passwordHash || (await hashPassword(password))

  return prisma.adminUser.upsert({
    where: { email },
    create: {
      email,
      name: "Super Admin",
      passwordHash,
      role: "super_admin",
    },
    update: {
      role: "super_admin",
      active: true,
      passwordHash,
    },
  })
}

export async function findAdminByEmail(email: string) {
  const normalized = email.toLowerCase().trim()
  const select = {
    id: true,
    email: true,
    name: true,
    role: true,
    active: true,
    passwordHash: true,
    totpEnabled: true,
    totpSecret: true,
  } as const
  const existing = await prisma.adminUser.findUnique({ where: { email: normalized }, select })
  if (existing) return existing
  // Only bootstrap super-admin when the account is missing (first boot).
  await ensureSuperAdmin()
  return prisma.adminUser.findUnique({ where: { email: normalized }, select })
}

export async function requireAdminSession(request: Request): Promise<AdminSession | null> {
  return verifyAdminSession(getAdminTokenFromRequest(request))
}
