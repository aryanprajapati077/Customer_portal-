/** Cloudflare Turnstile server-side verification */

export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim()
  if (!secret) {
    // Allow local/dev when keys are not configured
    return { ok: true }
  }

  const response = String(token || "").trim()
  if (!response) {
    return { ok: false, error: "Captcha verification required" }
  }

  try {
    const body = new URLSearchParams({ secret, response })
    if (remoteIp) body.set("remoteip", remoteIp)

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    })
    const data = (await res.json()) as { success?: boolean }
    if (!data.success) {
      return { ok: false, error: "Captcha verification failed" }
    }
    return { ok: true }
  } catch {
    return { ok: false, error: "Captcha verification unavailable" }
  }
}
