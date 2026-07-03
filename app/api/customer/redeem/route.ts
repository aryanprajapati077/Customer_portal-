import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { generateKraftRebornCertificatePdf } from "@/lib/generate-kraftreborn-certificate-pdf"
import { syncKraftRebornCertificate } from "@/lib/sync-certificates"
import { computeKraftRebornImpact, creditsToRupees, generateOrderId } from "@/lib/kraftreborn"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const customerId = String(body?.customerId || "")
    const amount = Number(body?.amount)
    const productCount = Number(body?.productCount) || 1
    const orderId = body?.orderId ? String(body.orderId) : generateOrderId(customerId)
    const items = Array.isArray(body?.items) ? body.items : []

    if (!customerId || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "customerId and valid amount required" },
        { status: 400 },
      )
    }

    const customerRows = await sql`
      SELECT id, email, "contactPerson", "companyName", "kraftrebornCredits"
      FROM "Customer"
      WHERE id = ${customerId}
      LIMIT 1
    `
    const customer = customerRows[0] as {
      id: string
      email: string
      contactPerson: string | null
      companyName: string
      kraftrebornCredits: number
    } | undefined

    if (!customer) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 })
    }

    const creditsAvailable = creditsToRupees(Number(customer.kraftrebornCredits) || 0)
    if (amount > creditsAvailable) {
      return NextResponse.json(
        { success: false, error: `Insufficient credits. Available: ₹${creditsAvailable}` },
        { status: 400 },
      )
    }

    const impact = computeKraftRebornImpact(amount, productCount)
    const contactName = customer.contactPerson?.split(" ")[0] || customer.companyName

    await sql`
      UPDATE "Customer"
      SET "kraftrebornCredits" = GREATEST(0, "kraftrebornCredits" - ${amount}),
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${customerId}
    `

    await syncKraftRebornCertificate(customerId, {
      orderId,
      contactName,
      butts: impact.butts,
      soilSqFt: impact.soilSqFt,
      waterLitres: impact.waterLitres,
      productCount: impact.productCount,
    })

    const notifId = `notif_redeem_${customerId}_${Date.now()}`
    const itemSummary =
      items.length > 0
        ? items.map((i: { name?: string; quantity?: number }) => `${i.name || "Item"} ×${i.quantity || 1}`).join(", ")
        : `${productCount} product(s)`
    await sql`
      INSERT INTO "Notification" (id, "customerId", title, body)
      VALUES (
        ${notifId},
        ${customerId},
        ${"Kraft Reborn order confirmed"},
        ${`Order ${orderId}: ${itemSummary}. ₹${amount} KR credits used. Your impact certificate is ready.`}
      )
    `

    const { pdfBuffer, filename, data } = await generateKraftRebornCertificatePdf({
      contactName,
      orderId,
      orderAmountRupees: amount,
      productCount,
    })

    const remainingCredits = creditsAvailable - amount

    return NextResponse.json({
      success: true,
      orderId,
      amount,
      remainingCredits,
      impact: { ...data, artisanMinutes: impact.artisanMinutes, productCount: impact.productCount },
      items,
      certificatePdfBase64: pdfBuffer.toString("base64"),
      filename,
      email: customer.email,
    })
  } catch (error) {
    console.error("Redeem error:", error)
    return NextResponse.json({ success: false, error: "Redemption failed" }, { status: 500 })
  }
}
