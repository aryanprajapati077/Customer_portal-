import { type NextRequest, NextResponse } from "next/server"
import {
  getNotificationTemplate,
  listNotificationTemplates,
  saveNotificationTemplate,
  seedNotificationTemplates,
} from "@/lib/send-notification-email"
import {
  buildNotificationEmail,
  getTemplateMeta,
  type NotificationTemplateCopy,
  type NotificationTemplateId,
} from "@/lib/notification-email-templates"
import { getEsgEmailCopy, saveEsgEmailCopy } from "@/lib/email-template-store"
import { DEFAULT_ESG_EMAIL_COPY, type EsgEmailCopy } from "@/lib/email-templates"
import { SITE_URL } from "@/lib/site-config"

export async function GET(request: NextRequest) {
  try {
    await seedNotificationTemplates()
    const id = request.nextUrl.searchParams.get("id")
    const preview = request.nextUrl.searchParams.get("preview") === "1"

    if (id === "esg_report") {
      const copy = await getEsgEmailCopy()
      return NextResponse.json({
        success: true,
        template: {
          id: "esg_report",
          name: "ESG Impact Report",
          description: "Monthly ESG report share email (PDF + Excel).",
          type: "esg",
          copy,
          defaults: DEFAULT_ESG_EMAIL_COPY,
        },
      })
    }

    if (id) {
      const meta = getTemplateMeta(id)
      if (!meta) {
        return NextResponse.json({ success: false, error: "Unknown template" }, { status: 404 })
      }
      const copy = await getNotificationTemplate(id as NotificationTemplateId)
      let previewBuilt = null
      if (preview) {
        previewBuilt = buildNotificationEmail(copy, {
          portalUrl: SITE_URL,
          name: "Aryan",
          company: "Buffindia",
          month: "July 2026",
          weight: "12.5",
          location: "Ahmedabad HQ",
          locationLine: "\nLocation: Ahmedabad HQ",
          amount: "500",
          balance: "1,250",
          customerId: "BI01",
          ticketId: "A1B2C3D4",
          subject: "Kiosk pickup query",
          category: "collections",
          message: "Need pickup confirmation for this week.",
          otp: "482910",
          purpose: "customer",
          renewalDate: "25 Aug 2026",
          daysLeft: "15",
          daysLeftLine: " (15 days left)",
          orderNumber: "KR-BI01-001",
          itemSummary: "Planter Duo × 1, Coaster Set × 2",
        }, { otpHighlight: id === "password_reset" ? "482910" : undefined })
      }
      return NextResponse.json({
        success: true,
        template: {
          id: meta.id,
          name: meta.name,
          description: meta.description,
          placeholders: meta.placeholders,
          type: "notification",
          copy,
          defaults: meta.defaults,
          preview: previewBuilt,
        },
      })
    }

    const [notifications, esgCopy, renewalCopy] = await Promise.all([
      listNotificationTemplates(),
      getEsgEmailCopy(),
      getNotificationTemplate("service_renewal"),
    ])

    const renewalPreview = buildNotificationEmail(renewalCopy, {
      portalUrl: SITE_URL,
      name: "{{Customer Name}}",
      company: "{{Company}}",
      renewalDate: "{{Renewal Date}}",
      daysLeft: "15",
      daysLeftLine: " (15 days left)",
    })

    return NextResponse.json({
      success: true,
      // Backward compatible for Reports page
      copy: esgCopy,
      defaults: DEFAULT_ESG_EMAIL_COPY,
      renewal: {
        subject: renewalPreview.subject,
        html: renewalPreview.html,
        text: renewalPreview.text,
        trigger: renewalCopy.trigger,
      },
      templates: [
        {
          id: "esg_report",
          name: "ESG Impact Report",
          description: "Monthly ESG report share email (PDF + Excel).",
          type: "esg",
          trigger: "Admin Reports → Send ESG Reports",
          subject: esgCopy.subject,
        },
        ...notifications.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          type: "notification",
          trigger: t.trigger,
          subject: t.subject,
        })),
      ],
    })
  } catch (error) {
    console.error("email-templates GET:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const id = String(body?.id || body?.templateId || "")

    // Backward compatible ESG save (from Reports page)
    if (!id || id === "esg_report") {
      if (body?.copy && !id) {
        // Old reports page shape: { copy: EsgEmailCopy }
        const incoming = body.copy as Partial<EsgEmailCopy>
        const saved = await saveEsgEmailCopy({
          ...DEFAULT_ESG_EMAIL_COPY,
          ...incoming,
        })
        return NextResponse.json({ success: true, copy: saved })
      }
      const incoming = (body?.copy || body) as Partial<EsgEmailCopy>
      const saved = await saveEsgEmailCopy({
        ...DEFAULT_ESG_EMAIL_COPY,
        ...incoming,
      })
      return NextResponse.json({ success: true, copy: saved, id: "esg_report" })
    }

    const meta = getTemplateMeta(id)
    if (!meta) {
      return NextResponse.json({ success: false, error: "Unknown template" }, { status: 404 })
    }

    const saved = await saveNotificationTemplate(
      id as NotificationTemplateId,
      (body?.copy || body) as Partial<NotificationTemplateCopy>,
    )
    return NextResponse.json({ success: true, id, copy: saved })
  } catch (error) {
    console.error("email-templates PUT:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
