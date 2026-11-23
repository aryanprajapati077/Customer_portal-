import Link from "next/link"
import { Button } from "@/components/ui/button"
import { sql } from "@/lib/db"
import { AdminAttentionStrip } from "@/components/admin/admin-ui"
import {
  Users,
  Package,
  Bell,
  FileBarChart,
  Mail,
  TrendingUp,
  ArrowRight,
  Sparkles,
  ListChecks,
} from "lucide-react"

export default async function AdminOverviewPage() {
  let customers = 0
  let activeCustomers = 0
  let collections = 0
  let unread = 0
  let monthlyReports = 0
  let totalWaste = 0
  let openSupportTickets = 0
  let failedEmails = 0

  try {
    const [statsRow] = (await sql`
      SELECT
        (SELECT COUNT(*)::int FROM "Customer") AS customers,
        (SELECT COUNT(*)::int FROM "Customer" WHERE status = 'Active') AS active,
        (SELECT COUNT(*)::int FROM "Collection") AS collections,
        (SELECT COUNT(*)::int FROM "Notification" WHERE "readAt" IS NULL) AS unread,
        (SELECT COUNT(*)::int FROM "Report" WHERE type = 'monthly') AS monthly,
        (SELECT COALESCE(SUM("totalWasteCollected"), 0)::float FROM "Customer") AS waste,
        (SELECT COUNT(*)::int FROM "SupportTicket" WHERE status = 'open') AS open_tickets
    `) as {
      customers: number
      active: number
      collections: number
      unread: number
      monthly: number
      waste: number
      open_tickets: number
    }[]

    customers = statsRow?.customers ?? 0
    activeCustomers = statsRow?.active ?? 0
    collections = statsRow?.collections ?? 0
    unread = statsRow?.unread ?? 0
    monthlyReports = statsRow?.monthly ?? 0
    totalWaste = statsRow?.waste ?? 0
    openSupportTickets = statsRow?.open_tickets ?? 0

    try {
      const [failedRow] = (await sql`
        SELECT COUNT(*)::int AS failed_emails
        FROM "EmailDeliveryLog"
        WHERE status IN ('failed', 'bounced', 'complained')
      `) as { failed_emails: number }[]
      failedEmails = failedRow?.failed_emails ?? 0
    } catch {
      failedEmails = 0
    }
  } catch (error) {
    console.error("[admin] Database connection failed:", error)
  }

  const stats = [
    { label: "Total Clients", value: customers, icon: Users, desc: "Registered accounts" },
    { label: "Active Clients", value: activeCustomers, icon: TrendingUp, desc: "Eligible for reports" },
    { label: "Collections", value: collections, icon: Package, desc: "Pickup records" },
    { label: "Monthly Reports", value: monthlyReports, icon: FileBarChart, desc: "Generated reports" },
    { label: "Unread Alerts", value: unread, icon: Bell, desc: "Notifications pending" },
    {
      label: "Total Waste (kg)",
      value: totalWaste.toFixed(1),
      icon: Sparkles,
      desc: "Across all clients",
    },
  ]

  const attentionItems = [
    ...(unread > 0
      ? [{ label: "Unread notifications", value: unread, href: "/admin/notifications", tone: "warn" as const }]
      : []),
    ...(openSupportTickets > 0
      ? [
          {
            label: "Open support tickets",
            value: openSupportTickets,
            href: "/admin/support",
            tone: "warn" as const,
          },
        ]
      : []),
    ...(failedEmails > 0
      ? [
          {
            label: "Failed / bounced emails",
            value: failedEmails,
            href: "/admin/reports",
            tone: "danger" as const,
          },
        ]
      : []),
  ]

  const greeting = (() => {
    const h = Number(new Date().toLocaleString("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }))
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"
  })()
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Kolkata",
  })

  const quickActions = [
    { href: "/admin/customers", icon: Users, title: "Clients", desc: "Profiles, credits and targets" },
    { href: "/admin/collections", icon: Package, title: "Collections", desc: "Log and review pickups" },
    { href: "/admin/reports", icon: FileBarChart, title: "Reports & Email", desc: "Generate and send ESG reports" },
    { href: "/admin/report-status", icon: ListChecks, title: "Report Status", desc: "Delivered, bounced and pending" },
    { href: "/admin/quotations", icon: Mail, title: "Quotations", desc: "Proposals and proforma invoices" },
    { href: "/admin/analytics", icon: TrendingUp, title: "Portal Analytics", desc: "Who is online and visiting" },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <p className="text-[13px] font-medium text-[#86868b]">{today}</p>
          <h1 className="admin-page-title">{greeting}</h1>
          <p className="admin-page-desc">Here’s what’s happening across BuffIndia today.</p>
        </div>
        <Button asChild className="h-9 self-start px-4 sm:self-auto">
          <Link href="/admin/customers">
            <Users className="h-4 w-4" />
            Manage clients
          </Link>
        </Button>
      </div>

      {attentionItems.length > 0 ? (
        <section className="space-y-2.5" aria-labelledby="attention-heading">
          <h2 id="attention-heading" className="text-[20px] font-semibold tracking-[-0.022em] text-[#1d1d1f]">
            Needs attention
          </h2>
          <AdminAttentionStrip items={attentionItems} />
        </section>
      ) : null}

      <section className="space-y-2.5" aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="text-[20px] font-semibold tracking-[-0.022em] text-[#1d1d1f]">
          Overview
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {stats.map((item) => (
            <div key={item.label} className="admin-stat-card">
              <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#6e6e73]">
                <item.icon className="h-[15px] w-[15px] text-[#1b7339]" strokeWidth={1.9} aria-hidden />
                {item.label}
              </div>
              <div className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.03em] text-[#1d1d1f] tabular-nums">
                {typeof item.value === "number" ? item.value.toLocaleString("en-IN") : item.value}
              </div>
              <p className="mt-1.5 text-[12px] text-[#86868b]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-2.5 lg:col-span-2" aria-labelledby="actions-heading">
          <h2 id="actions-heading" className="text-[20px] font-semibold tracking-[-0.022em] text-[#1d1d1f]">
            Quick actions
          </h2>
          <div className="admin-surface overflow-hidden">
            <ul className="grid sm:grid-cols-2">
              {quickActions.map((a, i) => (
                <li
                  key={a.title}
                  className={
                    i < quickActions.length - 1
                      ? `border-b-[0.5px] border-[rgba(0,0,0,0.08)] ${i >= quickActions.length - 2 ? "sm:border-b-0" : ""}`
                      : ""
                  }
                >
                  <Link
                    href={a.href}
                    className="group flex items-center gap-3 px-4 py-3.5 transition-colors duration-100 hover:bg-[rgba(0,0,0,0.025)] active:bg-[rgba(0,0,0,0.05)]"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#1b7339] text-white">
                      <a.icon className="h-4 w-4" strokeWidth={1.9} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-medium tracking-[-0.01em] text-[#1d1d1f]">{a.title}</span>
                      <span className="block truncate text-[12.5px] text-[#86868b]">{a.desc}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-[#c7c7cc] transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="space-y-2.5" aria-labelledby="workflow-heading">
          <h2 id="workflow-heading" className="text-[20px] font-semibold tracking-[-0.022em] text-[#1d1d1f]">
            Monthly reports
          </h2>
          <div className="admin-surface p-5">
            <ol className="space-y-3.5">
              {[
                "Generate monthly reports for all active clients.",
                "Review entries in Reports & Email.",
                "Send branded emails with PDF attachments.",
                "Clients see reports in their dashboard.",
              ].map((t, i) => (
                <li key={t} className="flex gap-3 text-[14px] leading-snug text-[#424245]">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(118,118,128,0.12)] text-[11px] font-semibold text-[#6e6e73]">
                    {i + 1}
                  </span>
                  {t}
                </li>
              ))}
            </ol>
            <Link
              href="/admin/reports"
              className="mt-5 inline-flex items-center gap-1 text-[14px] font-medium text-[#1b7339] hover:underline"
            >
              Open Reports & Email
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
