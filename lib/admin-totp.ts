import QRCode from "qrcode"

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

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

/** 160-bit secret — compatible with Google Authenticator, Authy, 1Password */
export function generateTotpSecret(): string {
  const bytes = new Uint8Array(20)
  crypto.getRandomValues(bytes)
  let bits = 0
  let value = 0
  let out = ""
  for (const byte of bytes) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) out += BASE32[(value << (5 - bits)) & 31]
  return out.slice(0, 32)
}

/** RFC 6238 otpauth URI — issuer in label + query (no URLSearchParams + signs) */
export function getTotpUri(secret: string, email: string, issuer = "BuffIndia"): string {
  const account = encodeURIComponent(email)
  const iss = encodeURIComponent(issuer)
  const params = [
    `secret=${encodeURIComponent(secret)}`,
    `issuer=${iss}`,
    "algorithm=SHA1",
    "digits=6",
    "period=30",
  ].join("&")
  return `otpauth://totp/${iss}:${account}?${params}`
}

export async function totpQrDataUrl(uri: string): Promise<string> {
  return QRCode.toDataURL(uri, {
    width: 220,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#141414", light: "#FFFFFF" },
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
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

export async function verifyTotp(secret: string, token: string, window = 2): Promise<boolean> {
  const code = token.replace(/\s/g, "")
  if (!/^\d{6}$/.test(code)) return false
  let keyBytes: Uint8Array
  try {
    keyBytes = base32Decode(secret)
  } catch {
    return false
  }
  if (keyBytes.length < 8) return false

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
