import {
  emailSupporterFooterHtml,
  emailSupporterFooterText,
} from "@/lib/email-supporter-footer"

export type ServiceStatusCode =
  | "ACTIVE"
  | "RENEWAL_DUE"
  | "PAUSED_RENEWAL"
  | "PAUSED_PAYMENT"
  | "INACTIVE"

export const SERVICE_STATUS: Record<
  ServiceStatusCode,
  {
    label: string
    badgeClass: string
    dotClass: string
    action?: "renew" | "pay" | "contact"
    actionLabel?: string
  }
> = {
  ACTIVE: {
    label: "Active",
    badgeClass: "bg-[#E8F5E9] text-[#1B7339]",
    dotClass: "bg-[#1B7339]",
  },
  RENEWAL_DUE: {
    label: "Renewal Due Soon",
    badgeClass: "bg-[#E3F2FD] text-[#1565C0]",
    dotClass: "bg-[#1565C0]",
    action: "renew",
    actionLabel: "Renew Now",
  },
  PAUSED_RENEWAL: {
    label: "Paused – Renewal Pending",
    badgeClass: "bg-[#FFF3E0] text-[#EF6C00]",
    dotClass: "bg-[#EF6C00]",
    action: "renew",
    actionLabel: "Renew Now",
  },
  PAUSED_PAYMENT: {
    label: "Paused – Payment Pending",
    badgeClass: "bg-[#FFF8E1] text-[#F9A825]",
    dotClass: "bg-[#F9A825]",
    action: "pay",
    actionLabel: "Pay Now",
  },
  INACTIVE: {
    label: "Inactive / Service Ended",
    badgeClass: "bg-[#FFEBEE] text-[#C62828]",
    dotClass: "bg-[#C62828]",
    action: "contact",
    actionLabel: "Contact Buffindia",
  },
}

export function normalizeServiceStatus(raw?: string | null): ServiceStatusCode {
  const v = String(raw || "ACTIVE").toUpperCase().replace(/\s+/g, "_")
  if (v === "ACTIVE" || v === "RUNNING" || v === "SERVICES_ACTIVE") return "ACTIVE"
  if (v === "RENEWAL_DUE" || v === "RENEWAL_DUE_SOON" || v === "SERVICES_RENEWAL_UPCOMING")
    return "RENEWAL_DUE"
  if (v === "PAUSED_RENEWAL" || v === "SERVICES_PAUSED_DUE_TO_NON_RENEWAL") return "PAUSED_RENEWAL"
  if (v === "PAUSED_PAYMENT" || v === "SERVICES_PAUSED_DUE_TO_PAYMENT_DUE") return "PAUSED_PAYMENT"
  if (v === "INACTIVE" || v === "STOPPED" || v === "SERVICES_STOPPED" || v === "ENDED")
    return "INACTIVE"
  if ((SERVICE_STATUS as Record<string, unknown>)[v]) return v as ServiceStatusCode
  return "ACTIVE"
}

export function buildRenewalReminderEmail(options: {
  customerName: string
  renewalDate: string
  renewUrl: string
}) {
  const name = options.customerName || "Partner"
  const subject = "Your Buffindia Service Renewal is Due"
  const text = `Hi ${name},

Your Buffindia service is due for renewal on ${options.renewalDate}.

Renew your service to continue uninterrupted cigarette waste collection, ESG reporting, and access to Buffindia ImpactOS.

Renew Now: ${options.renewUrl}

If you have any questions, our team will be happy to assist you.

Warm regards,
Team Buffindia

Buffindia Receptacles Pvt. Ltd.
www.buffindia.com
support@buffindia.com

${emailSupporterFooterText()}`

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#F7F6F2;font-family:Georgia,serif;color:#141414;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;background:#F7F6F2;">
    <tr><td align="center">
      <table role="presentation" width="600" style="max-width:600px;width:100%;background:#fff;border-radius:24px;overflow:hidden;border:1px solid #EAEAEA;">
        <tr><td style="background:linear-gradient(165deg,#0F1F14,#1B7339 55%,#2D8A4E);padding:36px;color:#fff;">
          <p style="margin:0 0 10px;font-family:ui-sans-serif,system-ui,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#C8F000;">BuffIndia · Renewal</p>
          <h1 style="margin:0;font-size:28px;line-height:1.15;">Service renewal is due</h1>
        </td></tr>
        <tr><td style="padding:32px 36px;">
          <p style="margin:0 0 14px;font-size:16px;">Hi ${escapeHtml(name)},</p>
          <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#3A3A3A;">
            Your Buffindia service is due for renewal on <strong>${escapeHtml(options.renewalDate)}</strong>.
          </p>
          <p style="margin:0 0 22px;font-size:15px;line-height:1.55;color:#3A3A3A;">
            Renew your service to continue uninterrupted cigarette waste collection, ESG reporting, and access to Buffindia ImpactOS.
          </p>
          <a href="${escapeHtml(options.renewUrl)}" style="display:inline-block;background:#1B7339;color:#fff;text-decoration:none;font-family:ui-sans-serif,system-ui,sans-serif;font-weight:700;font-size:14px;padding:12px 20px;border-radius:999px;">Renew Now</a>
          <p style="margin:24px 0 0;font-size:14px;color:#5A5A5A;">If you have any questions, our team will be happy to assist you.</p>
          <p style="margin:18px 0 0;font-size:14px;">Warm regards,<br/><strong>Team Buffindia</strong></p>
        </td></tr>
        <tr><td style="padding:18px 36px 28px;border-top:1px solid #EEE;font-size:12px;color:#8A8A8A;font-family:ui-sans-serif,system-ui,sans-serif;">
          Buffindia Receptacles Pvt. Ltd.<br/>
          www.buffindia.com · support@buffindia.com
          ${emailSupporterFooterHtml()}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

  return { subject, html, text }
}

function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
