import { SITE_URL } from "@/lib/site-config"
import {
  emailSupporterFooterHtml,
  emailSupporterFooterText,
} from "@/lib/email-supporter-footer"

export type EsgEmailCopy = {
  subject: string
  eyebrow: string
  heroTitleBefore: string
  heroAccent: string
  heroIntro: string
  chapter1Label: string
  chapter1Title: string
  chapter1Body: string
  chapter2Label: string
  chapter2Title: string
  chapter2Body: string
  chapter3Label: string
  chapter3Title: string
  chapter3Body: string
  closing: string
  signOff: string
  footerLine: string
}

export const DEFAULT_ESG_EMAIL_COPY: EsgEmailCopy = {
  subject: "Your {{period}} ESG Impact Report – BuffIndia (PDF + Excel)",
  eyebrow: "BuffIndia · Impact Story",
  heroTitleBefore: "Your {{period}}",
  heroAccent: "impact chapter is ready.",
  heroIntro:
    "{{name}}, every butt recovered for {{company}} adds a page to India’s circular economy story.",
  chapter1Label: "Chapter 01 · The period",
  chapter1Title: "A clear look at what you recovered.",
  chapter1Body:
    "Inside this month’s pack: waste diverted, cigarette butts collected, water protected, microplastics upcycled, and Kraftreborn credits earned — curated for ESG reporting.",
  chapter2Label: "Chapter 02 · Your attachments",
  chapter2Title: "Two formats. One story.",
  chapter2Body:
    "Both files are attached to this email — open them anytime, offline or in your inbox.",
  chapter3Label: "Chapter 03 · Keep exploring",
  chapter3Title: "Your portal holds the full journey.",
  chapter3Body:
    "Thank you for supporting the Cigarette Waste Litter Free India Campaign — one recovery at a time.",
  closing: "Warm regards,",
  signOff: "Team BuffIndia",
  footerLine: "Cigarette Waste Management · ESG Impact · Kraftreborn",
}

function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function applyVars(template: string, vars: Record<string, string>) {
  return Object.entries(vars).reduce(
    (text, [key, val]) => text.replaceAll(`{{${key}}}`, val),
    template,
  )
}

export function mergeEsgEmailCopy(partial?: Partial<EsgEmailCopy> | null): EsgEmailCopy {
  return { ...DEFAULT_ESG_EMAIL_COPY, ...(partial || {}) }
}

