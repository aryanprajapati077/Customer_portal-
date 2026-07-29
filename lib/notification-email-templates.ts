import { SITE_URL } from "@/lib/site-config"
import {
  emailSupporterFooterHtml,
  emailSupporterFooterText,
} from "@/lib/email-supporter-footer"

export type NotificationTemplateId =
  | "collection_completed"
  | "kraftreborn_balance_added"
  | "support_ticket_received"
  | "support_ticket_resolved"
  | "password_reset"
  | "service_renewal"
  | "kraftreborn_dispatched"
  | "kraftreborn_delivered"
  | "impact_proposal"
  | "group_portal_welcome"

export type NotificationTemplateCopy = {
  subject: string
  eyebrow: string
  title: string
  intro: string
  body: string
  ctaLabel: string
  ctaUrl: string
  closing: string
  signOff: string
  footerLine: string
  trigger: string
}

export type NotificationTemplateMeta = {
  id: NotificationTemplateId
  name: string
  description: string
  placeholders: string[]
  defaults: NotificationTemplateCopy
}

function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function applyTemplateVars(template: string, vars: Record<string, string>) {
  return Object.entries(vars).reduce(
    (text, [key, val]) => text.replaceAll(`{{${key}}}`, val ?? ""),
    template,
  )
}

export function mergeNotificationCopy(
  defaults: NotificationTemplateCopy,
  partial?: Partial<NotificationTemplateCopy> | null,
): NotificationTemplateCopy {
  return { ...defaults, ...(partial || {}) }
}

