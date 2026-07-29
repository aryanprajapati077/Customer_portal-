import { absoluteUrl } from "@/lib/site-config"
import {
  IIMA_LOGO_PORTAL,
  IIMA_VENTURES_URL,
  KOTAK_BIZLABS_URL,
  KOTAK_LOGO_PORTAL,
} from "@/lib/supporter-brands"

/** Plain-text line for every outbound email */
export const EMAIL_PROUDLY_SUPPORTED_BY =
  "Proudly supported by IIMA Ventures and Kotak BizLabs."

/**
 * HTML block with “Proudly supported by” + IIMA / Kotak BizLabs logos.
 * Uses absolute image URLs so clients can load them.
 */
export function emailSupporterFooterHtml(): string {
  const iimaSrc = absoluteUrl(IIMA_LOGO_PORTAL)
  const kotakSrc = absoluteUrl(KOTAK_LOGO_PORTAL)

  return `
<div style="margin-top:20px;padding-top:16px;border-top:1px solid #E8E8E8;text-align:center;">
  <p style="margin:0 0 12px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#8A8A8A;">
    Proudly supported by
  </p>
  <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
    <tr>
      <td style="padding:0 12px;vertical-align:middle;text-align:center;">
        <a href="${IIMA_VENTURES_URL}" target="_blank" rel="noreferrer" style="text-decoration:none;">
          <img src="${iimaSrc}" alt="IIMA Ventures" width="100" height="50" style="display:block;height:40px;width:auto;max-width:110px;object-fit:contain;border:0;outline:none;" />
        </a>
      </td>
      <td style="width:1px;height:28px;background:#D5D5D5;font-size:0;line-height:0;">&nbsp;</td>
      <td style="padding:0 12px;vertical-align:middle;text-align:center;">
        <a href="${KOTAK_BIZLABS_URL}" target="_blank" rel="noreferrer" style="text-decoration:none;">
          <img src="${kotakSrc}" alt="Kotak BizLabs" width="170" height="34" style="display:block;height:28px;width:auto;max-width:170px;object-fit:contain;border:0;outline:none;" />
        </a>
      </td>
    </tr>
  </table>
</div>`.trim()
}

export function emailSupporterFooterText(): string {
  return `${EMAIL_PROUDLY_SUPPORTED_BY}\nIIMA Ventures: ${IIMA_VENTURES_URL}\nKotak BizLabs: ${KOTAK_BIZLABS_URL}`
}
