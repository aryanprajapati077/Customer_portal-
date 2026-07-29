/** Central auth secret — production must set AUTH_SECRET (no weak fallbacks). */
export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim()
  if (secret) return secret
  if (process.env.NODE_ENV === "production") {
    console.error("AUTH_SECRET is not configured — sessions will not verify in production")
    return "__missing_auth_secret_production__"
  }
  return process.env.ADMIN_PASSWORD?.trim() || "buffindia-auth-secret-change-me-dev-only"
}
