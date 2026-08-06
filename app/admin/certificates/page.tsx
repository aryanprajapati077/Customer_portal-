"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Loader2,
  Award,
  RefreshCw,
  Mail,
  FileBadge2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { buildCertificateEmailHtml } from "@/lib/certificate-email"

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

type CustomerOption = {
  id: string
  companyName: string
  email: string
  status: string
}

export default function AdminCertificatesPage() {
  const [rows, setRows] = useState<CertRow[]>([])
  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [loading, setLoading] = useState(true)
  const [customerId, setCustomerId] = useState("")
  const [busy, setBusy] = useState<"generate" | "email" | null>(null)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [certsRes, customersRes] = await Promise.all([
        fetch("/api/admin/certificates"),
        fetch("/api/admin/customers?fields=options"),
      ])
      const certsData = await certsRes.json()
      const customersData = await customersRes.json()
      if (certsData?.success) setRows(certsData.certificates || [])
      if (customersData?.success) setCustomers(customersData.customers || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const customerOptions = useMemo(
    () =>
      [...customers].sort((a, b) =>
        `${a.companyName} ${a.id}`.localeCompare(`${b.companyName} ${b.id}`),
      ),
    [customers],
  )

  const selectedCustomer = customerOptions.find((c) => c.id === customerId)

  const generate = async () => {
    if (!customerId) {
      alert("Select a Customer ID")
      return
    }
    setBusy("generate")
    setResult(null)
    try {
      const res = await fetch(
        `/api/admin/certificates/pdf?customerId=${encodeURIComponent(customerId)}&type=services`,
      )
      if (!res.ok) {
        const errBody = await res.json().catch(() => null)
        throw new Error(errBody?.error || "Generate failed")
      }
      const blob = await res.blob()
      const disposition = res.headers.get("Content-Disposition")
      const filenameMatch = disposition?.match(/filename="(.+)"/)
      const filename = filenameMatch?.[1] || `${customerId}-Certificate.pdf`
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      setResult({ ok: true, text: `Certificate generated for ${customerId} (logo from customer profile).` })
      await load()
    } catch (err) {
      setResult({
        ok: false,
        text: err instanceof Error ? err.message : "Failed to generate certificate",
      })
    } finally {
      setBusy(null)
    }
  }

  const emailCert = async () => {
    if (!customerId) {
      alert("Select a Customer ID")
      return
    }
    if (
      !confirm(
        `Email Certificate of Clean Environmental Partnership (PDF) to ${selectedCustomer?.email || customerId}?`,
      )
    ) {
      return
    }
    setBusy("email")
    setResult(null)
    try {
      const res = await fetch("/api/admin/certificates/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "email", customerId, type: "services" }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.error || "Failed")
      if (data.emailed) {
        setResult({
          ok: true,
          text: `Certificate emailed to ${data.to} · ${data.certificate?.certificateNumber || ""}`,
        })
      } else {
        setResult({
          ok: false,
          text: data.reason || "Certificate generated but email was not sent",
        })
      }
      await load()
    } catch (err) {
      setResult({
        ok: false,
        text: err instanceof Error ? err.message : "Failed to email certificate",
      })
    } finally {
      setBusy(null)
    }
  }

  const previewHtml = buildCertificateEmailHtml({
    companyName: selectedCustomer?.companyName || "Prima Bay",
    contactName: "Partner",
    customerId: customerId || "BI01",
    certificateName: "Certificate of Clean Environmental Partnership",
    certificateNumber: "206",
    fiscalYear: "FY 2025-26",
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#DCE8DC] bg-[#E8F5E9] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1B7339]">
            <Award className="h-3.5 w-3.5" />
            Certificates
          </p>
          <h1 className="admin-page-title">Generate & share</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Uses customer logo and details from the customer record. Email includes a storytelling
            Inspire template + PDF attachment.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} className="rounded-full">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-[#E5E5E5] bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileBadge2 className="h-5 w-5 text-[#1B7339]" />
              Generate / Email Certificate
            </CardTitle>
            <CardDescription>
              Select Customer ID — logo and org details are pulled automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Customer ID *</Label>
              <Select value={customerId || undefined} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {customerOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.id} — {c.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCustomer && (
                <p className="text-[12px] text-[#6B6B6B]">Email: {selectedCustomer.email}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={generate}
                disabled={!!busy || !customerId}
                className="rounded-full bg-[#1B7339] hover:bg-[#145a2c]"
              >
                {busy === "generate" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileBadge2 className="mr-2 h-4 w-4" />
                )}
                Generate PDF
              </Button>
              <Button
                variant="outline"
                onClick={emailCert}
                disabled={!!busy || !customerId}
                className="rounded-full"
              >
                {busy === "email" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                Email to customer
              </Button>
            </div>

            {result && (
              <div
                className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-sm ${
                  result.ok
                    ? "border-[#C8E6D4] bg-[#E8F5E9] text-[#1B7339]"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {result.ok ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                {result.text}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#E5E5E5] bg-white">
          <CardHeader>
            <CardTitle className="text-base">Email template preview</CardTitle>
            <CardDescription>Storytelling Inspire UI sent with the PDF</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="max-h-[420px] overflow-auto rounded-xl border border-[#EAEAEA] bg-[#F7F6F2]"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#E5E5E5] bg-white">
        <CardHeader>
          <CardTitle className="text-base">All certificates</CardTitle>
          <CardDescription>{rows.length} records across clients</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#1B7339]" />
            </div>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No certificates yet. Generate for a Customer ID above.
            </p>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col gap-3 rounded-xl border border-[#E2EBE4] bg-[#F7FBF7] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{r.name}</p>
                      <Badge variant="outline">{r.type}</Badge>
                      <Badge variant="outline" className="border-[#C8E6D4] bg-white text-[#1B7339]">
                        {r.companyName}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {r.certificateNumber} · {new Date(r.issueDate).toLocaleDateString("en-IN")} ·{" "}
                      {r.customerId}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        setCustomerId(r.customerId)
                      }}
                    >
                      Select
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-full bg-[#1B7339] hover:bg-[#145a2c]"
                      onClick={async () => {
                        setCustomerId(r.customerId)
                        setBusy("email")
                        setResult(null)
                        try {
                          const res = await fetch("/api/admin/certificates/pdf", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              action: "email",
                              customerId: r.customerId,
                              certificateId: r.id,
                              type: "services",
                            }),
                          })
                          const data = await res.json()
                          if (data?.emailed) {
                            setResult({ ok: true, text: `Emailed to ${data.to}` })
                          } else {
                            setResult({
                              ok: false,
                              text: data?.error || data?.reason || "Email not sent",
                            })
                          }
                        } finally {
                          setBusy(null)
                        }
                      }}
                      disabled={!!busy}
                    >
                      <Mail className="mr-1.5 h-3.5 w-3.5" />
                      Email
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
