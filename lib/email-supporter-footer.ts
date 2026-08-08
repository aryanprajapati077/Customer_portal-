import { absoluteUrl } from "@/lib/site-config"

/**
 * PNG logo for email clients (SVG is blocked by Gmail, Outlook, etc.).
 * Same brand asset used across Buffindia PDFs and portal.
 */
export const BUFFINDIA_LOGO_EMAIL = "/report-assets/buffindia-logo-brand.png"

/** Plain-text line for every outbound email */
export const EMAIL_BRAND_FOOTER = "Buffindia — India's first cigarette waste management infrastructure."

/**
 * HTML block with the Buffindia logo — replaces former IIMA / Kotak BizLabs footer.
 * Uses absolute PNG URL so all major email clients can load it.
 */
export function emailSupporterFooterHtml(): string {
  const logoSrc = absoluteUrl(BUFFINDIA_LOGO_EMAIL)
  const homeUrl = absoluteUrl("/")

  return `
<div style="margin-top:20px;padding-top:16px;border-top:1px solid #E8E8E8;text-align:center;">
  <a href="${homeUrl}" target="_blank" rel="noreferrer" style="text-decoration:none;display:inline-block;">
    <img
      src="${logoSrc}"
      alt="Buffindia — Butt Free India"
      width="180"
      height="72"
      style="display:block;height:48px;width:auto;max-width:200px;object-fit:contain;border:0;outline:none;margin:0 auto;"
    />
  </a>
  <p style="margin:10px 0 0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:11px;color:#8A8A8A;">
    Butt Free India · <a href="${homeUrl}" style="color:#1B7339;text-decoration:none;">buffindia.com</a>
  </p>
</div>`.trim()
}

export function emailSupporterFooterText(): string {
  return `${EMAIL_BRAND_FOOTER}\nhttps://buffindia.com`
}
