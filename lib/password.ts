import bcrypt from "bcryptjs"
import { timingSafeEqual } from "crypto"

const SALT_ROUNDS = 12
/** Valid bcrypt hash used only to keep verify timing similar when no real hash exists */
const DUMMY_HASH = "$2b$12$k2AJyFwb.ZP7aRmTogn6se.Aq4eIOUAQzehVMta9StA7nZmll8lvu"

/**
 * Strip invisible characters that email clients often insert when users copy
 * a temporary password (ZWSP, BOM, soft hyphen, NBSP, trailing newlines).
 */
export function normalizePasswordInput(password: unknown): string {
  return String(password ?? "")
    .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, "")
    .replace(/[\u2028\u2029]/g, "")
    .replace(/\u00A0/g, " ")
    .trim()
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored) {
    await bcrypt.compare(password, DUMMY_HASH)
    return false
  }
  if (stored.startsWith("$2")) {
    return bcrypt.compare(password, stored)
  }
  const a = Buffer.from(stored)
  const b = Buffer.from(password)
  if (a.length !== b.length) {
    await bcrypt.compare(password, DUMMY_HASH)
    return false
  }
  return timingSafeEqual(a, b)
}

export function isPasswordHashed(stored: string): boolean {
  return stored.startsWith("$2")
}
