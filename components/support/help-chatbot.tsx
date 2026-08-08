"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import {
  findSupportAnswer,
  QUICK_PROMPTS,
  SUPPORT_TOPICS,
  type SupportTopic,
} from "@/lib/support-knowledge"
import {
  findLandingFaqAnswer,
  LANDING_DEFAULT_REPLY,
  LANDING_FAQ_TOPICS,
  LANDING_QUICK_PROMPTS,
  LANDING_WELCOME,
  WHATSAPP_URL,
  type LandingFaqTopic,
} from "@/lib/landing-chatbot-knowledge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { MessageCircle, X, Send, Leaf, User, ExternalLink, Loader2, Sparkles } from "lucide-react"

type ChatMessage = {
  id: string
  role: "bot" | "user"
  text: string
  topic?: SupportTopic
  links?: { label: string; href: string }[]
}

function uid() {
  return Math.random().toString(36).slice(2, 11)
}

const PORTAL_WELCOME: ChatMessage = {
  id: "welcome",
  role: "bot",
  text: "Hi — I'm the BuffIndia Help Guide. Ask about login, credits, orders, reports, or pick a topic below.",
}

function isLandingPath(pathname: string | null) {
  if (!pathname) return false
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/login")) {
    return false
  }
  return true
}

export function HelpChatbot() {
  const pathname = usePathname()
  const landingMode = isLandingPath(pathname)
  const { customer } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    landingMode
      ? { id: "welcome", role: "bot", text: LANDING_WELCOME }
      : PORTAL_WELCOME,
  ])
  const [input, setInput] = useState("")
  const [showTicketForm, setShowTicketForm] = useState(false)
  const [ticketSubject, setTicketSubject] = useState("")
  const [ticketMessage, setTicketMessage] = useState("")
  const [ticketEmail, setTicketEmail] = useState("")
  const [ticketSending, setTicketSending] = useState(false)
  const [ticketSent, setTicketSent] = useState(false)
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMessages([
      landingMode
        ? { id: "welcome", role: "bot", text: LANDING_WELCOME }
        : PORTAL_WELCOME,
    ])
  }, [landingMode])

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
    })
  }, [])

  useEffect(() => {
    if (open) scrollToBottom()
  }, [messages, open, showTicketForm, typing, scrollToBottom])

  useEffect(() => {
    if (open && !showTicketForm) inputRef.current?.focus()
  }, [open, showTicketForm])

  const addBotReply = (topic: SupportTopic | LandingFaqTopic | null, userText: string) => {
    setTyping(false)
    if (topic) {
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "bot", text: topic.answer, links: topic.links },
      ])
    } else if (landingMode) {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "bot",
          text: LANDING_DEFAULT_REPLY,
          links: [
            { label: "Chat on WhatsApp", href: WHATSAPP_URL },
            { label: "Request a callback", href: "/contact" },
            { label: "Impact calculator", href: "/#calculator" },
          ],
        },
      ])
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "bot",
          text: `I couldn't find an exact match for "${userText}". Try a quick topic, visit Support, or submit a ticket.`,
          links: [
            { label: "Support Center", href: "/dashboard/support" },
            { label: "Contact us", href: "/contact" },
            { label: "Submit ticket", href: "#ticket" },
          ],
        },
      ])
    }
  }

  const handleSend = (text?: string) => {
    const trimmed = (text ?? input).trim()
    if (!trimmed || typing) return
    setMessages((prev) => [...prev, { id: uid(), role: "user", text: trimmed }])
    setInput("")
    setTyping(true)
    const topic = landingMode ? findLandingFaqAnswer(trimmed) : findSupportAnswer(trimmed)
    setTimeout(() => addBotReply(topic, trimmed), 480)
  }

  const handleTopicClick = (topic: SupportTopic | LandingFaqTopic) => {
    if (typing) return
    setMessages((prev) => [...prev, { id: uid(), role: "user", text: topic.label }])
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "bot", text: topic.answer, links: topic.links },
      ])
    }, 400)
  }

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticketSubject.trim() || !ticketMessage.trim()) return
    setTicketSending(true)
    try {
      const res = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: ticketSubject.trim(),
          message: ticketMessage.trim(),
          category: "general",
          source: "chatbot",
          name: customer?.contactPerson || customer?.companyName || "Portal User",
          email: customer?.email || ticketEmail.trim(),
        }),
      })
      if (!res.ok) throw new Error("Failed")
      setTicketSent(true)
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "bot",
          text: "Ticket submitted. We'll reply within 1 business day.",
        },
      ])
      setShowTicketForm(false)
      setTicketSubject("")
      setTicketMessage("")
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "bot",
          text: "Couldn't submit right now. Email support@buffindia.com or call +91-9512120366.",
        },
      ])
    } finally {
      setTicketSending(false)
    }
  }

  if (pathname?.startsWith("/admin")) return null

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "flex h-[min(88vh,640px)] w-[min(calc(100%-2rem),400px)] flex-col overflow-hidden",
              "rounded-[24px] border border-[#DCE8DC] bg-[#F7F6F2] shadow-[0_24px_60px_rgba(15,40,20,0.22)]",
            )}
            role="dialog"
            aria-label="BuffIndia help chat"
          >
            <div className="relative overflow-hidden bg-[#1B7339] px-4 py-3.5 text-white">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-30"
                style={{
                  background:
                    "radial-gradient(circle at 20% 0%, #C8F000 0%, transparent 45%), radial-gradient(circle at 100% 100%, #EF6C00 0%, transparent 40%)",
                }}
              />
              <div className="relative flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
                    <Leaf className="h-5 w-5 text-[#C8F000]" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold tracking-tight">BuffIndia Help</p>
                    <p className="flex items-center gap-1 text-[11px] text-white/75">
                      <Sparkles className="h-3 w-3 text-[#C8F000]" />
                      Instant answers · tickets welcome
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                      msg.role === "bot"
                        ? "bg-[#E8F5E9] text-[#1B7339]"
                        : "bg-[#FFF3E0] text-[#EF6C00]",
                    )}
                  >
                    {msg.role === "bot" ? <Leaf className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                  </div>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed",
                      msg.role === "user"
                        ? "rounded-br-md bg-[#1B7339] text-white"
                        : "rounded-bl-md border border-[#E2EBE4] bg-white text-[#1A1A1A] shadow-sm",
                    )}
                  >
                    <p>{msg.text}</p>
                    {msg.links && msg.links.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {msg.links.map((link) =>
                          link.href === "#ticket" ? (
                            <button
                              key={link.label}
                              type="button"
                              className="inline-flex items-center gap-1 rounded-full border border-[#C8E6D4] bg-[#E8F5E9] px-2 py-1 text-[11px] font-medium text-[#1B7339]"
                              onClick={() => {
                                setShowTicketForm(true)
                                setTicketSent(false)
                              }}
                            >
                              {link.label}
                            </button>
                          ) : (
                            <Link
                              key={link.href}
                              href={link.href}
                              className="inline-flex items-center gap-1 rounded-full border border-[#E5E5E5] bg-[#F7F7F7] px-2 py-1 text-[11px] font-medium text-[#1B7339] hover:bg-[#E8F5E9]"
                              onClick={() => setOpen(false)}
                            >
                              {link.label}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {typing && (
                <div className="flex items-center gap-2 pl-9">
                  <div className="flex gap-1 rounded-2xl border border-[#E2EBE4] bg-white px-3 py-2">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1B7339]/50 [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1B7339]/50 [animation-delay:120ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1B7339]/50 [animation-delay:240ms]" />
                  </div>
                </div>
              )}

              {messages.length <= 2 && !showTicketForm && !typing && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(landingMode ? LANDING_FAQ_TOPICS : SUPPORT_TOPICS)
                    .slice(0, 6)
                    .map((topic) => (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => handleTopicClick(topic)}
                        className="rounded-full border border-[#DCE8DC] bg-white px-2.5 py-1.5 text-[11.5px] text-[#2A2A2A] transition-colors hover:border-[#1B7339]/40 hover:bg-[#E8F5E9]"
                      >
                        {topic.icon} {topic.label}
                      </button>
                    ))}
                </div>
              )}

              {showTicketForm && !ticketSent && !landingMode && (
                <form
                  onSubmit={handleSubmitTicket}
                  className="space-y-3 rounded-2xl border border-[#DCE8DC] bg-white p-3"
                >
                  <p className="text-xs font-semibold text-[#1B7339]">Submit a support ticket</p>
                  <div className="space-y-1.5">
                    <Label htmlFor="chat-ticket-subject" className="text-xs">
                      Subject
                    </Label>
                    <Input
                      id="chat-ticket-subject"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="Brief summary"
                      className="h-8 text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="chat-ticket-msg" className="text-xs">
                      Message
                    </Label>
                    <Textarea
                      id="chat-ticket-msg"
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      placeholder="Describe your issue..."
                      rows={3}
                      className="resize-none text-sm"
                      required
                    />
                  </div>
                  {!customer?.email && (
                    <div className="space-y-1.5">
                      <Label htmlFor="chat-ticket-email" className="text-xs">
                        Email
                      </Label>
                      <Input
                        id="chat-ticket-email"
                        type="email"
                        value={ticketEmail}
                        onChange={(e) => setTicketEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="h-8 text-sm"
                        required
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={ticketSending} className="flex-1 bg-[#1B7339]">
                      {ticketSending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send ticket"}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowTicketForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {!showTicketForm && (
              <div className="flex gap-1 overflow-x-auto px-3 pb-2 scrollbar-none">
                {(landingMode ? LANDING_QUICK_PROMPTS : QUICK_PROMPTS).slice(0, 4).map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    className="shrink-0 whitespace-nowrap rounded-full bg-[#E8F5E9] px-2 py-1 text-[11px] text-[#1B7339] hover:bg-[#D4EDD8]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-2 border-t border-[#E2EBE4] bg-white/70 p-3">
              {!showTicketForm && (
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Ask anything..."
                    className="h-10 rounded-full border-[#C8E6D4] bg-white text-sm focus-visible:ring-[#1B7339]"
                  />
                  <Button
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-full bg-[#1B7339] hover:bg-[#145a2c]"
                    onClick={() => handleSend()}
                    disabled={!input.trim() || typing}
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="flex items-center justify-between text-[11px] text-[#7A7A7A]">
                {!landingMode ? (
                  <button
                    type="button"
                    className="hover:text-[#1B7339]"
                    onClick={() => {
                      setShowTicketForm(true)
                      setTicketSent(false)
                    }}
                  >
                    Submit ticket
                  </button>
                ) : (
                  <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="hover:text-[#1B7339]">
                    WhatsApp us
                  </a>
                )}
                <Link
                  href={landingMode ? "/contact" : "/dashboard/support"}
                  className="hover:text-[#1B7339]"
                  onClick={() => setOpen(false)}
                >
                  {landingMode ? "Contact →" : "Support center →"}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close help chat" : "Open help chat"}
        aria-expanded={open}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        className={cn(
          "relative flex h-14 w-14 items-center justify-center rounded-full bg-[#1B7339] text-white shadow-[0_12px_28px_rgba(27,115,57,0.4)]",
          open && "ring-2 ring-[#C8F000]/50",
        )}
      >
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full bg-[#C8F000]/25"
          animate={{ scale: [1, 1.35, 1], opacity: [0.45, 0, 0.45] }}
          transition={{ duration: 2.4, repeat: Infinity }}
        />
        {open ? <X className="relative h-6 w-6" /> : <MessageCircle className="relative h-6 w-6" />}
      </motion.button>

      {!open && (
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="pointer-events-none absolute bottom-[4.25rem] right-0 hidden sm:block"
        >
          <div className="rounded-full border border-[#DCE8DC] bg-white px-3 py-1.5 text-xs font-medium text-[#1A1A1A] shadow-md">
            Need help?
          </div>
        </motion.div>
      )}
    </div>
  )
}
