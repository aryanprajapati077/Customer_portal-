import { sendNotificationEmail } from "@/lib/send-notification-email"
import { SITE_URL } from "@/lib/site-config"

export async function sendOtpEmail(options: {
  to: string
  otp: string
  purpose: "customer" | "admin"
}) {
  const to = String(options.to || "")
    .toLowerCase()
    .trim()

  const result = await sendNotificationEmail({
    templateId: "password_reset",
    to,
    queue: false,
    otpHighlight: options.otp,
    vars: {
      name: options.purpose === "admin" ? "Admin" : "there",
      otp: options.otp,
      purpose: options.purpose,
      portalUrl: SITE_URL,
    },
  })

  if ((result as { reason?: string }).reason === "no_resend") {
    console.warn("[auth] RESEND_API_KEY not set — OTP:", options.otp)
    return { sent: false, devOtp: options.otp }
  }

  return { sent: Boolean((result as { sent?: boolean }).sent), devOtp: options.otp }
}
