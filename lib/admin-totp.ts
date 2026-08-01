import QRCode from "qrcode"
import { authenticator } from "otplib"

authenticator.options = { window: 2 }

export function generateTotpSecret(): string {
  return authenticator.generateSecret()
}

export function formatTotpSecretForDisplay(secret: string): string {
  const s = secret.replace(/\s/g, "").toUpperCase()
  return s.match(/.{1,4}/g)?.join(" ") ?? s
}

/** Google Authenticator–compatible otpauth URI (email encoded in label). */
export function getTotpUri(secret: string, email: string, issuer = "BuffIndia"): string {
  return authenticator.keyuri(email.trim().toLowerCase(), issuer, secret)
}

export async function totpQrDataUrl(uri: string): Promise<string> {
  return QRCode.toDataURL(uri, {
    width: 280,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#FFFFFF" },
  })
}

export async function verifyTotp(secret: string, token: string): Promise<boolean> {
  const code = token.replace(/\s/g, "")
  if (!/^\d{6}$/.test(code)) return false
  try {
    return authenticator.verify({ token: code, secret })
  } catch {
    return false
  }
}
