import { Resend } from "resend"

export const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export function getResendFrom() {
  return process.env.RESEND_FROM || "Buffindia <no-reply@buffindia.com>"
}

