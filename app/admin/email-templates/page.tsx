"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  Mail,
  Save,
  RefreshCw,
  Sparkles,
  ArrowLeft,
  Eye,
} from "lucide-react"

type TemplateListItem = {
  id: string
  name: string
  description: string
  type: string
  trigger: string
  subject: string
}

type NotificationCopy = {
  subject: string
  eyebrow: string
  title: string
  intro: string
  body: string
  ctaLabel: string
  ctaUrl: string
  closing: string
  signOff: string
  footerLine: string
  trigger: string
}

const FIELD_LABELS: { key: keyof NotificationCopy; label: string; rows?: number }[] = [
  { key: "subject", label: "Subject", rows: 2 },
  { key: "eyebrow", label: "Eyebrow" },
  { key: "title", label: "Title" },
  { key: "intro", label: "Intro" },
  { key: "body", label: "Body", rows: 6 },
  { key: "ctaLabel", label: "Button label" },
  { key: "ctaUrl", label: "Button URL" },
  { key: "closing", label: "Closing", rows: 3 },
  { key: "signOff", label: "Sign-off" },
  { key: "footerLine", label: "Footer", rows: 2 },
  { key: "trigger", label: "Trigger note" },
]

export default function AdminEmailTemplatesPage() {
  const [list, setList] = useState<TemplateListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string>("collection_completed")
  const [copy, setCopy] = useState<NotificationCopy | null>(null)
  const [defaults, setDefaults] = useState<NotificationCopy | null>(null)
  const [placeholders, setPlaceholders] = useState<string[]>([])
  const [meta, setMeta] = useState<{ name: string; description: string } | null>(null)
  const [previewHtml, setPreviewHtml] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [renewalBusy, setRenewalBusy] = useState(false)

  const loadList = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/email-templates")
      const data = await res.json()
      if (data?.success) {
        const items = (data.templates || []).filter(
          (t: TemplateListItem) => t.id !== "esg_report",
        ) as TemplateListItem[]
        setList(items)
        if (!items.find((t) => t.id === selectedId) && items[0]) {
          setSelectedId(items[0].id)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const loadDetail = async (id: string) => {
    setDetailLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/email-templates?id=${id}&preview=1`)
      const data = await res.json()
      if (data?.success && data.template?.type === "notification") {
        setCopy(data.template.copy)
        setDefaults(data.template.defaults)
        setPlaceholders(data.template.placeholders || [])
        setMeta({ name: data.template.name, description: data.template.description })
        setPreviewHtml(data.template.preview?.html || "")
      }
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    loadList()
  }, [])

  useEffect(() => {
    if (selectedId) loadDetail(selectedId)
  }, [selectedId])

  const selectedListItem = useMemo(
    () => list.find((t) => t.id === selectedId) || null,
    [list, selectedId],
  )

  const save = async () => {
    if (!copy || !selectedId) return
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch("/api/admin/email-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedId, copy }),
      })
      const data = await res.json()
      if (data?.success) {
        setCopy(data.copy)
        setMessage("Template saved. Future emails will use this copy.")
        await loadDetail(selectedId)
        await loadList()
      } else {
        alert(data?.error || "Save failed")
      }
    } finally {
      setSaving(false)
    }
  }

  const resetDefaults = () => {
    if (!defaults) return
    setCopy({ ...defaults })
  }

  const runRenewalReminders = async () => {
    setRenewalBusy(true)
    setMessage(null)
    try {
      const res = await fetch("/api/admin/renewal-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!data?.success) throw new Error(data?.error || "Failed")
      setMessage(
        `Renewal reminders queued for ${data.sent ?? 0} customer(s) at 30 / 15 / 7 days before expiry.`,
      )
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to send renewal reminders")
    } finally {
      setRenewalBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#E8F5E9] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1B7339]">
            <Sparkles className="h-3.5 w-3.5" />
            Email Studio
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-[clamp(1.8rem,3vw,2.4rem)] leading-tight tracking-tight">
            Notification <em className="italic text-[#1B7339]">templates</em>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit copy for collections, KraftReborn, support, password reset, and renewals.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/reports">
              <ArrowLeft className="mr-2 h-4 w-4" />
              ESG report email
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={runRenewalReminders}
            disabled={renewalBusy}
            title="Emails customers whose contract ends in exactly 30, 15, or 7 days"
          >
            {renewalBusy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            Send renewal reminders
          </Button>
          <Button variant="outline" onClick={() => loadList()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="glass border-border/50 h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Templates</CardTitle>
            <CardDescription>{list.length} notification emails</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {loading && list.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              list.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    selectedId === t.id
                      ? "border-[#1B7339] bg-[#E8F5E9]"
                      : "border-transparent bg-muted/30 hover:bg-muted/50"
                  }`}
                >
                  <p className="text-[13px] font-semibold text-foreground">{t.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{t.trigger}</p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5 text-[#1B7339]" />
              {meta?.name || selectedListItem?.name || "Template"}
            </CardTitle>
            <CardDescription>{meta?.description}</CardDescription>
            {placeholders.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {placeholders.map((p) => (
                  <Badge key={p} variant="outline" className="font-mono text-[10px]">
                    {`{{${p}}}`}
                  </Badge>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {detailLoading || !copy ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                {FIELD_LABELS.map(({ key, label, rows }) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="text-xs">{label}</Label>
                    {rows && rows > 1 ? (
                      <Textarea
                        rows={rows}
                        value={copy[key]}
                        onChange={(e) => setCopy({ ...copy, [key]: e.target.value })}
                        className="resize-y text-sm"
                      />
                    ) : (
                      <Input
                        value={copy[key]}
                        onChange={(e) => setCopy({ ...copy, [key]: e.target.value })}
                      />
                    )}
                  </div>
                ))}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    onClick={save}
                    disabled={saving}
                    className="bg-[#1B7339] hover:bg-[#145a2c]"
                  >
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save template
                  </Button>
                  <Button type="button" variant="outline" onClick={resetDefaults}>
                    Reset to default
                  </Button>
                </div>
                {message && (
                  <p className="rounded-xl border border-[#C8E6D4] bg-[#E8F5E9] px-3 py-2 text-sm text-[#1B7339]">
                    {message}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-4 w-4" />
              Live preview
            </CardTitle>
            <CardDescription>Sample data for placeholders</CardDescription>
          </CardHeader>
          <CardContent>
            {previewHtml ? (
              <div
                className="max-h-[720px] overflow-auto rounded-xl border border-border/50 bg-[#F7F6F2]"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">No preview</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
