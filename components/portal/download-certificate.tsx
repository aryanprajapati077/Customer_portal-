"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, FileBadge2, Loader2, Mail } from "lucide-react"
import { cn } from "@/lib/utils"

type CertType = "services" | "kraftreborn"

interface DownloadCertificateProps {
  customerId?: string
  certificateId?: string
  certificateType?: string
  defaultType?: CertType
  children: React.ReactNode
}

async function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function DownloadCertificate({
  customerId,
  certificateId,
  certificateType,
  defaultType = "services",
  children,
}: DownloadCertificateProps) {
  const initialType: CertType =
    certificateType === "KraftReborn" || certificateType === "kraftreborn"
      ? "kraftreborn"
      : defaultType
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<CertType>(initialType)
  const [busy, setBusy] = useState<"download" | "email" | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleDownload = async () => {
    if (!customerId) return
    setBusy("download")
    setMessage(null)
    try {
      const params = new URLSearchParams({ customerId, type })
      if (certificateId) params.set("certificateId", certificateId)

      const res = await fetch(`/api/customer/certificate-pdf?${params.toString()}`)
      if (!res.ok) throw new Error("Failed")
      const blob = await res.blob()
      const disposition = res.headers.get("Content-Disposition")
      const filenameMatch = disposition?.match(/filename="(.+)"/)
      const filename =
        filenameMatch?.[1] ||
        `${customerId}-${type === "services" ? "Service" : "KraftReborn"}-Certificate.pdf`
      await triggerDownload(blob, filename)
      setOpen(false)
    } catch (error) {
      console.error("Certificate download failed:", error)
      alert("Could not download certificate. Please try again.")
    } finally {
      setBusy(null)
    }
  }

  const handleEmail = async () => {
    if (!customerId) return
    setBusy("email")
    setMessage(null)
    try {
      const res = await fetch("/api/customer/certificate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "email",
          customerId,
          certificateId,
          type: "services",
        }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to email")
      }
      if (data.emailed) {
        setMessage(`Certificate emailed to ${data.to}`)
      } else {
        setMessage(
          data.reason
            ? `Generated, but email was not sent (${data.reason}).`
            : "Generated, but email was not sent.",
        )
      }
    } catch (error) {
      console.error("Certificate email failed:", error)
      alert(error instanceof Error ? error.message : "Could not email certificate.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild disabled={!customerId}>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Certificate</DialogTitle>
          <DialogDescription>
            Uses your saved customer logo and profile details. Download the PDF or email it with a
            branded template.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-sm font-medium text-[#1F4A30]">Certificate type</p>
          {(
            [
              {
                id: "services" as const,
                label: "Clean Environmental Partnership",
                hint: "Partnership & waste management attestation",
              },
              {
                id: "kraftreborn" as const,
                label: "KraftReborn Certificate",
                hint: "Requires a completed shop order",
              },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setType(opt.id)}
              disabled={opt.id === "kraftreborn" && !certificateId}
              className={cn(
                "flex w-full items-start justify-between rounded-xl border px-3 py-2.5 text-left transition-colors",
                type === opt.id
                  ? "border-[#1B7339] bg-[#E8F5E9]"
                  : "border-[#E5E5E5] bg-white hover:bg-[#FAFAFA]",
                opt.id === "kraftreborn" && !certificateId && "cursor-not-allowed opacity-50",
              )}
            >
              <span>
                <span className="block text-[13px] font-semibold text-[#1A1A1A]">{opt.label}</span>
                <span className="mt-0.5 block text-[11px] text-[#7A7A7A]">{opt.hint}</span>
              </span>
              <span
                className={cn(
                  "mt-1 h-3.5 w-3.5 rounded-full border",
                  type === opt.id ? "border-[#1B7339] bg-[#1B7339]" : "border-[#C5C5C5]",
                )}
              />
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-[#E5E5E5] bg-[#F8FBF8] p-3">
          <p className="text-[12px] leading-relaxed text-[#4A4A4A]">
            Logo and organization details come from your customer profile — no separate upload needed.
          </p>
        </div>

        {message && (
          <p className="rounded-xl border border-[#C8E6D4] bg-[#E8F5E9] px-3 py-2 text-sm text-[#1B7339]">
            {message}
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {type === "services" && (
            <Button
              type="button"
              variant="outline"
              onClick={handleEmail}
              disabled={!!busy}
              className="rounded-full"
            >
              {busy === "email" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Email me
            </Button>
          )}
          <Button
            type="button"
            onClick={handleDownload}
            disabled={!!busy || (type === "kraftreborn" && !certificateId)}
            className="rounded-full bg-[#1B7339] hover:bg-[#145a2c]"
          >
            {busy === "download" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileBadge2 className="mr-2 h-4 w-4" />
            )}
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function CertificateDownloadButton({
  customerId,
  certificateId,
  certificateType,
  driveFileUrl,
  className,
}: {
  customerId?: string
  certificateId?: string
  certificateType?: string
  driveFileUrl?: string | null
  className?: string
}) {
  if (driveFileUrl) {
    return (
      <button
        type="button"
        onClick={() => window.open(driveFileUrl, "_blank")}
        className={cn(
          "inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#2E7D32]",
          className,
        )}
      >
        <Download className="h-3.5 w-3.5" />
        Download Certificate
      </button>
    )
  }

  return (
    <DownloadCertificate
      customerId={customerId}
      certificateId={certificateId}
      certificateType={certificateType}
      defaultType={certificateType === "KraftReborn" ? "kraftreborn" : "services"}
    >
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#2E7D32]",
          className,
        )}
      >
        <Download className="h-3.5 w-3.5" />
        Download Certificate
      </button>
    </DownloadCertificate>
  )
}
