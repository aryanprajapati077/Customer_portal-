import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resend, getResendFrom } from "@/lib/resend"
import { queueEmail } from "@/lib/email-queue"
import { verifyTurnstileToken } from "@/lib/turnstile"
import { INDUSTRIES } from "@/lib/impact-calculator"

const SALES_TO = ["aryan@buffindia.com", "campaign@buffindia.com"]
const clean = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const industry = clean(body.industry, 100)
    const name = clean(body.name, 120)
    const businessName = clean(body.businessName, 160)
    const email = clean(body.email, 160).toLowerCase()
    const phone = clean(body.phone, 20)
    const city = clean(body.city, 100)
    const state = clean(body.state, 100)
    const remarks = clean(body.remarks, 2000)

    if (!(INDUSTRIES as readonly string[]).includes(industry)) {
      return NextResponse.json({ error: "Please select an industry" }, { status: 400 })
    }
    if (!name || !businessName || !city || !state) {
      return NextResponse.json({ error: "Please fill all required fields" }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid business email" }, { status: 400 })
    }
    const digits = phone.replace(/\D/g, "")
    if (digits.length < 8 || digits.length > 17) {
      return NextResponse.json({ error: "Enter a valid mobile number" }, { status: 400 })
    }

    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    const captcha = await verifyTurnstileToken(body.turnstileToken ? String(body.turnstileToken) : null, forwarded)
    if (!captcha.ok) return NextResponse.json({ error: captcha.error }, { status: 400 })

    const message = [
      "Website enquiry",
      `Industry: ${industry}`,
      `Name: ${name}`,
      `Business: ${businessName}`,
      `Mobile: ${phone}`,
      `Email: ${email}`,
      `City: ${city}`,
      `State: ${state}`,
      remarks ? `Remarks: ${remarks}` : null,
    ]
      .filter(Boolean)
      .join("\n")

    await prisma.supportTicket.create({
      data: {
        name,
        email,
        subject: `Enquiry — ${businessName} (${industry})`,
        message,
        category: "proposal",
        source: "landing",
        status: "open",
      },
    })

    if (resend) {
      queueEmail("landing_enquiry_sales", async () => {
        await resend!.emails.send({
          from: getResendFrom(),
          to: SALES_TO,
          replyTo: email,
          subject: `[Lead] Enquiry — ${businessName} (${industry})`,
          text: `New website enquiry\n\n${message}`,
        })
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Enquiry API error:", err)
    return NextResponse.json({ error: "Could not submit. Please try again." }, { status: 500 })
  }
}
