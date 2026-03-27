"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  Award,
  Download,
  ExternalLink,
  CheckCircle2,
  Star,
  Shield,
  Trophy,
  Calendar,
  Hash,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState } from "react"
import { getDriveDownloadUrl, isGoogleDriveUrl } from "@/lib/google-sheets"

interface Certificate {
  id: string
  name: string
  issueDate: string
  type: string
  description?: string
  driveFileUrl?: string
  validUntil?: string
  issuedBy?: string
  certificateNumber?: string
  [key: string]: string | number | null | undefined
}

interface CertificatesSectionProps {
  certificates: Certificate[]
  isLoading: boolean
}

export function CertificatesSection({ certificates, isLoading }: CertificatesSectionProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const getTypeConfig = (type: string) => {
    switch (type?.toLowerCase()) {
      case "gold":
        return {
          color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
          icon: Trophy,
          gradient: "from-amber-500/20 to-amber-600/5",
        }
      case "platinum":
        return {
          color: "bg-slate-300/20 text-slate-600 border-slate-400/30",
          icon: Star,
          gradient: "from-slate-400/20 to-slate-500/5",
        }
      case "silver":
        return {
          color: "bg-slate-400/10 text-slate-500 border-slate-400/20",
          icon: Award,
          gradient: "from-slate-400/20 to-slate-500/5",
        }
      case "bronze":
        return {
          color: "bg-orange-600/10 text-orange-600 border-orange-600/20",
          icon: Award,
          gradient: "from-orange-500/20 to-orange-600/5",
        }
      case "esg":
        return {
          color: "bg-secondary/10 text-secondary border-secondary/20",
          icon: Shield,
          gradient: "from-secondary/20 to-secondary/5",
        }
      default:
        return {
          color: "bg-primary/10 text-primary border-primary/20",
          icon: CheckCircle2,
          gradient: "from-primary/20 to-primary/5",
        }
    }
  }

  const handleDownload = async (cert: Certificate) => {
    setDownloadingId(cert.id)

    // Check if there's a Google Drive URL
    if (cert.driveFileUrl && isGoogleDriveUrl(cert.driveFileUrl)) {
      // Open Google Drive download link
      const downloadUrl = getDriveDownloadUrl(cert.driveFileUrl)
      window.open(downloadUrl, "_blank")
      setDownloadingId(null)
      return
    }

    // Fallback: Generate demo certificate
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const content = `
================================================================================
                    BUFFINDIA SUSTAINABILITY CERTIFICATE
================================================================================

Certificate Number: ${cert.certificateNumber || cert.id}
Certificate Name: ${cert.name}
Type: ${cert.type}
Issue Date: ${cert.issueDate}
Valid Until: ${cert.validUntil || "Lifetime"}
Issued By: ${cert.issuedBy || "Buffindia"}

--------------------------------------------------------------------------------

${cert.description || "This certificate is awarded in recognition of outstanding contributions to environmental sustainability through cigarette waste recycling."}

--------------------------------------------------------------------------------

This certificate recognizes your commitment to:
✓ Environmental sustainability
✓ Circular economy practices
✓ Reducing landfill waste
✓ Carbon footprint reduction

--------------------------------------------------------------------------------

Buffindia - Transforming Waste into Value
www.buffindia.com

================================================================================
    `.trim()

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${cert.name.replace(/\s+/g, "-")}-certificate.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setDownloadingId(null)
  }

  const handleView = (cert: Certificate) => {
    if (cert.driveFileUrl && isGoogleDriveUrl(cert.driveFileUrl)) {
      window.open(cert.driveFileUrl, "_blank")
    } else {
      handleDownload(cert)
    }
  }

  return (
    <Card className="glass border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Certificates
            </CardTitle>
            <CardDescription>Your earned sustainability certificates</CardDescription>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            {certificates.length} Earned
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {certificates.map((cert, index) => {
                const config = getTypeConfig(cert.type?.toString() || "")
                const TypeIcon = config.icon
                const hasGoogleDrive = cert.driveFileUrl && isGoogleDriveUrl(cert.driveFileUrl)

                return (
                  <div
                    key={cert.id || index}
                    className={`p-4 rounded-xl bg-gradient-to-r ${config.gradient} border border-border/50 hover:shadow-lg transition-all duration-300 group`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-background/80 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                        <TypeIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-foreground text-sm leading-tight">
                            {cert.name || "Certificate"}
                          </h4>
                          <Badge variant="outline" className={`${config.color} shrink-0 text-[10px]`}>
                            {cert.type || "Standard"}
                          </Badge>
                        </div>

                        {/* Certificate Details */}
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Issued: {cert.issueDate || "N/A"}
                          </span>
                          {cert.certificateNumber && (
                            <span className="flex items-center gap-1">
                              <Hash className="w-3 h-3" />
                              {cert.certificateNumber}
                            </span>
                          )}
                        </div>

                        {cert.description && (
                          <p className="text-xs text-muted-foreground/80 mb-3 line-clamp-2">{cert.description}</p>
                        )}

                        {cert.validUntil && (
                          <p className="text-[10px] text-muted-foreground mb-3">Valid until: {cert.validUntil}</p>
                        )}

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-8 text-xs bg-background/50 hover:bg-background"
                            onClick={() => handleDownload(cert)}
                            disabled={downloadingId === cert.id}
                          >
                            {downloadingId === cert.id ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <Download className="w-3 h-3 mr-1" />
                            )}
                            {hasGoogleDrive ? "Download PDF" : "Download"}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 px-3" onClick={() => handleView(cert)}>
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
