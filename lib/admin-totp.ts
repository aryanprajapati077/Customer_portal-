import QRCode from "qrcode"

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

function base32Encode(bytes: Uint8Array): string {
  let bits = 0
  let value = 0
  let output = ""
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i]!
    bits += 8
    while (bits >= 5) {
      output += BASE32[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) {
    output += BASE32[(value << (5 - bits)) & 31]
  }
  return output
}

function base32Decode(input: string): Uint8Array {
  const cleaned = input.replace(/=+$/, "").replace(/\s/g, "").toUpperCase()
  let bits = 0
  let value = 0
  const out: number[] = []
  for (const char of cleaned) {
    const idx = BASE32.indexOf(char)
    if (idx === -1) throw new Error("Invalid base32 character in TOTP secret")
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return new Uint8Array(out)
}

function normalizeSecret(secret: string): string {
  return secret.replace(/\s/g, "").toUpperCase()
}

/** 80-bit secret (16 base32 chars) — widely supported by Google Authenticator / Authy */
export function generateTotpSecret(): string {
  const bytes = new Uint8Array(10)
  crypto.getRandomValues(bytes)
  return base32Encode(bytes)
}

/** Format for manual entry: ABCD EFGH IJKL MNOP */
export function formatTotpSecretForDisplay(secret: string): string {
  const s = normalizeSecret(secret)
  return s.match(/.{1,4}/g)?.join(" ") ?? s
}

/**
 * Minimal otpauth URI — Google Authenticator compatible.
 * Keep @ unencoded in the label; omit algorithm/digits/period (defaults work).
 */
export function getTotpUri(secret: string, email: string, issuer = "BuffIndia"): string {
  const key = normalizeSecret(secret)
  const account = email.trim().toLowerCase()
  const label = `${issuer}:${account}`
  return `otpauth://totp/${label}?secret=${key}&issuer=${encodeURIComponent(issuer)}`
}

export async function totpQrDataUrl(uri: string): Promise<string> {
  return QRCode.toDataURL(uri, {
    width: 256,
    margin: 2,
    errorCorrectionLevel: "H",
    color: { dark: "#000000", light: "#FFFFFF" },
  })
}

async function hotpWithKey(key: CryptoKey, counter: bigint): Promise<string> {
  const buf = new ArrayBuffer(8)
  new DataView(buf).setBigUint64(0, counter, false)
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, buf))
  const offset = sig[sig.length - 1]! & 0x0f
  const code =
    ((sig[offset]! & 0x7f) << 24) |
    ((sig[offset + 1]! & 0xff) << 16) |
    ((sig[offset + 2]! & 0xff) << 8) |
    (sig[offset + 3]! & 0xff)
  return String(code % 1_000_000).padStart(6, "0")
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return copy.buffer
}

export async function verifyTotp(secret: string, token: string, window = 2): Promise<boolean> {
  const code = token.replace(/\s/g, "")
  if (!/^\d{6}$/.test(code)) return false

  let keyBytes: Uint8Array
  try {
    keyBytes = base32Decode(normalizeSecret(secret))
  } catch {
    return false
  }
  if (keyBytes.length < 5) return false

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(keyBytes),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  )
  const step = BigInt(Math.floor(Date.now() / 30_000))
  for (let w = -window; w <= window; w++) {
    const expected = await hotpWithKey(cryptoKey, step + BigInt(w))
    if (expected === code) return true
  }
  return false
}
