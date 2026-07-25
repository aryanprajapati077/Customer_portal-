"use client"

import { useState } from "react"
import {
  Headphones,
  Mail,
  MessageCircle,
  Paperclip,
  Phone,
} from "lucide-react"
import { PortalShell } from "@/components/portal/portal-shell"
import { PageHeader } from "@/components/portal/page-header"
import { usePortalData } from "@/hooks/use-portal-data"
import { SUPPORT_CONTACT, SUPPORT_TOPICS } from "@/lib/support-knowledge"
import { cn } from "@/lib/utils"

const DEMO_TICKETS = [
  { id: "#SUP-1023", subject: "Collection issue", status: "Open" as const },
  { id: "#SUP-1018", subject: "Request report", status: "In Progress" as const },
  { id: "#SUP-1012", subject: "Kiosk not working", status: "Resolved" as const },
  { id: "#SUP-1007", subject: "Invoice download", status: "Resolved" as const },
  { id: "#SUP-1001", subject: "Schedule change", status: "Resolved" as const },
]

const STATUS_STYLE = {
  Open: "bg-[#E8F5E9] text-[#1B7339]",
  "In Progress": "bg-[#FFF3E0] text-[#EF6C00]",
  Resolved: "bg-[#F0F0F0] text-[#6B6B6B]",
}

export default function SupportPage() {
  const { customer, authLoading, dataLoading } = usePortalData()
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject || !message.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customer?.contactPerson || customer?.companyName || "Portal User",
          email: customer?.email,
          subject,
          message,
          category: "general",
          source: "portal-support",
        }),
      })
      if (!res.ok) throw new Error("Failed")
      setSubmitted(true)
      setSubject("")
      setMessage("")
    } catch {
      alert("Could not submit ticket. Please try again or email support@buffindia.com.")
    }
    setSubmitting(false)
  }

  return (
    <PortalShell customer={customer} loading={authLoading || (!customer && dataLoading)}>
      <div className="space-y-5">
        <PageHeader
          icon={Headphones}
          title="Support"
          subtitle="We're here to help. Raise a ticket and our team will get back to you."
        />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="portal-card p-5">
            <h2 className="text-[16px] font-semibold text-[#1A1A1A]">Need Help?</h2>
            <p className="text-[13px] text-[#7A7A7A] mt-0.5 mb-4">
              Tell us what&apos;s happening and we&apos;ll take care of it.
            </p>
            {submitted ? (
              <div className="rounded-xl bg-[#EAF6EC] p-4 text-[13px] text-[#1B7339] font-medium">
                Ticket submitted successfully. Our team will get back to you soon.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="text-[12px] font-medium text-[#4A4A4A]">Subject</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="mt-1.5 w-full h-10 rounded-lg border border-[#D8D8D8] bg-white px-3 text-[13px] text-[#1A1A1A]"
                    required
                  >
                    <option value="">Select a subject</option>
                    {SUPPORT_TOPICS.map((t) => (
                      <option key={t.id} value={t.label}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[12px] font-medium text-[#4A4A4A]">Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue in detail..."
                    className="mt-1.5 w-full min-h-[120px] rounded-lg border border-[#D8D8D8] bg-white px-3 py-2.5 text-[13px] text-[#1A1A1A] resize-y"
                    required
                  />
                </div>
                <div className="rounded-xl border border-dashed border-[#C8C8C8] bg-[#FAFAFA] px-4 py-4 flex items-center gap-3">
                  <Paperclip className="w-4 h-4 text-[#1B7339]" />
                  <div>
                    <p className="text-[12px] font-medium text-[#4A4A4A]">
                      Attach file or image (optional)
                    </p>
                    <p className="text-[11px] text-[#8A8A8A]">JPG, PNG, PDF up to 5MB</p>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 rounded-lg bg-[#1B7339] text-white text-[14px] font-semibold hover:bg-[#145a2c] disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </button>
              </form>
            )}
          </div>

          <div className="portal-card p-5">
            <h2 className="text-[16px] font-semibold text-[#1A1A1A]">My Tickets</h2>
            <p className="text-[13px] text-[#7A7A7A] mt-0.5 mb-4">
              Track the status of your support requests.
            </p>
            <div className="overflow-hidden rounded-xl border border-[#EFEFEF]">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#EAF6EC] text-left">
                    <th className="px-3 py-2.5 text-[12px] font-semibold text-[#1B7339]">Ticket ID</th>
                    <th className="px-3 py-2.5 text-[12px] font-semibold text-[#1B7339]">Subject</th>
                    <th className="px-3 py-2.5 text-[12px] font-semibold text-[#1B7339]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_TICKETS.map((t) => (
                    <tr key={t.id} className="border-t border-[#F0F0F0]">
                      <td className="px-3 py-3 text-[12px] font-medium text-[#1A1A1A]">{t.id}</td>
                      <td className="px-3 py-3 text-[12px] text-[#4A4A4A]">{t.subject}</td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold",
                            STATUS_STYLE[t.status],
                          )}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" className="mt-4 portal-link">
              View all tickets →
            </button>
          </div>
        </div>

        <div className="portal-card p-5">
          <h2 className="text-[16px] font-semibold text-[#1A1A1A]">Contact BuffIndia</h2>
          <p className="text-[13px] text-[#7A7A7A] mt-0.5 mb-5">
            Reach out to our support team through any of the channels below.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#EFEFEF]">
            <div className="flex flex-col items-center text-center px-4 py-3">
              <div className="w-11 h-11 rounded-full bg-[#E8F5E9] flex items-center justify-center mb-2">
                <Mail className="w-5 h-5 text-[#1B7339]" />
              </div>
              <p className="text-[13px] font-semibold text-[#1A1A1A]">Email Support</p>
              <a
                href={`mailto:${SUPPORT_CONTACT.email}`}
                className="text-[13px] text-[#1B7339] font-medium mt-1"
              >
                support@buffindia.com
              </a>
            </div>
            <div className="flex flex-col items-center text-center px-4 py-3">
              <div className="w-11 h-11 rounded-full bg-[#E8F5E9] flex items-center justify-center mb-2">
                <MessageCircle className="w-5 h-5 text-[#1B7339]" />
              </div>
              <p className="text-[13px] font-semibold text-[#1A1A1A]">WhatsApp Support</p>
              <a
                href="https://wa.me/916354766366"
                className="text-[13px] text-[#1B7339] font-medium mt-1"
                target="_blank"
                rel="noreferrer"
              >
                +91 6354 766 366
              </a>
            </div>
            <div className="flex flex-col items-center text-center px-4 py-3">
              <div className="w-11 h-11 rounded-full bg-[#E8F5E9] flex items-center justify-center mb-2">
                <Phone className="w-5 h-5 text-[#1B7339]" />
              </div>
              <p className="text-[13px] font-semibold text-[#1A1A1A]">Call Support</p>
              <a href="tel:+916354766366" className="text-[13px] text-[#1B7339] font-medium mt-1">
                +91 6354 766 366
              </a>
              <p className="text-[11px] text-[#8A8A8A] mt-1">Mon – Sat, 9:00 AM – 6:00 PM</p>
            </div>
          </div>
        </div>
      </div>
    </PortalShell>
  )
}
