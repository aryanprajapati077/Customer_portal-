"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Database, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

export default function AdminImportPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const runImport = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/admin/import/sheets", { method: "POST" })
      const data = await res.json()
      setResult({
        ok: data.success,
        message: data.success ? data.message : data.error || "Import failed",
      })
    } catch {
      setResult({ ok: false, message: "Network error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Database className="w-6 h-6 text-primary" />
          Import from Google Sheets
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pull historical customer data from your connected Google Sheet into the database
        </p>
      </div>

      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Sheet sync</CardTitle>
          <CardDescription>
            Requires <code className="text-xs bg-muted px-1 rounded">GOOGLE_SHEET_ID</code> in environment.
            Imports the Customers tab — new rows are added; existing emails are updated (metrics only).
            New customers get a hashed password from the sheet or default <code className="text-xs">password123</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runImport} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
            {loading ? "Importing..." : "Import from Google Sheets"}
          </Button>

          {result && (
            <div
              className={`flex items-start gap-2 p-4 rounded-xl text-sm ${
                result.ok ? "bg-emerald-500/10 text-emerald-800" : "bg-destructive/10 text-destructive"
              }`}
            >
              {result.ok ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              {result.message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
