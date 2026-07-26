import { resend, getResendFrom } from "@/lib/resend"
import { SITE_URL } from "@/lib/site-config"
import { formatInr } from "@/lib/kraftreborn-products"
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

export async function sendKrOrderConfirmationEmail(options: {
  to: string
  contactName?: string | null
  companyName: string
  orderNumber: string
  subtotal: number
  items: { productName: string; quantity: number; price: number }[]
  useKrCredits: boolean
}) {
  const name = escapeHtml(options.contactName?.trim() || "Partner")
  const company = escapeHtml(options.companyName)
  const orderNumber = escapeHtml(options.orderNumber)
  const portalUrl = `${SITE_URL}/dashboard/shop`
  const itemsHtml = options.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:10px 0;border-bottom:1px solid #EAEAEA;font-family:ui-sans-serif,system-ui,sans-serif;font-size:14px;color:#141414;">${escapeHtml(i.productName)}</td>
          <td style="padding:10px 0;border-bottom:1px solid #EAEAEA;font-family:ui-sans-serif,system-ui,sans-serif;font-size:14px;color:#6B6B6B;text-align:center;">${i.quantity}</td>
          <td style="padding:10px 0;border-bottom:1px solid #EAEAEA;font-family:ui-sans-serif,system-ui,sans-serif;font-size:14px;color:#141414;text-align:right;">${formatInr(i.price * i.quantity)}</td>
        </tr>`,
    )
    .join("")

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F7F6F2;font-family:Georgia,'Times New Roman',serif;color:#141414;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F6F2;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:24px;overflow:hidden;border:1px solid #EAEAEA;">
        <tr>
          <td style="background:linear-gradient(160deg,#1A1208 0%,#8B5A2B 55%,#C4A574 100%);padding:40px 36px;color:#fff;">
            <p style="margin:0 0 12px;font-family:ui-sans-serif,system-ui,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#F5E6C8;">Kraftreborn · Order confirmed</p>
            <h1 style="margin:0;font-size:32px;line-height:1.15;font-weight:400;">Your order is<br /><em style="font-style:italic;color:#F5E6C8;">on its way into production.</em></h1>
            <p style="margin:16px 0 0;font-family:ui-sans-serif,system-ui,sans-serif;font-size:15px;line-height:1.65;color:rgba(255,255,255,0.85);">
              ${name}, thank you for redeeming impact as products for <strong style="color:#fff;">${company}</strong>.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 36px 12px;font-family:ui-sans-serif,system-ui,sans-serif;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8B5A2B;">Order ${orderNumber}</p>
            <p style="margin:0 0 18px;font-size:14px;color:#6B6B6B;">Status: Pending review · ${options.useKrCredits ? "KR credits will be deducted on completion" : "Standard checkout"}</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#8A8A8A;">Item</td>
                <td style="padding:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#8A8A8A;text-align:center;">Qty</td>
                <td style="padding:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#8A8A8A;text-align:right;">Amount</td>
              </tr>
              ${itemsHtml}
              <tr>
                <td colspan="2" style="padding:14px 0 0;font-size:14px;font-weight:700;">Total</td>
                <td style="padding:14px 0 0;font-size:16px;font-weight:700;text-align:right;color:#8B5A2B;">${formatInr(options.subtotal)}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 36px 36px;font-family:ui-sans-serif,system-ui,sans-serif;">
            <a href="${portalUrl}" style="display:inline-block;padding:14px 26px;border-radius:999px;background:#8B5A2B;color:#fff;font-weight:700;font-size:14px;text-decoration:none;">View shop & orders →</a>
            <p style="margin:18px 0 0;font-size:13px;color:#6B6B6B;line-height:1.6;">We’ll notify you when your order is completed. Upcycled from recovered cigarette waste — thank you for closing the loop.</p>
            <p style="margin:16px 0 0;font-size:13px;">Warm regards,<br /><strong>Team BuffIndia · Kraftreborn</strong></p>
            ${emailSupporterFooterHtml()}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim()

  const text = `Kraftreborn order confirmed

Order ${options.orderNumber}
Total: ${formatInr(options.subtotal)}

${options.items.map((i) => `- ${i.productName} x${i.quantity} = ${formatInr(i.price * i.quantity)}`).join("\n")}

Track in portal: ${portalUrl}

— Team BuffIndia · Kraftreborn

${emailSupporterFooterText()}`

  if (!resend) {
    console.warn("[kr-order-email] RESEND_API_KEY not set", { to: options.to, orderNumber: options.orderNumber })
    return { sent: false as const }
  }

  await resend.emails.send({
    from: getResendFrom(),
    to: options.to,
    subject: `Kraftreborn order ${options.orderNumber} received`,
    html,
    text,
  })

  return { sent: true as const }
}
