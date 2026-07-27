import Link from "next/link"
import { Button } from "@/components/ui/button"
import { sql } from "@/lib/db"
import {
  Users,
  Package,
  Bell,
  FileBarChart,
  Mail,
  TrendingUp,
  ArrowRight,
  ListTree,
  Sparkles,
} from "lucide-react"

export default async function AdminOverviewPage() {
  let customers = 0
  let activeCustomers = 0
  let collections = 0
  let unread = 0
  let monthlyReports = 0
  let totalWaste = 0

  try {
    const [statsRow] = (await sql`
      SELECT
        (SELECT COUNT(*)::int FROM "Customer") AS customers,
        (SELECT COUNT(*)::int FROM "Customer" WHERE status = 'Active') AS active,
        (SELECT COUNT(*)::int FROM "Collection") AS collections,
        (SELECT COUNT(*)::int FROM "Notification" WHERE "readAt" IS NULL) AS unread,
        (SELECT COUNT(*)::int FROM "Report" WHERE type = 'monthly') AS monthly,
        (SELECT COALESCE(SUM("totalWasteCollected"), 0)::float FROM "Customer") AS waste
    `) as {
      customers: number
      active: number
      collections: number
      unread: number
      monthly: number
      waste: number
    }[]

    customers = statsRow?.customers ?? 0
    activeCustomers = statsRow?.active ?? 0
    collections = statsRow?.collections ?? 0
    unread = statsRow?.unread ?? 0
    monthlyReports = statsRow?.monthly ?? 0
    totalWaste = statsRow?.waste ?? 0
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

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#DCE8DC] bg-[#E8F5E9] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1B7339]">
            <Sparkles className="h-3.5 w-3.5" />
            Command Center
          </p>
          <h1 className="admin-page-title">Admin Overview</h1>
          <p className="mt-1.5 text-[14px] text-[#6B6B6B]">
            Clients, collections, shop orders, ESG reports, and support — one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            asChild
            variant="outline"
            className="rounded-full border-[#DCE8DC] bg-white text-[#1B7339] hover:bg-[#E8F5E9]"
          >
            <Link href="/admin/reports">
              <Mail className="mr-2 h-4 w-4" />
              Reports & Email
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-full border-[#DCE8DC] bg-white text-[#1B7339] hover:bg-[#E8F5E9]"
          >
            <Link href="/admin/shop/orders">
              <Package className="mr-2 h-4 w-4" />
              Shop Orders
            </Link>
          </Button>
          <Button asChild className="rounded-full bg-[#1B7339] hover:bg-[#145a2c]">
            <Link href="/admin/customers">
              <Users className="mr-2 h-4 w-4" />
              Manage Clients
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-[#E5E5E5] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
          >
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[#7A7A7A]">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E8F5E9] text-[#1B7339]">
                <item.icon className="h-3.5 w-3.5" />
              </span>
              {item.label}
            </div>
            <div className="text-[1.65rem] font-bold tracking-tight text-[#141414]">{item.value}</div>
            <p className="mt-1 text-[11px] text-[#8A8A8A]">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-[#DCE8DC] bg-gradient-to-br from-[#E8F5E9] to-white p-5 lg:col-span-2">
          <h2 className="text-[16px] font-semibold text-[#141414]">Quick Actions</h2>
          <p className="mt-0.5 text-[13px] text-[#6B6B6B]">Most common admin workflows</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              {
                href: "/admin/reports",
                icon: FileBarChart,
                title: "Generate Monthly Reports",
                desc: "Create report entries for all clients",
              },
              {
                href: "/admin/reports",
                icon: Mail,
                title: "Email ESG PDFs",
                desc: "Send reports with attachments",
              },
              {
                href: "/admin/customers",
                icon: Users,
                title: "Client Management",
                desc: "Edit profiles, credits, and targets",
              },
              {
                href: "/admin/dropdowns",
                icon: ListTree,
                title: "Manage Dropdowns",
                desc: "LSU names & technicians for forms",
              },
            ].map((a) => (
              <Link
                key={a.title}
                href={a.href}
                className="group flex items-start justify-between gap-3 rounded-xl border border-[#E2EBE4] bg-white px-4 py-3.5 transition-all hover:border-[#1B7339]/30 hover:shadow-sm"
              >
                <div>
                  <p className="flex items-center gap-2 text-[13.5px] font-semibold text-[#141414]">
                    <a.icon className="h-4 w-4 text-[#1B7339]" />
                    {a.title}
                  </p>
                  <p className="mt-1 text-[12px] text-[#7A7A7A]">{a.desc}</p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#A0A0A0] transition-transform group-hover:translate-x-0.5 group-hover:text-[#1B7339]" />
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-5">
          <h2 className="text-[16px] font-semibold text-[#141414]">Monthly Report Workflow</h2>
          <ol className="mt-4 space-y-3 text-[13px] leading-relaxed text-[#5A5A5A]">
            <li className="flex gap-2">
              <span className="font-semibold text-[#1B7339]">1.</span>
              Generate monthly reports for all active clients.
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-[#1B7339]">2.</span>
              Review entries in Reports & Email.
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-[#1B7339]">3.</span>
              Send branded emails with PDF attachments.
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-[#1B7339]">4.</span>
              Clients see reports in dashboard + notifications.
            </li>
          </ol>
          <Link
            href="/admin/security"
            className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1B7339] hover:underline"
          >
            Manage authenticator
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
