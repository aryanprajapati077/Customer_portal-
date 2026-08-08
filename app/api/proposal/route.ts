import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resend, getResendFrom } from "@/lib/resend"
import { generateProposalPdf } from "@/lib/generate-proposal-pdf"
import { sendNotificationEmail } from "@/lib/send-notification-email"
import { queueEmail } from "@/lib/email-queue"
import {
  calculateImpact,
  formatInr,
  isIndustry,
  normalizeIndustry,
  type CalculatorInput,
  type Industry,
  type OrganisationPriority,
} from "@/lib/impact-calculator"

export const maxDuration = 60

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
    const industry = normalizeIndustry(industryRaw) as Industry

    const priorityRaw = body.priority ? String(body.priority) : undefined
    const priority: OrganisationPriority | undefined =
      priorityRaw === "cost" || priorityRaw === "premium" || priorityRaw === "both"
        ? priorityRaw
        : undefined

    const input: CalculatorInput = {
      industry,
      occupancy:
        body.occupancy != null
          ? Number(body.occupancy)
          : body.employees != null
            ? Number(body.employees)
            : undefined,
      smokingZones: body.smokingZones != null ? Number(body.smokingZones) : undefined,
      priority,
      kioskType:
        body.kioskType === "Basic" || body.kioskType === "Advanced" ? body.kioskType : undefined,
    }

    const estimate = calculateImpact(input)
    const lead = { fullName, companyName, email, phone, city }
    const pricing = estimate.pricing

    const { pdfBuffer, filename } = await generateProposalPdf(lead, estimate)

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

    const salesTo = process.env.SALES_EMAIL || process.env.ADMIN_EMAIL
    const firstName = fullName.split(" ")[0] || "there"

    const investmentLine = pricing
      ? `\nEst. annual investment: ₹${formatInr(pricing.subtotalExclGst)} excl. GST · ₹${formatInr(pricing.totalInclGst)} incl. GST (${pricing.gstRatePct}%)`
      : estimate.annualInvestment != null
        ? `\nEst. annual investment: ₹${formatInr(estimate.annualInvestment)} ${estimate.annualInvestmentNote || ""}`
        : ""

    queueEmail("impact_proposal_ticket", async () => {
      await prisma.supportTicket.create({
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
    })

    queueEmail("impact_proposal_customer", async () => {
      await sendNotificationEmail({
        templateId: "impact_proposal",
        to: email,
        queue: false,
        label: "impact_proposal_customer",
        vars: {
          name: firstName,
          company: companyName,
          industry: estimate.industry,
          packageName: estimate.packageName,
          summaryLine: estimate.summaryLine,
          investmentLine,
          kioskLine:
            estimate.recommendedKiosks != null
              ? `\nRecommended kiosks: ${estimate.recommendedKiosks}${estimate.kioskType ? ` (${estimate.kioskType})` : ""}`
              : "",
          buttsLine:
            estimate.buttsDiverted != null
              ? `\nCigarette butts diverted / year: ${formatInr(estimate.buttsDiverted)}`
              : "",
          waterLine:
            estimate.waterLitres != null
              ? `\nWater pollution prevented: ${formatInr(Math.round(estimate.waterLitres))} litres`
              : "",
          kraftLine:
            estimate.kraftRebornValue != null
              ? `\nComplimentary KraftReborn value: ₹${formatInr(estimate.kraftRebornValue)}`
              : "",
          city,
          phone,
        },
        attachments: [{ filename, content: pdfBuffer }],
      })
    })

    if (resend && salesTo) {
      queueEmail("impact_proposal_sales", async () => {
        await resend!.emails.send({
          from: getResendFrom(),
          to: salesTo,
          replyTo: email,
          subject: `[Lead] Impact proposal — ${companyName}`,
          text: `New Impact Calculator lead\n\n${message}`,
          attachments: [{ filename, content: pdfBuffer }],
        })
      })
    }

    return NextResponse.json({
      ok: true,
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
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate proposal" },
      { status: 500 },
    )
  }
}
