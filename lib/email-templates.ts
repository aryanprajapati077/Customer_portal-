export function buildEsgReportEmailHtml(options: {
  companyName: string
  contactName?: string | null
  period: string
  customerId: string
}) {
  const greeting = options.contactName?.trim() || "Partner"

  return `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111827;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="background:linear-gradient(135deg,#E85D04 0%,#2D6A4F 100%);padding:28px 32px;color:#ffffff;">
                <p style="margin:0 0 8px 0;font-size:12px;letter-spacing:2px;text-transform:uppercase;opacity:0.9;">Buffindia Customer Impact Report</p>
                <h1 style="margin:0;font-size:28px;line-height:1.2;">Your ${options.period} ESG Report</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;">Dear ${greeting},</p>
                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#374151;">
                  Thank you for partnering with <strong>Buffindia</strong> on cigarette waste management and sustainability.
                  Please find attached your <strong>${options.period} ESG Impact Report</strong> for
                  <strong>${options.companyName}</strong> (Customer ID: <strong>${options.customerId}</strong>).
                </p>
                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#374151;">
                  This report summarizes your cumulative environmental and social impact, including waste collected,
                  microplastics upcycled, water resources protected, and Kraftreborn credits earned through our program.
                </p>
                <table cellpadding="0" cellspacing="0" style="margin:24px 0;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;">
                  <tr>
                    <td style="padding:16px 20px;font-size:14px;color:#9a3412;">
                      You can also download your latest reports anytime from your Buffindia customer dashboard.
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px 0;font-size:15px;line-height:1.7;color:#374151;">
                  Thank you for supporting the Cigarette Waste Litter Free India Campaign.
                </p>
                <p style="margin:0;font-size:15px;line-height:1.7;color:#374151;">
                  Warm regards,<br />
                  <strong>Team Buffindia</strong><br />
                  <span style="color:#6b7280;">Cigarette Waste Management · ESG Reporting</span>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;line-height:1.5;">
                This is an automated message from the Buffindia Customer Portal. Please do not reply directly to this email.
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

export function buildEsgReportEmailText(options: {
  companyName: string
  contactName?: string | null
  period: string
  customerId: string
}) {
  const greeting = options.contactName?.trim() || "Partner"
  return `Dear ${greeting},

Thank you for partnering with Buffindia.

Attached is your ${options.period} ESG Impact Report for ${options.companyName} (Customer ID: ${options.customerId}).

You can also download reports from your Buffindia customer dashboard.

Thank you for supporting the Cigarette Waste Litter Free India Campaign.

Team Buffindia`
}