export function buildEsgReportEmailHtml(
  options: {
    companyName: string
    contactName?: string | null
    period: string
    customerId: string
  },
  copyInput?: Partial<EsgEmailCopy> | null,
) {
  const copy = mergeEsgEmailCopy(copyInput)
  const name = options.contactName?.trim() || "Partner"
  const vars = {
    period: options.period,
    company: options.companyName,
    name,
    customerId: options.customerId,
  }

  const greeting = escapeHtml(name)
  const company = escapeHtml(options.companyName)
  const period = escapeHtml(options.period)
  const customerId = escapeHtml(options.customerId)
  const portalUrl = `${SITE_URL}/dashboard/reports`

  const eyebrow = escapeHtml(applyVars(copy.eyebrow, vars))
  const heroTitleBefore = escapeHtml(applyVars(copy.heroTitleBefore, vars))
  const heroAccent = escapeHtml(applyVars(copy.heroAccent, vars))
  const heroIntro = escapeHtml(applyVars(copy.heroIntro, vars))
  const c1Label = escapeHtml(applyVars(copy.chapter1Label, vars))
  const c1Title = escapeHtml(applyVars(copy.chapter1Title, vars))
  const c1Body = escapeHtml(applyVars(copy.chapter1Body, vars))
  const c2Label = escapeHtml(applyVars(copy.chapter2Label, vars))
  const c2Title = escapeHtml(applyVars(copy.chapter2Title, vars))
  const c2Body = escapeHtml(applyVars(copy.chapter2Body, vars))
  const c3Label = escapeHtml(applyVars(copy.chapter3Label, vars))
  const c3Title = escapeHtml(applyVars(copy.chapter3Title, vars))
  const c3Body = escapeHtml(applyVars(copy.chapter3Body, vars))
  const closing = escapeHtml(applyVars(copy.closing, vars))
  const signOff = escapeHtml(applyVars(copy.signOff, vars))
  const footerLine = escapeHtml(applyVars(copy.footerLine, vars))

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Your ${period} ESG Impact Report</title>
</head>
<body style="margin:0;padding:0;background:#F7F6F2;font-family:Georgia,'Times New Roman',serif;color:#141414;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F6F2;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #EAEAEA;box-shadow:0 8px 30px rgba(20,20,20,0.06);">
          <tr>
            <td style="background:linear-gradient(165deg,#0F1F14 0%,#1B7339 52%,#2D8A4E 100%);padding:42px 36px 38px;color:#ffffff;">
              <p style="margin:0 0 14px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#C8F000;">
                ${eyebrow}
              </p>
              <h1 style="margin:0;font-size:34px;line-height:1.12;font-weight:400;letter-spacing:-0.02em;">
                ${heroTitleBefore}<br />
                <em style="font-style:italic;color:#C8F000;">${heroAccent}</em>
              </h1>
              <p style="margin:18px 0 0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.65;color:rgba(255,255,255,0.82);max-width:440px;">
                ${heroIntro}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 36px 10px;">
              <p style="margin:0 0 8px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#1B7339;">${c1Label}</p>
              <h2 style="margin:0 0 12px;font-size:24px;line-height:1.25;font-weight:400;">${c1Title}</h2>
              <p style="margin:0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.7;color:#555555;">${c1Body}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 36px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7FBF7;border:1px solid #DCE8DC;border-radius:16px;">
                <tr>
                  <td style="padding:20px 22px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;">
                    <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#6B6B6B;">Report details</p>
                    <p style="margin:0 0 6px;font-size:14px;color:#141414;"><strong>Organization:</strong> ${company}</p>
                    <p style="margin:0 0 6px;font-size:14px;color:#141414;"><strong>Customer ID:</strong> ${customerId}</p>
                    <p style="margin:0;font-size:14px;color:#141414;"><strong>Period:</strong> ${period}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 36px 8px;">
              <p style="margin:0 0 8px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#1B7339;">${c2Label}</p>
              <h2 style="margin:0 0 16px;font-size:22px;line-height:1.3;font-weight:400;">${c2Title}</h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding-right:6px;vertical-align:top;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E2EBE4;border-radius:14px;">
                      <tr>
                        <td style="padding:16px 14px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;">
                          <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#1B7339;">PDF</p>
                          <p style="margin:0;font-size:13px;line-height:1.55;color:#555;">Board-ready impact report.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="50%" style="padding-left:6px;vertical-align:top;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E2EBE4;border-radius:14px;">
                      <tr>
                        <td style="padding:16px 14px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;">
                          <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#EF6C00;">Excel</p>
                          <p style="margin:0;font-size:13px;line-height:1.55;color:#555;">Working numbers for ESG teams.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:13px;line-height:1.6;color:#6B6B6B;">${c2Body}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 36px 36px;">
              <p style="margin:0 0 8px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#1B7339;">${c3Label}</p>
              <h2 style="margin:0 0 18px;font-size:22px;line-height:1.3;font-weight:400;">${c3Title}</h2>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:999px;background:#1B7339;">
                    <a href="${portalUrl}" style="display:inline-block;padding:14px 28px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
                      Open Reports in Portal →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:18px 0 0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:13px;line-height:1.65;color:#6B6B6B;">${c3Body}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 36px;background:#F7FBF7;border-top:1px solid #E2EBE4;">
              <p style="margin:0 0 6px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:13px;color:#141414;">
                ${closing}<br />
                <strong>${signOff}</strong>
              </p>
              <p style="margin:0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:12px;line-height:1.55;color:#8A8A8A;">
                ${footerLine}<br />
                Automated delivery from the BuffIndia Customer Portal.
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

export function buildEsgReportEmailText(
  options: {
    companyName: string
    contactName?: string | null
    period: string
    customerId: string
  },
  copyInput?: Partial<EsgEmailCopy> | null,
) {
  const copy = mergeEsgEmailCopy(copyInput)
  const name = options.contactName?.trim() || "Partner"
  const vars = {
    period: options.period,
    company: options.companyName,
    name,
    customerId: options.customerId,
  }
  const subjectLine = applyVars(copy.subject, vars)
  return `${applyVars(copy.heroTitleBefore, vars)} ${applyVars(copy.heroAccent, vars)}

${applyVars(copy.heroIntro, vars)}

Organization: ${options.companyName}
Customer ID: ${options.customerId}
Period: ${options.period}

${applyVars(copy.chapter1Title, vars)}
${applyVars(copy.chapter1Body, vars)}

Attached:
1) PDF – board-ready ESG impact report
2) Excel – working numbers for your ESG / audit teams

${applyVars(copy.chapter2Body, vars)}

Open reports: ${SITE_URL}/dashboard/reports

${applyVars(copy.chapter3Body, vars)}

${applyVars(copy.closing, vars)}
${applyVars(copy.signOff, vars)}

${emailSupporterFooterText()}

(${subjectLine})`
}

export function buildEsgReportSubject(
  options: { period: string; companyName?: string },
  copyInput?: Partial<EsgEmailCopy> | null,
) {
  const copy = mergeEsgEmailCopy(copyInput)
  return applyVars(copy.subject, {
    period: options.period,
    company: options.companyName || "",
    name: "",
    customerId: "",
  })
}
