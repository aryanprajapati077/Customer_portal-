"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Award, RefreshCw } from "lucide-react"

type CertRow = {
  id: string
  customerId: string
  companyName: string
  name: string
  type: string
  issueDate: string
  certificateNumber: string
  description: string
}

export default function AdminCertificatesPage() {
  const [rows, setRows] = useState<CertRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/certificates")
      const data = await res.json()
      if (data?.success) setRows(data.certificates || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" />
            Certificates
          </h1>
          <p className="text-sm text-muted-foreground">
            Auto-generated Certificate of Services and Kraft Reborn impact certificates
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="text-base">All certificates</CardTitle>
          <CardDescription>{rows.length} records across clients</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No certificates yet. They are created when clients have collections or redeem Kraft Reborn credits.
            </p>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => (
                <div key={r.id} className="p-4 rounded-xl border border-border/50 bg-muted/20">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-semibold text-sm">{r.name}</p>
                    <Badge variant="outline">{r.type}</Badge>
                    <Badge variant="outline" className="bg-muted/30">
                      {r.companyName}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {r.certificateNumber} · {new Date(r.issueDate).toLocaleDateString("en-IN")} · Client {r.customerId}
                  </p>
                  {r.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{r.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
