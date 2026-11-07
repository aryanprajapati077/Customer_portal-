"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertCircle, CheckCircle2, Loader2, Lock, Mail } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KrCreditsLockedDialog({ open, onOpenChange }: Props) {
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const notify = async () => {
    setSending(true)
    setError("")
    try {
      const res = await fetch("/api/customer/kr-unlock-request", { method: "POST" })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Could not send notification")
      }
      setDone(true)
      setMessage(data.message || "Notification sent to BuffIndia.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send notification")
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setDone(false)
          setMessage("")
          setError("")
        }
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-w-md rounded-2xl border-[#E8E4DC] sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF4E5] text-[#C2410C]">
            <Lock className="h-5 w-5" />
          </div>
          <DialogTitle className="text-left text-lg">Service payment pending</DialogTitle>
          <DialogDescription className="text-left text-[13px] leading-relaxed text-[#6B6B6B]">
            Your KR credits are locked because a service payment is pending. Once payment is done,
            notify us and we&apos;ll unlock redemption.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="flex items-start gap-2 rounded-xl border border-[#C8E6D4] bg-[#E8F5E9] px-3 py-3 text-[13px] text-[#1B7339]">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{message}</p>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-xl border border-[#FFE0B2] bg-[#FFF8E7] px-3 py-3 text-[13px] text-[#9A3412]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              If your payment is already complete, click the button below. We&apos;ll email the team and
              open a request on KR Support.
            </p>
          </div>
        )}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          {!done ? (
            <Button
              className="w-full rounded-full bg-[#1B7339] hover:bg-[#145a2c]"
              disabled={sending}
              onClick={() => void notify()}
            >
              {sending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Payment done — notify BuffIndia
            </Button>
          ) : null}
          <Button asChild variant="outline" className="w-full rounded-full">
            <Link href="/dashboard/support" onClick={() => onOpenChange(false)}>
              Open support
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
