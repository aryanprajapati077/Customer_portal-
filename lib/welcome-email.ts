import { randomBytes } from "crypto"
import { resend, getResendFrom } from "@/lib/resend"
import { SITE_URL } from "@/lib/site-config"
import {
  emailSupporterFooterHtml,
  emailSupporterFooterText,
} from "@/lib/email-supporter-footer"

function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** 10-character portal password (letters + digits, no ambiguous chars) */
export function generatePortalPassword(length = 10): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
  const bytes = randomBytes(length)
  let out = ""
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i] % alphabet.length]
  }
  return out
}

export function buildWelcomeEmailHtml(options: {
  brandName: string
  contactName: string
  customerId: string
  email: string
  password: string
  loginUrl?: string
}) {
  const brand = escapeHtml(options.brandName)
  const name = escapeHtml(options.contactName?.trim() || "Partner")
  const customerId = escapeHtml(options.customerId)
  const email = escapeHtml(options.email)
  const password = escapeHtml(options.password)
  const loginUrl = options.loginUrl || `${SITE_URL}/login`

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Welcome to BuffIndia</title>
</head>
<body style="margin:0;padding:0;background:#F7F6F2;font-family:Georgia,'Times New Roman',serif;color:#141414;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F6F2;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #EAEAEA;box-shadow:0 8px 30px rgba(20,20,20,0.06);">

          <!-- Hero -->
          <tr>
            <td style="background:linear-gradient(160deg,#0F1F14 0%,#1B7339 55%,#2D8A4E 100%);padding:40px 36px 36px;color:#ffffff;">
              <p style="margin:0 0 14px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#C8F000;">
                BuffIndia · Customer Portal
              </p>
              <h1 style="margin:0;font-size:34px;line-height:1.15;font-weight:400;letter-spacing:-0.02em;">
                Welcome to your<br />
                <em style="font-style:italic;color:#C8F000;">circular journey.</em>
              </h1>
              <p style="margin:18px 0 0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.65;color:rgba(255,255,255,0.82);max-width:420px;">
                ${name}, your account for <strong style="color:#fff;">${brand}</strong> is ready.
                A small story of impact starts with a single login.
              </p>
            </td>
          </tr>

          <!-- Chapter 1 -->
          <tr>
            <td style="padding:36px 36px 8px;">
              <p style="margin:0 0 8px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#1B7339;">
                Chapter 01 · Hello
              </p>
              <h2 style="margin:0 0 12px;font-size:24px;line-height:1.25;font-weight:400;">
                You are now part of India’s<br />cigarette-waste recovery story.
              </h2>
              <p style="margin:0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.7;color:#555555;">
                From kiosks on your campus to upcycled Kraftreborn products, every butt diverted is tracked in your portal —
                reports, certificates, and credits, all in one place.
              </p>
            </td>
          </tr>

          <!-- Chapter 2 · Credentials -->
          <tr>
            <td style="padding:28px 36px 8px;">
              <p style="margin:0 0 8px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#1B7339;">
                Chapter 02 · Your keys
              </p>
              <h2 style="margin:0 0 16px;font-size:22px;line-height:1.3;font-weight:400;">
                Sign in with these credentials
              </h2>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7FBF7;border:1px solid #DCE8DC;border-radius:16px;">
                <tr>
                  <td style="padding:22px 24px;">
                    <p style="margin:0 0 4px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#6B6B6B;">
                      Customer ID
                    </p>
                    <p style="margin:0 0 18px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:18px;font-weight:700;color:#1B7339;">
                      ${customerId}
                    </p>

                    <p style="margin:0 0 4px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#6B6B6B;">
                      Username (email)
                    </p>
                    <p style="margin:0 0 18px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:16px;font-weight:600;color:#141414;word-break:break-all;">
                      ${email}
                    </p>

                    <p style="margin:0 0 4px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#6B6B6B;">
                      Temporary password
                    </p>
                    <p style="margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:20px;font-weight:700;letter-spacing:0.08em;color:#141414;background:#ffffff;border:1px dashed #C8E6D4;border-radius:10px;padding:12px 14px;display:inline-block;">
                      ${password}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:14px 0 0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:13px;line-height:1.6;color:#6B6B6B;">
                For security, please change this password after your first sign-in.
              </p>
            </td>
          </tr>

          <!-- Chapter 3 · CTA -->
          <tr>
            <td style="padding:28px 36px 36px;">
              <p style="margin:0 0 8px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#1B7339;">
                Chapter 03 · Begin
              </p>
              <h2 style="margin:0 0 18px;font-size:22px;line-height:1.3;font-weight:400;">
                Open your impact portal
              </h2>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:999px;background:#1B7339;">
                    <a href="${loginUrl}" style="display:inline-block;padding:14px 28px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
                      Sign in to BuffIndia Portal →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:18px 0 0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:13px;line-height:1.6;color:#6B6B6B;">
                Or paste this link in your browser:<br />
                <a href="${loginUrl}" style="color:#1B7339;word-break:break-all;">${escapeHtml(loginUrl)}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:22px 36px;background:#F7FBF7;border-top:1px solid #E2EBE4;">
              <p style="margin:0 0 6px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:13px;color:#141414;">
                Warm regards,<br />
                <strong>Team BuffIndia</strong>
              </p>
              <p style="margin:0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:12px;line-height:1.55;color:#8A8A8A;">
                Cigarette Waste Management · ESG Impact · Kraftreborn<br />
                This is an automated welcome from the BuffIndia Customer Portal.
              </p>
              ${emailSupporterFooterHtml()}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

export function buildWelcomeEmailText(options: {
  brandName: string
  contactName: string
  customerId: string
  email: string
  password: string
  loginUrl?: string
}) {
  const loginUrl = options.loginUrl || `${SITE_URL}/login`
  const name = options.contactName?.trim() || "Partner"
  return `Welcome to BuffIndia, ${name}.

Your customer portal for ${options.brandName} is ready.

Customer ID: ${options.customerId}
Username (email): ${options.email}
Temporary password: ${options.password}

Sign in: ${loginUrl}

Please change your password after your first login.

— Team BuffIndia

${emailSupporterFooterText()}`
}

export async function sendWelcomeEmail(options: {
  to: string
  brandName: string
  contactName: string
  customerId: string
  email: string
  password: string
}) {
  const loginUrl = `${SITE_URL}/login`
  const subject = `Welcome to BuffIndia — your portal access for ${options.brandName}`
  const html = buildWelcomeEmailHtml({ ...options, loginUrl })
  const text = buildWelcomeEmailText({ ...options, loginUrl })

  if (!resend) {
    console.warn("[welcome-email] RESEND_API_KEY not set — credentials:", {
      to: options.to,
      email: options.email,
      password: options.password,
      customerId: options.customerId,
    })
    return { sent: false as const, reason: "RESEND_API_KEY not configured" }
  }

  await resend.emails.send({
    from: getResendFrom(),
    to: options.to,
    subject,
    html,
    text,
  })

  return { sent: true as const }
}