export const NOTIFICATION_TEMPLATES: NotificationTemplateMeta[] = [
  {
    id: "collection_completed",
    name: "Collection Completed",
    description: "Sent when a monthly / scheduled collection is logged as completed.",
    placeholders: [
      "name",
      "company",
      "month",
      "weight",
      "location",
      "customerId",
      "portalUrl",
    ],
    defaults: {
      subject: "Collection completed for {{month}} – BuffIndia",
      eyebrow: "BuffIndia · Collections",
      title: "Your {{month}} collection is complete",
      intro: "Hi {{name}},",
      body: "We have successfully completed cigarette waste collection for {{company}} for {{month}}.\n\nCollected: {{weight}} kg{{locationLine}}\n\nYour ImpactOS dashboard and ESG reports have been updated with this collection.",
      ctaLabel: "View Collections",
      ctaUrl: "{{portalUrl}}/dashboard/collections",
      closing: "Thank you for partnering with us for a cleaner India.",
      signOff: "Team BuffIndia",
      footerLine: "Buffindia Receptacles Pvt. Ltd. · support@buffindia.com · www.buffindia.com",
      trigger: "When admin logs a completed collection for a customer",
    },
  },
  {
    id: "kraftreborn_balance_added",
    name: "KraftReborn Balance Added",
    description: "Sent when rupee amount / KraftReborn balance is credited to a customer.",
    placeholders: [
      "name",
      "company",
      "amount",
      "balance",
      "customerId",
      "portalUrl",
    ],
    defaults: {
      subject: "₹{{amount}} added to your KraftReborn balance – BuffIndia",
      eyebrow: "BuffIndia · KraftReborn",
      title: "Rupee amount credited",
      intro: "Hi {{name}},",
      body: "Good news — ₹{{amount}} has been added to your KraftReborn balance for {{company}}.\n\nAvailable balance: ₹{{balance}}\n\nYou can redeem upcycled KraftReborn products anytime from your ImpactOS shop.",
      ctaLabel: "Redeem Now",
      ctaUrl: "{{portalUrl}}/dashboard/shop/store",
      closing: "Warm regards,",
      signOff: "Team BuffIndia",
      footerLine: "Buffindia Receptacles Pvt. Ltd. · support@buffindia.com · www.buffindia.com",
      trigger: "When admin increases a customer's KraftReborn / rupee balance",
    },
  },
  {
    id: "support_ticket_received",
    name: "Support Ticket Received",
    description: "Confirmation email when a customer submits a support ticket.",
    placeholders: [
      "name",
      "ticketId",
      "subject",
      "category",
      "message",
      "portalUrl",
    ],
    defaults: {
      subject: "We received your support ticket (#{{ticketId}}) – BuffIndia",
      eyebrow: "BuffIndia · Support",
      title: "Ticket received",
      intro: "Hi {{name}},",
      body: "Thank you for contacting BuffIndia Support.\n\nTicket ID: #{{ticketId}}\nSubject: {{subject}}\nCategory: {{category}}\n\nOur team will review your request and get back to you shortly.",
      ctaLabel: "Open Support",
      ctaUrl: "{{portalUrl}}/dashboard/support",
      closing: "We're here to help.",
      signOff: "Team BuffIndia",
      footerLine: "Buffindia Receptacles Pvt. Ltd. · support@buffindia.com · www.buffindia.com",
      trigger: "When a support ticket is submitted from portal, chatbot, or website",
    },
  },
  {
    id: "support_ticket_resolved",
    name: "Support Ticket Resolved",
    description: "Sent when admin marks a support ticket as resolved.",
    placeholders: ["name", "ticketId", "subject", "portalUrl"],
    defaults: {
      subject: "Your support ticket (#{{ticketId}}) is resolved – BuffIndia",
      eyebrow: "BuffIndia · Support",
      title: "Ticket resolved",
      intro: "Hi {{name}},",
      body: "Your support ticket has been marked as resolved.\n\nTicket ID: #{{ticketId}}\nSubject: {{subject}}\n\nIf you still need help, reply to this email or open a new ticket from ImpactOS.",
      ctaLabel: "Visit Support",
      ctaUrl: "{{portalUrl}}/dashboard/support",
      closing: "Thank you for your patience.",
      signOff: "Team BuffIndia",
      footerLine: "Buffindia Receptacles Pvt. Ltd. · support@buffindia.com · www.buffindia.com",
      trigger: "When admin sets a support ticket status to Resolved",
    },
  },
  {
    id: "password_reset",
    name: "Password Reset",
    description: "OTP email for customer or admin password reset.",
    placeholders: ["name", "otp", "portalUrl", "purpose"],
    defaults: {
      subject: "Your BuffIndia password reset code",
      eyebrow: "BuffIndia · Security",
      title: "Password reset code",
      intro: "Hi {{name}},",
      body: "Use this one-time code to reset your password. It expires in 10 minutes.\n\nIf you did not request this, you can safely ignore this email.",
      ctaLabel: "Reset Password",
      ctaUrl: "{{portalUrl}}/reset-password",
      closing: "Stay secure,",
      signOff: "Team BuffIndia",
      footerLine: "Buffindia Receptacles Pvt. Ltd. · support@buffindia.com · www.buffindia.com",
      trigger: "When a user requests a password reset OTP",
    },
  },
  {
    id: "service_renewal",
    name: "Service Renewal Reminder",
    description: "Reminder before contract expiry.",
    placeholders: ["name", "company", "renewalDate", "portalUrl", "daysLeft"],
    defaults: {
      subject: "Your Buffindia Service Renewal is Due",
      eyebrow: "BuffIndia · Renewal",
      title: "Service renewal is due",
      intro: "Hi {{name}},",
      body: "Your Buffindia service for {{company}} is due for renewal on {{renewalDate}}{{daysLeftLine}}.\n\nRenew your service to continue uninterrupted cigarette waste collection, ESG reporting, and access to Buffindia ImpactOS.",
      ctaLabel: "Renew Now",
      ctaUrl: "{{portalUrl}}/dashboard/organization",
      closing: "If you have any questions, our team will be happy to assist you.\n\nWarm regards,",
      signOff: "Team Buffindia",
      footerLine: "Buffindia Receptacles Pvt. Ltd. · support@buffindia.com · www.buffindia.com",
      trigger: "30 / 15 / 7 days before contract expiry",
    },
  },
  {
    id: "kraftreborn_dispatched",
    name: "KraftReborn Product Dispatched",
    description: "Sent when a shop order is marked shipped / dispatched.",
    placeholders: [
      "name",
      "company",
      "orderNumber",
      "itemSummary",
      "portalUrl",
    ],
    defaults: {
      subject: "Your KraftReborn order {{orderNumber}} has been dispatched",
      eyebrow: "BuffIndia · KraftReborn",
      title: "Order dispatched",
      intro: "Hi {{name}},",
      body: "Great news — your KraftReborn order {{orderNumber}} for {{company}} is on its way.\n\nItems: {{itemSummary}}\n\nWe’ll notify you again when it is delivered.",
      ctaLabel: "Track Order",
      ctaUrl: "{{portalUrl}}/dashboard/shop",
      closing: "Thank you for choosing circular craft.",
      signOff: "Team BuffIndia",
      footerLine: "Buffindia Receptacles Pvt. Ltd. · support@buffindia.com · www.buffindia.com",
      trigger: "When admin sets shop order status to Shipped / Dispatched",
    },
  },
  {
    id: "kraftreborn_delivered",
    name: "KraftReborn Products Delivered",
    description: "Sent when a shop order is marked delivered / completed for fulfilment.",
    placeholders: [
      "name",
      "company",
      "orderNumber",
      "itemSummary",
      "portalUrl",
    ],
    defaults: {
      subject: "Your KraftReborn order {{orderNumber}} has been delivered",
      eyebrow: "BuffIndia · KraftReborn",
      title: "Order delivered",
      intro: "Hi {{name}},",
      body: "Your KraftReborn order {{orderNumber}} for {{company}} has been delivered.\n\nItems: {{itemSummary}}\n\nWe hope you love your upcycled products. Your impact certificate is available in the portal.",
      ctaLabel: "View Certificates",
      ctaUrl: "{{portalUrl}}/dashboard/reports",
      closing: "Thank you for closing the loop with us.",
      signOff: "Team BuffIndia",
      footerLine: "Buffindia Receptacles Pvt. Ltd. · support@buffindia.com · www.buffindia.com",
      trigger: "When admin marks shop order as Delivered (or Completed fulfilment)",
    },
  },
  {
    id: "impact_proposal",
    name: "Detailed Impact Proposal",
    description:
      "Sent to the lead when they request a detailed proposal from the Impact Calculator. PDF is attached separately.",
    placeholders: [
      "name",
      "company",
      "industry",
      "packageName",
      "summaryLine",
      "investmentLine",
      "kioskLine",
      "buttsLine",
      "waterLine",
      "kraftLine",
      "city",
      "phone",
      "portalUrl",
    ],
    defaults: {
      subject: "Your BuffIndia detailed proposal — {{company}}",
      eyebrow: "BuffIndia · Impact Calculator",
      title: "Your detailed commercial proposal is ready",
      intro: "Hi {{name}},",
      body: "Thank you for using the BuffIndia Impact Calculator. Your branded commercial proposal for {{company}} is attached to this email.\n\nIndustry: {{industry}}\nRecommended: {{packageName}}\n{{summaryLine}}{{investmentLine}}{{kioskLine}}{{buttsLine}}{{waterLine}}{{kraftLine}}\n\nOur sales team has also been notified and will follow up shortly. Reply to this email with any questions about scope, sites, or timelines.",
      ctaLabel: "Explore BuffIndia",
      ctaUrl: "{{portalUrl}}",
      closing: "Looking forward to building a cleaner India with you,",
      signOff: "Team BuffIndia",
      footerLine: "Buffindia Receptacles Pvt. Ltd. · campaign@buffindia.com · www.buffindia.com",
      trigger: "When a visitor submits Get detailed proposal on the Impact Calculator",
    },
  },
  {
    id: "group_portal_welcome",
    name: "Group Portal Welcome",
    description:
      "Sent when a group client account is created (or credentials are resent). Includes login email and temporary password.",
    placeholders: [
      "name",
      "company",
      "customerId",
      "email",
      "password",
      "locationCount",
      "portalUrl",
    ],
    defaults: {
      subject: "Welcome to BuffIndia Group Portal — {{company}}",
      eyebrow: "BuffIndia · Group Portal",
      title: "Your group account is ready",
      intro: "Hi {{name}},",
      body: "Your BuffIndia group portal for {{company}} is ready.\n\nGroup ID: {{customerId}}\nUsername (email): {{email}}\nTemporary password: shown above\n\nWith this login you can view impact across all linked locations — collections, reports, and certificates — and switch location-wise anytime.\n\nLinked locations so far: {{locationCount}}\n\nPlease change your password after the first sign-in.",
      ctaLabel: "Sign in to Group Portal",
      ctaUrl: "{{portalUrl}}/login",
      closing: "Warm regards,",
      signOff: "Team BuffIndia",
      footerLine: "Buffindia Receptacles Pvt. Ltd. · support@buffindia.com · www.buffindia.com",
      trigger: "When admin creates a group client or resends group login credentials",
    },
  },
]

