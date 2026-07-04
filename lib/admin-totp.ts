const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

function base32Decode(input: string): Uint8Array {
  const cleaned = input.replace(/=+$/, "").replace(/\s/g, "").toUpperCase()
  let bits = 0
  let value = 0
  const out: number[] = []
  for (const char of cleaned) {
    const idx = BASE32.indexOf(char)
    if (idx === -1) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return new Uint8Array(out)
}

function randomBase32(length = 32): string {
  const arr = new Uint8Array(length)
  crypto.getRandomValues(arr)
  return [...arr].map((b) => BASE32[b % 32]).join("")
}

async function hotp(secret: Uint8Array, counter: bigint): Promise<string> {
  const buf = new ArrayBuffer(8)
  new DataView(buf).setBigUint64(0, counter, false)
  const key = await crypto.subtle.importKey("raw", secret, { name: "HMAC", hash: "SHA-1" }, false, ["sign"])
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, buf))
  const offset = sig[sig.length - 1]! & 0x0f
  const code =
    ((sig[offset]! & 0x7f) << 24) |
    ((sig[offset + 1]! & 0xff) << 16) |
    ((sig[offset + 2]! & 0xff) << 8) |
    (sig[offset + 3]! & 0xff)
  return String(code % 1_000_000).padStart(6, "0")
}

export function generateTotpSecret(): string {
  return randomBase32(20)
}

export function getTotpUri(secret: string, email: string, issuer = "Buffindia Admin"): string {
  const label = encodeURIComponent(`${issuer}:${email}`)
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  })
  return `otpauth://totp/${label}?${params.toString()}`
}

export async function verifyTotp(secret: string, token: string, window = 1): Promise<boolean> {
  const code = token.replace(/\s/g, "")
  if (!/^\d{6}$/.test(code)) return false
  const key = base32Decode(secret)
  const step = BigInt(Math.floor(Date.now() / 30_000))
  for (let w = -window; w <= window; w++) {
    const expected = await hotp(key, step + BigInt(w))
    if (expected === code) return true
  }
  return false
}
