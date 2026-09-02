import { sql } from "@/lib/db"

export type GroupLocation = {
  id: string
  companyName: string
  city: string | null
  state: string | null
  tradeName: string | null
}

let groupColsReady: Promise<void> | null = null

export async function ensureGroupColumns() {
  if (!groupColsReady) {
    groupColsReady = sql
      .query(`
    ALTER TABLE "Customer"
      ADD COLUMN IF NOT EXISTS "isGroup" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "parentCustomerId" TEXT
  `)
      .then(() => undefined)
      .catch((err) => {
        groupColsReady = null
        throw err
      })
  }
  await groupColsReady
}

export async function getGroupLocations(groupId: string): Promise<GroupLocation[]> {
  await ensureGroupColumns()
  const rows = await sql`
    SELECT id, "companyName", city, state, "tradeName"
    FROM "Customer"
    WHERE "parentCustomerId" = ${groupId}
    ORDER BY "companyName" ASC
  `
  return rows as GroupLocation[]
}

export async function isGroupCustomer(customerId: string): Promise<boolean> {
  await ensureGroupColumns()
  const rows = await sql`
    SELECT "isGroup" FROM "Customer" WHERE id = ${customerId} LIMIT 1
  `
  return Boolean((rows[0] as { isGroup?: boolean } | undefined)?.isGroup)
}

/** Customer IDs whose collections belong in a group-level report (child locations). */
export async function resolveReportScopeCustomerIds(customerId: string): Promise<string[]> {
  await ensureGroupColumns()
  const isGroup = await isGroupCustomer(customerId)
  if (!isGroup) return [customerId]

  const children = await getGroupLocations(customerId)
  if (children.length === 0) return [customerId]
  return children.map((c) => c.id)
}

/** Resolve scope for report generation; honours explicit scope when provided. */
export async function resolveReportScope(
  customerId: string,
  scopeCustomerIds?: string[],
): Promise<string[]> {
  if (scopeCustomerIds && scopeCustomerIds.length > 0) {
    return scopeCustomerIds
  }
  return resolveReportScopeCustomerIds(customerId)
}

/** Resolve which customer IDs a session may read (single, group aggregate, or one location). */
export async function resolveReadableCustomerIds(
  sessionCustomerId: string,
  locationId?: string | null,
): Promise<{ ok: true; customerIds: string[] } | { ok: false; error: string }> {
  await ensureGroupColumns()

  const sessionRows = await sql`
    SELECT "isGroup" FROM "Customer" WHERE id = ${sessionCustomerId} LIMIT 1
  `
  const isGroup = Boolean((sessionRows[0] as { isGroup?: boolean } | undefined)?.isGroup)

  if (!isGroup) {
    if (locationId && locationId !== sessionCustomerId) {
      return { ok: false, error: "Forbidden" }
    }
    return { ok: true, customerIds: [sessionCustomerId] }
  }

  if (locationId) {
    const childRows = await sql`
      SELECT id FROM "Customer"
      WHERE id = ${locationId} AND "parentCustomerId" = ${sessionCustomerId}
      LIMIT 1
    `
    if (!childRows[0]) return { ok: false, error: "Forbidden" }
    return { ok: true, customerIds: [locationId] }
  }

  const children = await getGroupLocations(sessionCustomerId)
  if (children.length === 0) {
    return { ok: true, customerIds: [sessionCustomerId] }
  }
  return { ok: true, customerIds: children.map((c) => c.id) }
}
