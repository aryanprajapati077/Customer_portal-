import { getAuthSecret } from "@/lib/auth-secret"

const CUSTOMER_COOKIE = "buffindia_session"
const ADMIN_COOKIE = "buffindia_admin"

const enc = new TextEncoder()

/** Cached HMAC key — avoids importKey on every middleware hit */
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

const CUSTOMER_TTL_SEC = 60 * 60 * 24 * 7 // 7 days

export async function signCustomerSession(customerId: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + CUSTOMER_TTL_SEC
  const sig = await hmacSha256Hex(`customer:${customerId}:${exp}`)
  return `${customerId}.${exp}.${sig}`
}

export async function verifyCustomerSession(token: string | undefined | null): Promise<string | null> {
  if (!token) return null
  const parts = token.split(".")
  // Legacy: id.sig (no exp) — reject in production after grace; still accept briefly for rollout
  if (parts.length === 2) {
    const [id, sig] = parts
    if (!id || !sig) return null
    const expected = await hmacSha256Hex(`customer:${id}`)
    if (!timingSafeEqualStr(sig, expected)) return null
    return id
  }
  if (parts.length < 3) return null
  const sig = parts.pop()!
  const expStr = parts.pop()!
  const id = parts.join(".")
  const exp = Number(expStr)
  if (!id || !exp || !Number.isFinite(exp)) return null
  if (Date.now() / 1000 > exp) return null
  const expected = await hmacSha256Hex(`customer:${id}:${exp}`)
  if (!timingSafeEqualStr(sig, expected)) return null
  return id
}

export function createResetToken(): string {
  const arr = new Uint8Array(32)
  crypto.getRandomValues(arr)
  return [...arr].map((b) => b.toString(16).padStart(2, "0")).join("")
}

export async function hashOtp(otp: string, email: string): Promise<string> {
  return hmacSha256Hex(`otp:${email}:${otp}`)
}

export async function verifyOtpHash(otp: string, email: string, hash: string): Promise<boolean> {
  const expected = await hashOtp(otp, email)
  return timingSafeEqualStr(expected, hash)
}

export function generateOtp(): string {
  const arr = new Uint8Array(4)
  crypto.getRandomValues(arr)
  const n = (arr[0]! << 16) | (arr[1]! << 8) | arr[2]!
  return String(100000 + (n % 900000))
}

export function customerSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: CUSTOMER_TTL_SEC,
  }
}

export { CUSTOMER_COOKIE, ADMIN_COOKIE, CUSTOMER_TTL_SEC }
