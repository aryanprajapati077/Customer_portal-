import { Pool, type QueryResultRow } from "pg"

declare global {
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined
}

function getPool(): Pool {
  if (!globalThis.pgPool) {
    const url = process.env.DATABASE_URL
    if (!url) {
      throw new Error("DATABASE_URL is not set. Add it to your .env file.")
    }
    globalThis.pgPool = new Pool({ connectionString: url })
  }
  return globalThis.pgPool
}

type SqlTaggedTemplate = {
  <T extends QueryResultRow = QueryResultRow>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]>
  query: <T extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]) => Promise<T[]>
}

function buildQuery(strings: TemplateStringsArray, values: unknown[]) {
  let text = strings[0]
  for (let i = 0; i < values.length; i++) {
    text += `$${i + 1}` + strings[i + 1]
  }
  return { text, values }
}

async function taggedQuery<T extends QueryResultRow>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  const { text, values: params } = buildQuery(strings, values)
  const result = await getPool().query<T>(text, params)
  return result.rows
}

// Pooled Postgres client — more reliable than Neon HTTP fetch in local Node.js dev
export const sql = Object.assign(taggedQuery, {
  query: async <T extends QueryResultRow>(text: string, values: unknown[] = []) => {
    const result = await getPool().query<T>(text, values)
    return result.rows
  },
}) as SqlTaggedTemplate

// Helper type definitions for our database models
export type Customer = {
  id: string
  email: string
  password: string
  companyName: string
  contactPerson: string
  phone: string
  address: string
  disposalUnitInstalled: number
  totalWasteCollected: number
  cigaretteButtsCollected: number
  microplasticsUpcycled: number
  waterResourcesProtected: number
  pendingCollection: number
  certificatesEarned: number
  status: string
  co2Saved: number
  treesEquivalent: number
  industry: string
  employeeCount: number
  monthlyTarget: number
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export type Collection = {
  id: string
  customerId: string
  date: Date
  weight: number
  location: string | null
  status: string
  collectorName: string | null
  vehicleNumber: string | null
  co2Saved: number
  createdAt: Date
}

export type Certificate = {
  id: string
  customerId: string
  name: string
  description: string | null
  issueDate: Date
  pdfUrl: string | null
  wasteProcessed: number
  validUntil: Date | null
}

export type Report = {
  id: string
  customerId: string
  title: string
  type: string
  date: Date
  pdfUrl: string | null
  summary: string | null
}

export type GlobalImpact = {
  id: string
  wasteCollected: number
  productsCreated: number
  treesEquivalent: number
  co2Prevented: number
  updatedAt: Date
}
