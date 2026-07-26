import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resend, getResendFrom } from "@/lib/resend"
import { generateProposalPdf } from "@/lib/generate-proposal-pdf"
import {
  calculateImpact,
  isIndustry,
  type CalculatorInput,
  type Industry,
  type KioskType,
} from "@/lib/impact-calculator"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const fullName = String(body.fullName || "").trim()
    const companyName = String(body.companyName || "").trim()
    const email = String(body.email || "").trim()
    const phone = String(body.phone || "").trim()
    const city = String(body.city || "").trim()

    if (!fullName || !companyName || !email || !phone || !city) {
      return NextResponse.json({ error: "All lead fields are required" }, { status: 400 })
    }

    const industryRaw = String(body.industry || "")
    if (!isIndustry(industryRaw)) {
      return NextResponse.json({ error: "Invalid industry" }, { status: 400 })
    }
    const industry = industryRaw as Industry

    const kioskRaw = body.kioskType ? String(body.kioskType) : undefined
    const kioskType: KioskType | undefined =
      kioskRaw === "Basic" || kioskRaw === "Advanced" ? kioskRaw : undefined

    const input: CalculatorInput = {
      industry,
      employees: body.employees != null ? Number(body.employees) : undefined,
      locations: body.locations != null ? Number(body.locations) : undefined,
      smokingZones: body.smokingZones != null ? Number(body.smokingZones) : undefined,
      kioskType,
    }

    const estimate = calculateImpact(input)
    const lead = { fullName, companyName, email, phone, city }

    const pricing = estimate.pricing
    const message = [
      "Impact Calculator — detailed proposal request",
      `Industry: ${estimate.industry}`,
      `Package: ${estimate.packageName}`,
      estimate.kioskType ? `Kiosk type: ${estimate.kioskType}` : null,
      estimate.recommendedKiosks != null ? `Recommended kiosks: ${estimate.recommendedKiosks}` : null,
      pricing
        ? [
            "Pricing:",
            ...pricing.lineItems.map((l) => `  - ${l.label}: ₹${Math.round(l.amount)}`),
            `  Subtotal excl. GST: ₹${Math.round(pricing.subtotalExclGst)}`,
            `  GST @ ${pricing.gstRatePct}%: ₹${Math.round(pricing.gstAmount)}`,
            `  Total incl. GST: ₹${Math.round(pricing.totalInclGst)}`,
          ].join("\n")
        : estimate.annualInvestment != null
          ? `Est. annual investment: ₹${Math.round(estimate.annualInvestment)} ${estimate.annualInvestmentNote || ""}`
          : null,
      estimate.kraftRebornValue != null
        ? `KraftReborn complimentary: ₹${Math.round(estimate.kraftRebornValue)}`
        : null,
      estimate.buttsDiverted != null ? `Butts diverted / yr: ${Math.round(estimate.buttsDiverted)}` : null,
      estimate.waterLitres != null ? `Water protected (L): ${Math.round(estimate.waterLitres)}` : null,
      estimate.impactNote ? `Note: ${estimate.impactNote}` : null,
      `Phone: ${phone}`,
      `City: ${city}`,
      `Inputs: ${JSON.stringify(input)}`,
    ]
      .filter(Boolean)
      .join("\n")

    const ticket = await prisma.supportTicket.create({
      data: {
        name: fullName,
        email,
        subject: `Impact proposal — ${companyName} (${industry})`,
        message,
        category: "proposal",
        source: "impact-calculator",
        status: "open",
      },
    })

    const { pdfBuffer, filename } = await generateProposalPdf(lead, estimate)
    const from = getResendFrom()
    const salesTo = process.env.SALES_EMAIL || process.env.ADMIN_EMAIL

    if (resend) {
      await resend.emails
        .send({
          from,
          to: email,
          subject: `Your Buffindia impact proposal — ${companyName}`,
          html: `
            <p>Hi ${fullName.split(" ")[0] || "there"},</p>
            <p>Thank you for using the Buffindia Impact Calculator. Please find your <strong>detailed commercial proposal</strong> attached (package, kiosk quantity, full pricing with GST, impact summary, and KraftReborn entitlement).</p>
            <p><strong>Recommended:</strong> ${estimate.packageName}<br/>
            ${estimate.summaryLine}</p>
            ${
              pricing
                ? `<p><strong>Est. annual investment:</strong> ₹${Math.round(pricing.subtotalExclGst).toLocaleString("en-IN")} excl. GST · ₹${Math.round(pricing.totalInclGst).toLocaleString("en-IN")} incl. GST (${pricing.gstRatePct}%)</p>`
                : ""
            }
            <p>Our team will follow up shortly. Meanwhile, reply to this email with any questions.</p>
            <p>— Buffindia</p>
          `,
          attachments: [
            {
              filename,
              content: pdfBuffer,
            },
          ],
        })
        .catch((err) => console.error("Proposal customer email failed:", err))

      if (salesTo) {
        await resend.emails
          .send({
            from,
            to: salesTo,
            replyTo: email,
            subject: `[Lead] Impact proposal — ${companyName}`,
            text: `New Impact Calculator lead (#${ticket.id.slice(-8).toUpperCase()})\n\n${message}`,
            attachments: [
              {
                filename,
                content: pdfBuffer,
              },
            ],
          })
          .catch((err) => console.error("Proposal sales email failed:", err))
      }
    }

    return NextResponse.json({
      ok: true,
      id: ticket.id,
      emailed: Boolean(resend),
      filename,
      pdfBase64: pdfBuffer.toString("base64"),
      estimate: {
        packageName: estimate.packageName,
        summaryLine: estimate.summaryLine,
        annualInvestment: estimate.annualInvestment,
        totalInclGst: pricing?.totalInclGst ?? null,
        recommendedKiosks: estimate.recommendedKiosks,
        kraftRebornValue: estimate.kraftRebornValue,
      },
    })
  } catch (err) {
    console.error("Proposal API error:", err)
    return NextResponse.json({ error: "Failed to generate proposal" }, { status: 500 })
  }
}
