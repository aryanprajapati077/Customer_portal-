import { resend, getResendFrom } from "@/lib/resend"

export async function sendOtpEmail(options: {
  to: string
  otp: string
  purpose: "customer" | "admin"
}) {
  if (!resend) {
    console.warn("[auth] RESEND_API_KEY not set — OTP:", options.otp)
    return { sent: false, devOtp: options.otp }
  }

  const subject =
    options.purpose === "admin"
      ? "Buffindia Admin — Password reset OTP"
      : "Buffindia — Password reset OTP"

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px">
      <h2 style="color:#ea580c;margin:0 0 8px">Password Reset</h2>
      <p style="color:#444;line-height:1.6">Use this one-time code to reset your password. It expires in 10 minutes.</p>
      <div style="background:#fff7ed;border:2px solid #fed7aa;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
        <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#c2410c">${options.otp}</span>
      </div>
      <p style="color:#888;font-size:12px">If you didn't request this, ignore this email.</p>
      <p style="color:#888;font-size:12px">Portal: <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://impact.buffindia.com"}">${process.env.NEXT_PUBLIC_APP_URL || "https://impact.buffindia.com"}</a></p>
      <p style="color:#888;font-size:12px">— Buffindia · Butt Free India</p>
    </div>
  `

  await resend.emails.send({
    from: getResendFrom(),
    to: options.to,
    subject,
    html,
    text: `Your Buffindia password reset code is ${options.otp}. It expires in 10 minutes.`,
  })

  return { sent: true }
}
