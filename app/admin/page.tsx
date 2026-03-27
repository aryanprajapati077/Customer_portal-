import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { sql } from "@/lib/db"
import { Sparkles, Users, Package, Bell } from "lucide-react"

export default async function AdminOverviewPage() {
  const [{ customers } = { customers: 0 }] =
    (await sql`SELECT COUNT(*)::int AS customers FROM "Customer"`) as any[]
  const [{ collections } = { collections: 0 }] =
    (await sql`SELECT COUNT(*)::int AS collections FROM "Collection"`) as any[]
  const [{ unread } = { unread: 0 }] =
    (await sql`SELECT COUNT(*)::int AS unread FROM "Notification" WHERE "readAt" IS NULL`) as any[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Overview</h1>
          <p className="text-sm text-muted-foreground">Manage portal data and homepage metrics</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass border-border/50 hover-lift">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Customers
            </CardTitle>
            <CardDescription>Total registered customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{customers}</div>
          </CardContent>
        </Card>

        <Card className="glass border-border/50 hover-lift">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              Collections
            </CardTitle>
            <CardDescription>Total collection records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{collections}</div>
          </CardContent>
        </Card>

        <Card className="glass border-border/50 hover-lift">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              Unread
            </CardTitle>
            <CardDescription>Unread notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{unread}</div>
          </CardContent>
        </Card>

        <Card className="glass border-border/50 hover-lift">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Homepage
            </CardTitle>
            <CardDescription>Update global impact metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Go to Homepage tab</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