export function getTemplateMeta(id: string): NotificationTemplateMeta | undefined {
  return NOTIFICATION_TEMPLATES.find((t) => t.id === id)
}

export function buildNotificationEmail(
  copyInput: NotificationTemplateCopy,
  vars: Record<string, string>,
  extras?: { otpHighlight?: string },
) {
  const portalUrl = vars.portalUrl || SITE_URL
  const mergedVars: Record<string, string> = {
    portalUrl,
    locationLine: vars.location ? `\nLocation: ${vars.location}` : "",
    daysLeftLine: vars.daysLeft ? ` (${vars.daysLeft} days left)` : "",
    ...vars,
  }

  const subject = applyTemplateVars(copyInput.subject, mergedVars)
  const eyebrow = applyTemplateVars(copyInput.eyebrow, mergedVars)
  const title = applyTemplateVars(copyInput.title, mergedVars)
  const intro = applyTemplateVars(copyInput.intro, mergedVars)
  const body = applyTemplateVars(copyInput.body, mergedVars)
  const ctaLabel = applyTemplateVars(copyInput.ctaLabel, mergedVars)
  const ctaUrl = applyTemplateVars(copyInput.ctaUrl, mergedVars)
  const closing = applyTemplateVars(copyInput.closing, mergedVars)
  const signOff = applyTemplateVars(copyInput.signOff, mergedVars)
  const footerLine = applyTemplateVars(copyInput.footerLine, mergedVars)

  const bodyHtml = escapeHtml(body).replace(/\n/g, "<br/>")
  const closingHtml = escapeHtml(closing).replace(/\n/g, "<br/>")
  const footerHtml = escapeHtml(footerLine).replace(/\n/g, "<br/>")

  const otpBlock = extras?.otpHighlight
    ? `<div style="background:#E8F5E9;border:1px solid #C8E6D4;border-radius:16px;padding:22px;text-align:center;margin:8px 0 22px;">
        <span style="font-family:ui-sans-serif,system-ui,sans-serif;font-size:32px;font-weight:800;letter-spacing:0.28em;color:#1B7339;">${escapeHtml(extras.otpHighlight)}</span>
      </div>`
    : ""

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#F7F6F2;font-family:Georgia,serif;color:#141414;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;background:#F7F6F2;">
    <tr><td align="center">
      <table role="presentation" width="600" style="max-width:600px;width:100%;background:#fff;border-radius:24px;overflow:hidden;border:1px solid #EAEAEA;">
        <tr><td style="background:linear-gradient(165deg,#0F1F14,#1B7339 55%,#2D8A4E);padding:36px;color:#fff;">
          <p style="margin:0 0 10px;font-family:ui-sans-serif,system-ui,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#C8F000;">${escapeHtml(eyebrow)}</p>
          <h1 style="margin:0;font-size:28px;line-height:1.15;">${escapeHtml(title)}</h1>
        </td></tr>
        <tr><td style="padding:32px 36px;">
          <p style="margin:0 0 14px;font-size:16px;">${escapeHtml(intro)}</p>
          ${otpBlock}
          <p style="margin:0 0 22px;font-size:15px;line-height:1.55;color:#3A3A3A;">${bodyHtml}</p>
          <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#1B7339;color:#fff;text-decoration:none;font-family:ui-sans-serif,system-ui,sans-serif;font-weight:700;font-size:14px;padding:12px 20px;border-radius:999px;">${escapeHtml(ctaLabel)}</a>
          <p style="margin:24px 0 0;font-size:14px;color:#5A5A5A;">${closingHtml}</p>
          <p style="margin:18px 0 0;font-size:14px;"><strong>${escapeHtml(signOff)}</strong></p>
        </td></tr>
        <tr><td style="padding:18px 36px 28px;border-top:1px solid #EEE;font-size:12px;color:#8A8A8A;font-family:ui-sans-serif,system-ui,sans-serif;">
          ${footerHtml}
          ${emailSupporterFooterHtml()}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

  const text = `${intro}

${extras?.otpHighlight ? `Code: ${extras.otpHighlight}\n\n` : ""}${body}

${ctaLabel}: ${ctaUrl}

${closing}
${signOff}

${footerLine}

${emailSupporterFooterText()}`

  return { subject, html, text }
}
