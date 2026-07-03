"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"

interface DownloadReportButtonProps {
  customerId: string
  variant?: "default" | "outline"
  size?: "default" | "sm" | "lg"
}

export function DownloadReportButton({
  customerId,
  variant = "default",
  size = "sm",
}: DownloadReportButtonProps) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    if (!customerId) return
    setDownloading(true)
    try {
      const res = await fetch(`/api/customer/impact-report-pdf?customerId=${encodeURIComponent(customerId)}`)
      if (!res.ok) throw new Error("Failed to generate report")

      const blob = await res.blob()
      const disposition = res.headers.get("Content-Disposition")
      const filenameMatch = disposition?.match(/filename="(.+)"/)
      const filename = filenameMatch?.[1] || `${customerId}-ESG-Report.pdf`

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Download report failed:", error)
      alert("Could not download report. Please try again.")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handleDownload} disabled={downloading}>
      {downloading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Generating PDF...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          Download ESG Report
        </>
      )}
    </Button>
  )
}
