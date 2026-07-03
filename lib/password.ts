import bcrypt from "bcryptjs"

const SALT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (stored.startsWith("$2")) {
    return bcrypt.compare(password, stored)
  }
  // Legacy plaintext — compare directly; caller should re-hash on success
  return stored === password
}

export function isPasswordHashed(stored: string): boolean {
  return stored.startsWith("$2")
}
