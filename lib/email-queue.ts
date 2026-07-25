import { after } from "next/server"

/**
 * Queue email work after the HTTP response is sent.
 * Uses Next.js `after()` so the job still completes on Vercel/serverless
 * without blocking the client on Resend latency.
 */
export function queueEmail(label: string, task: () => Promise<unknown>): void {
  after(async () => {
    try {
      await task()
    } catch (err) {
      console.error(`[email-queue:${label}]`, err)
    }
  })
}
