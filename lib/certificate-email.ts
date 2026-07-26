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

export function buildCertificateEmailHtml(options: {
  companyName: string
  contactName?: string | null
  customerId: string
  certificateName: string
  certificateNumber: string
  fiscalYear?: string
}) {
  const name = escapeHtml(options.contactName?.trim() || "Partner")
  const company = escapeHtml(options.companyName)
  const customerId = escapeHtml(options.customerId)
  const certName = escapeHtml(options.certificateName)
  const certNo = escapeHtml(options.certificateNumber)
  const year = escapeHtml(options.fiscalYear || "")
  const portalUrl = `${SITE_URL}/dashboard/reports`

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#F7F6F2;font-family:Georgia,'Times New Roman',serif;color:#141414;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F6F2;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #EAEAEA;box-shadow:0 8px 30px rgba(20,20,20,0.06);">
        <tr>
          <td style="background:linear-gradient(165deg,#0F1F14 0%,#1B7339 55%,#2D8A4E 100%);padding:42px 36px;color:#ffffff;">
            <p style="margin:0 0 14px;font-family:ui-sans-serif,system-ui,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#C8F000;">
              BuffIndia · Recognition
            </p>
            <h1 style="margin:0;font-size:34px;line-height:1.12;font-weight:400;">
              Your certificate<br />
              <em style="font-style:italic;color:#C8F000;">is ready to share.</em>
            </h1>
            <p style="margin:18px 0 0;font-family:ui-sans-serif,system-ui,sans-serif;font-size:15px;line-height:1.65;color:rgba(255,255,255,0.85);max-width:440px;">
              ${name}, this marks another chapter in <strong style="color:#fff;">${company}</strong>’s circular journey.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 36px 12px;">
            <p style="margin:0 0 8px;font-family:ui-sans-serif,system-ui,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#1B7339;">
              Chapter 01 · The award
            </p>
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:400;">${certName}</h2>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7FBF7;border:1px solid #DCE8DC;border-radius:16px;">
              <tr><td style="padding:18px 20px;font-family:ui-sans-serif,system-ui,sans-serif;font-size:14px;line-height:1.7;color:#141414;">
                <strong>Certificate No.</strong> ${certNo}<br />
                <strong>Customer ID</strong> ${customerId}<br />
                <strong>Organization</strong> ${company}
                ${year ? `<br /><strong>Period</strong> ${year}` : ""}
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 36px 12px;">
            <p style="margin:0 0 8px;font-family:ui-sans-serif,system-ui,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#1B7339;">
              Chapter 02 · Attachment
            </p>
            <h2 style="margin:0 0 10px;font-size:20px;font-weight:400;">Your branded PDF is attached.</h2>
            <p style="margin:0;font-family:ui-sans-serif,system-ui,sans-serif;font-size:14px;line-height:1.65;color:#555;">
              The certificate includes your organization details and saved customer logo from your BuffIndia profile.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 36px 36px;">
            <p style="margin:0 0 8px;font-family:ui-sans-serif,system-ui,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#1B7339;">
              Chapter 03 · Keep going
            </p>
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="border-radius:999px;background:#1B7339;">
                <a href="${portalUrl}" style="display:inline-block;padding:14px 28px;font-family:ui-sans-serif,system-ui,sans-serif;font-size:15px;font-weight:700;color:#fff;text-decoration:none;">
                  Open portal certificates →
                </a>
              </td>
            </tr></table>
            <p style="margin:18px 0 0;font-family:ui-sans-serif,system-ui,sans-serif;font-size:13px;color:#6B6B6B;line-height:1.6;">
              Thank you for supporting the Cigarette Waste Litter Free India Campaign.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 36px;background:#F7FBF7;border-top:1px solid #E2EBE4;font-family:ui-sans-serif,system-ui,sans-serif;">
            <p style="margin:0 0 4px;font-size:13px;">Warm regards,<br /><strong>Team BuffIndia</strong></p>
            <p style="margin:0;font-size:12px;color:#8A8A8A;">Certificate delivery · ESG Impact · Kraftreborn</p>
            ${emailSupporterFooterHtml()}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim()
}

export function buildCertificateEmailText(options: {
  companyName: string
  contactName?: string | null
  customerId: string
  certificateName: string
  certificateNumber: string
}) {
  const name = options.contactName?.trim() || "Partner"
  return `Your certificate is ready, ${name}.

${options.certificateName}
Certificate No. ${options.certificateNumber}
Customer ID: ${options.customerId}
Organization: ${options.companyName}

The branded PDF is attached to this email.
Portal: ${SITE_URL}/dashboard/reports

— Team BuffIndia

${emailSupporterFooterText()}`
}

export async function sendCertificateEmail(options: {
  to: string
  companyName: string
  contactName?: string | null
  customerId: string
  certificateName: string
  certificateNumber: string
  fiscalYear?: string
  pdfBuffer: Buffer
  filename: string
}) {
  const subject = `${options.certificateName} – BuffIndia`
  const html = buildCertificateEmailHtml(options)
  const text = buildCertificateEmailText(options)

  if (!resend) {
    console.warn("[certificate-email] RESEND_API_KEY not set", {
      to: options.to,
      certificateNumber: options.certificateNumber,
    })
    return { sent: false as const, reason: "RESEND_API_KEY not configured" }
  }

  await resend.emails.send({
    from: getResendFrom(),
    to: options.to,
    subject,
    html,
    text,
    attachments: [{ filename: options.filename, content: options.pdfBuffer }],
  })

  return { sent: true as const }
}
