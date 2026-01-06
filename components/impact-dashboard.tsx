import { getGlobalImpact } from "@/app/actions/impact-actions"
import { ImpactDashboardClient } from "./impact-dashboard-client"

// Server Component: fetches data and passes it to the Client Component
export async function ImpactDashboard() {
  const impact = await getGlobalImpact()
  return <ImpactDashboardClient impact={impact} />
}
