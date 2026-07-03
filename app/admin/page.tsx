import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { sql } from "@/lib/db"
import { Sparkles, Users, Package, Bell, FileBarChart, Mail, TrendingUp } from "lucide-react"

export default async function AdminOverviewPage() {
  let customers = 0
  let activeCustomers = 0
  let collections = 0
  let unread = 0
  let monthlyReports = 0
  let totalWaste = 0

  try {
    const [customerRow] = (await sql`SELECT COUNT(*)::int AS customers FROM "Customer"`) as {
      customers: number
    }[]
    const [activeRow] =
      (await sql`SELECT COUNT(*)::int AS active FROM "Customer" WHERE status = 'Active'`) as {
        active: number
      }[]
    const [collectionRow] = (await sql`SELECT COUNT(*)::int AS collections FROM "Collection"`) as {
      collections: number
    }[]
    const [unreadRow] =
      (await sql`SELECT COUNT(*)::int AS unread FROM "Notification" WHERE "readAt" IS NULL`) as {
        unread: number
      }[]
    const [reportRow] =
      (await sql`SELECT COUNT(*)::int AS monthly FROM "Report" WHERE type = 'monthly'`) as {
        monthly: number
      }[]
    const [wasteRow] =
      (await sql`SELECT COALESCE(SUM("totalWasteCollected"), 0)::float AS waste FROM "Customer"`) as {
        waste: number
      }[]

    customers = customerRow?.customers ?? 0
    activeCustomers = activeRow?.active ?? 0
    collections = collectionRow?.collections ?? 0
    unread = unreadRow?.unread ?? 0
    monthlyReports = reportRow?.monthly ?? 0
    totalWaste = wasteRow?.waste ?? 0
  } catch (error) {
    console.error("[admin] Database connection failed:", error)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Command Center
          </div>
          <h1 className="text-3xl font-bold text-foreground">Admin Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage clients, generate monthly ESG reports, and send impact updates at scale.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="bg-transparent">
            <Link href="/admin/reports">
              <Mail className="w-4 h-4 mr-2" />
              Reports & Email
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/customers">
              <Users className="w-4 h-4 mr-2" />
              Manage Clients
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
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
        ].map((item) => (
          <Card key={item.label} className="glass border-border/50 hover-lift">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <item.icon className="w-4 h-4 text-primary" />
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{item.value}</div>
              <p className="text-[11px] text-muted-foreground mt-1">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="glass border-primary/20 lg:col-span-2 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Most common admin workflows</CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            <Button asChild variant="outline" className="justify-start h-auto py-4 bg-background/60">
              <Link href="/admin/reports">
                <div className="text-left">
                  <p className="font-medium flex items-center gap-2">
                    <FileBarChart className="w-4 h-4 text-primary" />
                    Generate Monthly Reports
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Create report entries for all clients</p>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start h-auto py-4 bg-background/60">
              <Link href="/admin/reports">
                <div className="text-left">
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    Email ESG PDFs
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Send reports with attachments to all clients</p>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start h-auto py-4 bg-background/60">
              <Link href="/admin/customers">
                <div className="text-left">
                  <p className="font-medium flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Client Management
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Edit profiles, credits, and targets</p>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start h-auto py-4 bg-background/60">
              <Link href="/admin/homepage">
                <div className="text-left">
                  <p className="font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Homepage Metrics
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Update public impact numbers</p>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Monthly Report Workflow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>1. Generate monthly reports for all active clients.</p>
            <p>2. Review entries in Reports & Email.</p>
            <p>3. Send branded emails with PDF attachments.</p>
            <p>4. Clients see reports in their dashboard and get in-app notifications.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
