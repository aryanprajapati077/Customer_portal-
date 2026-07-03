const CUSTOMER_COOKIE = "buffindia_session"
const ADMIN_COOKIE = "buffindia_admin"

const enc = new TextEncoder()

function getSecret(): string {
  return process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || "buffindia-auth-secret-change-me"
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("")
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let out = 0
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return out === 0
}

export async function signCustomerSession(customerId: string): Promise<string> {
  const sig = await hmacSha256Hex(getSecret(), `customer:${customerId}`)
  return `${customerId}.${sig}`
}

export async function verifyCustomerSession(token: string | undefined | null): Promise<string | null> {
  if (!token) return null
  const dot = token.lastIndexOf(".")
  if (dot <= 0) return null
  const id = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = await hmacSha256Hex(getSecret(), `customer:${id}`)
  if (timingSafeEqualStr(sig, expected)) return id
  return null
}

export function createResetToken(): string {
  const arr = new Uint8Array(32)
  crypto.getRandomValues(arr)
  return [...arr].map((b) => b.toString(16).padStart(2, "0")).join("")
}

export async function hashOtp(otp: string, email: string): Promise<string> {
  return hmacSha256Hex(getSecret(), `otp:${email}:${otp}`)
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

export { CUSTOMER_COOKIE, ADMIN_COOKIE }
