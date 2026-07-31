import { ADMIN_COOKIE } from "@/lib/auth-session"
import { getAuthSecret } from "@/lib/auth-secret"

const enc = new TextEncoder()
const ADMIN_TTL_SEC = 60 * 60 * 8

let cachedKey: CryptoKey | null = null
let cachedSecret = ""

async function getHmacKey(): Promise<CryptoKey> {
  const secret = getAuthSecret()
  if (cachedKey && cachedSecret === secret) return cachedKey
  cachedKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  cachedSecret = secret
  return cachedKey
}

async function hmacSha256Hex(message: string): Promise<string> {
  const key = await getHmacKey()
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("")
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let out = 0
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return out === 0
}

export type AdminSession = {
  id: string
  role: string
  email: string
  name: string
  permissions?: string[]
}

export async function signAdminSession(adminId: string, role: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + ADMIN_TTL_SEC
  const sig = await hmacSha256Hex(`admin:${adminId}:${role}:${exp}`)
  return `${adminId}.${role}.${exp}.${sig}`
}

export async function verifyAdminSessionToken(
  token: string | undefined | null,
): Promise<{ id: string; role: string } | null> {
  if (!token || token === "1") return null
  const parts = token.split(".")
  // New: id.role.exp.sig
  if (parts.length >= 4) {
    const sig = parts.pop()!
    const expStr = parts.pop()!
    const role = parts.pop()!
    const id = parts.join(".")
    const exp = Number(expStr)
    if (!id || !role || !exp || !Number.isFinite(exp)) return null
    if (Date.now() / 1000 > exp) return null
    const expected = await hmacSha256Hex(`admin:${id}:${role}:${exp}`)
    if (!timingSafeEqualStr(sig, expected)) return null
    return { id, role }
  }
  // Legacy: id.role.sig (accept during rollout)
  if (parts.length >= 3) {
    const sig = parts.pop()!
    const role = parts.pop()!
    const id = parts.join(".")
    const expected = await hmacSha256Hex(`admin:${id}:${role}`)
    if (!timingSafeEqualStr(sig, expected)) return null
    return { id, role }
  }
  return null
}

export const ADMIN_PENDING_COOKIE = "buffindia_admin_2fa"

export async function signAdminPending(adminId: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + 300
  const sig = await hmacSha256Hex(`admin-pending:${adminId}:${exp}`)
  return `${adminId}.${exp}.${sig}`
}

export async function verifyAdminPending(token: string | undefined | null): Promise<string | null> {
  if (!token) return null
  const parts = token.split(".")
  if (parts.length !== 3) return null
  const [id, expStr, sig] = parts
  const exp = Number(expStr)
  if (!id || !exp || Date.now() / 1000 > exp) return null
  const expected = await hmacSha256Hex(`admin-pending:${id}:${exp}`)
  if (!timingSafeEqualStr(sig!, expected)) return null
  return id
}

export function adminSessionCookieOptions(overrides?: { maxAge?: number }) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: overrides?.maxAge ?? ADMIN_TTL_SEC,
  }
}

export function setAdminSessionCookie(
  response: { cookies: { set: (n: string, v: string, o: object) => void } },
  token: string,
) {
  response.cookies.set(ADMIN_COOKIE, token, adminSessionCookieOptions())
}

export function clearAdminCookies(response: {
  cookies: { set: (n: string, v: string, o: object) => void }
}) {
  const cleared = adminSessionCookieOptions({ maxAge: 0 })
  response.cookies.set(ADMIN_COOKIE, "", cleared)
  response.cookies.set(ADMIN_PENDING_COOKIE, "", cleared)
}

export function requireSuperAdmin(session: AdminSession | null): boolean {
  return session?.role === "super_admin"
}

export function getAdminTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") || ""
  const match = cookieHeader.match(/(?:^|;\s*)buffindia_admin=([^;]+)/)
  return match ? decodeURIComponent(match[1]!) : null
}
