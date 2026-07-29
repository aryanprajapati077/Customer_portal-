import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { CUSTOMER_COOKIE, verifyCustomerSession } from "@/lib/auth-session"
import { resolveReadableCustomerIds } from "@/lib/group-customer-access"

export async function getSessionCustomerId(): Promise<string | null> {
  const jar = await cookies()
  return verifyCustomerSession(jar.get(CUSTOMER_COOKIE)?.value)
}

export async function requireCustomerSession():
  | { ok: true; customerId: string }
  | { ok: false; response: NextResponse } {
  const customerId = await getSessionCustomerId()
  if (!customerId) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    }
  }
  return { ok: true, customerId }
}

/** Reject if requested customerId does not match the signed-in session. */
export function assertCustomerAccess(
  sessionCustomerId: string,
  requestedCustomerId: string | null | undefined,
): NextResponse | null {
  if (!requestedCustomerId) return null
  if (requestedCustomerId === sessionCustomerId) return null
  return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
}

/** Use session ID; optional query/body ID must match when provided. */
export async function resolveCustomerId(
  requestedCustomerId?: string | null,
):
  | { ok: true; customerId: string }
  | { ok: false; response: NextResponse } {
  const session = await requireCustomerSession()
  if (!session.ok) return session

  const denied = assertCustomerAccess(session.customerId, requestedCustomerId)
  if (denied) return { ok: false, response: denied }

  return { ok: true, customerId: session.customerId }
}

/** Session + optional location filter for group accounts (aggregated or per-location). */
export async function resolveCustomerScope(
  requestedCustomerId?: string | null,
  locationId?: string | null,
):
  | { ok: true; sessionCustomerId: string; customerIds: string[] }
  | { ok: false; response: NextResponse } {
  const session = await requireCustomerSession()
  if (!session.ok) return session

  const denied = assertCustomerAccess(session.customerId, requestedCustomerId)
  if (denied) return { ok: false, response: denied }

  const scope = await resolveReadableCustomerIds(session.customerId, locationId)
  if (!scope.ok) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: scope.error }, { status: 403 }),
    }
  }

  return {
    ok: true,
    sessionCustomerId: session.customerId,
    customerIds: scope.customerIds,
  }
}
