import "dotenv/config"
import { prisma } from "../lib/prisma"
import { hashPassword } from "../lib/password"

async function main() {
  const email = (process.env.ADMIN_EMAIL || "aryan@buffindia.com").toLowerCase().trim()
  const password = process.env.ADMIN_PASSWORD
  if (!password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env")
  }
  const passwordHash = await hashPassword(password)

  const user = await prisma.adminUser.upsert({
    where: { email },
    create: {
      email,
      name: "Super Admin",
      passwordHash,
      role: "super_admin",
      active: true,
    },
    update: {
      name: "Super Admin",
      passwordHash,
      role: "super_admin",
      active: true,
    },
  })

  await prisma.adminCredential.upsert({
    where: { id: "admin" },
    create: { id: "admin", email, passwordHash },
    update: { email, passwordHash },
  })

  console.log("Super admin ready:", user.email, user.role, user.id)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
