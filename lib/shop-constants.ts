export const ORDER_STATUSES = ["pending", "processing", "shipped", "completed", "cancelled"] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export function orderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pending",
    processing: "Processing",
    shipped: "Shipped",
    completed: "Completed",
    cancelled: "Cancelled",
  }
  return labels[status] || status
}

export function orderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-700 border-amber-500/30",
    processing: "bg-blue-500/10 text-blue-700 border-blue-500/30",
    shipped: "bg-violet-500/10 text-violet-700 border-violet-500/30",
    completed: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
    cancelled: "bg-red-500/10 text-red-700 border-red-500/30",
  }
  return colors[status] || "bg-muted text-muted-foreground"
}

export function formatOrderNumber(customerId: string): string {
  const suffix = Date.now().toString(36).toUpperCase().slice(-6)
  return `KR-${customerId.slice(0, 4).toUpperCase()}-${suffix}`
}
