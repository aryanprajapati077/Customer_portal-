/** Admin page permission keys — map to /admin routes */

export const ADMIN_PERMISSIONS = [
  { key: "overview", label: "Overview", href: "/admin" },
  { key: "analytics", label: "Portal Analytics", href: "/admin/analytics" },
  { key: "customers", label: "Customers", href: "/admin/customers" },
  { key: "group-clients", label: "Group Clients", href: "/admin/group-clients" },
  { key: "kr-credits", label: "KR Credits", href: "/admin/kr-credits" },
  { key: "dropdowns", label: "Dropdowns", href: "/admin/dropdowns" },
  { key: "reports", label: "Reports & Email", href: "/admin/reports" },
  { key: "newsletter", label: "Newsletter", href: "/admin/newsletter" },
  { key: "email-templates", label: "Email Templates", href: "/admin/email-templates" },
  { key: "email-settings", label: "Email On/Off", href: "/admin/email-settings" },
  { key: "email-status", label: "Email Status", href: "/admin/email-status" },
  { key: "customer-pocs", label: "Customer POCs", href: "/admin/customer-pocs" },
  { key: "collections", label: "Collections", href: "/admin/collections" },
  { key: "pending-collections", label: "Pending Collections", href: "/admin/pending-collections" },
  { key: "renewals", label: "Renewals", href: "/admin/renewals" },
  { key: "shop-products", label: "Shop Products", href: "/admin/shop/products" },
  { key: "shop-orders", label: "Shop Orders", href: "/admin/shop/orders" },
  { key: "certificates", label: "Certificates", href: "/admin/certificates" },
  { key: "notifications", label: "Notifications", href: "/admin/notifications" },
  { key: "proposals", label: "Proposal Leads", href: "/admin/proposals" },
  { key: "contact", label: "Contact Us", href: "/admin/contact" },
  { key: "support", label: "Support Tickets", href: "/admin/support" },
] as const

export type AdminPermissionKey = (typeof ADMIN_PERMISSIONS)[number]["key"]

export const ALL_PERMISSION_KEYS: AdminPermissionKey[] = ADMIN_PERMISSIONS.map((p) => p.key)

export function parsePermissions(raw: unknown): AdminPermissionKey[] | null {
  if (raw == null || raw === "") return null
  if (Array.isArray(raw)) {
    return raw.filter((k): k is AdminPermissionKey =>
      ALL_PERMISSION_KEYS.includes(k as AdminPermissionKey),
    )
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      return parsePermissions(JSON.parse(raw))
    } catch {
      return []
    }
  }
  return []
}

export function hasAdminPermission(
  role: string | null | undefined,
  permissions: unknown,
  key: AdminPermissionKey | "users",
): boolean {
  if (role === "super_admin") return true
  if (key === "users") return false
  const list = parsePermissions(permissions)
  // Legacy admins with NULL permissions column: full access except users
  if (list === null) return true
  return list.includes(key)
}

export function permissionKeyForPath(pathname: string): AdminPermissionKey | "users" | null {
  if (pathname === "/admin" || pathname === "/admin/") return "overview"
  if (pathname.startsWith("/admin/security")) return null // all signed-in admins
  if (pathname.startsWith("/admin/users")) return "users"
  for (const p of ADMIN_PERMISSIONS) {
    if (p.href === "/admin") continue
    if (pathname === p.href || pathname.startsWith(`${p.href}/`)) return p.key
  }
  return null
}

/** Next renewal anniversary relative to service start (annual). Prefer contractEndDate when set. */
export function computeRenewalDate(
  serviceStart: Date | string | null | undefined,
  contractEnd: Date | string | null | undefined,
  asOf = new Date(),
): Date | null {
  if (contractEnd) {
    const c = new Date(contractEnd)
    if (!Number.isNaN(c.getTime())) return c
  }
  if (!serviceStart) return null
  const start = new Date(serviceStart)
  if (Number.isNaN(start.getTime())) return null

  // First renewal = start + 1 year; then roll forward annually year until we land on
  // the current period end (overdue or next upcoming anniversary).
  let end = new Date(start)
  end.setUTCFullYear(end.getUTCFullYear() + 1)

  const asOfDay = Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate())
  while (true) {
    const endDay = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())
    const next = new Date(end)
    next.setUTCFullYear(next.getUTCFullYear() + 1)
    const nextDay = Date.UTC(next.getUTCFullYear(), next.getUTCMonth(), next.getUTCDate())
    if (endDay >= asOfDay) return end
    if (nextDay > asOfDay) return end // overdue for this anniversary
    end = next
  }
}

export function daysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())
  const b = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate())
  return Math.round((b - a) / 86400000)
}
