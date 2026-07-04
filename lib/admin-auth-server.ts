import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/password"
import {
  type AdminSession,
  getAdminTokenFromRequest,
  verifyAdminSessionToken,
} from "@/lib/admin-auth"

export async function verifyAdminSession(token: string | undefined | null): Promise<AdminSession | null> {
  const parsed = await verifyAdminSessionToken(token)
  if (!parsed) return null

  const user = await prisma.adminUser.findUnique({
    where: { id: parsed.id },
    select: { id: true, role: true, email: true, name: true, active: true },
  })
  if (!user || !user.active) return null
  return { id: user.id, role: user.role, email: user.email, name: user.name }
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
  await ensureSuperAdmin()
  return prisma.adminUser.findUnique({ where: { email: email.toLowerCase().trim() } })
}

export async function requireAdminSession(request: Request): Promise<AdminSession | null> {
  return verifyAdminSession(getAdminTokenFromRequest(request))
}
