"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import {
  findSupportAnswer,
  QUICK_PROMPTS,
  SUPPORT_CONTACT,
  SUPPORT_TOPICS,
  type SupportTopic,
} from "@/lib/support-knowledge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  ChevronDown,
  ExternalLink,
  Loader2,
} from "lucide-react"

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

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "bot",
  text: "Hi! I'm the Buffindia Help Assistant. Choose a topic below or type your question — I can help with login, credits, orders, reports, and more.",
}

export function HelpChatbot() {
  const pathname = usePathname()
  const { customer } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [input, setInput] = useState("")
  const [showTicketForm, setShowTicketForm] = useState(false)
  const [ticketSubject, setTicketSubject] = useState("")
  const [ticketMessage, setTicketMessage] = useState("")
  const [ticketEmail, setTicketEmail] = useState("")
  const [ticketSending, setTicketSending] = useState(false)
  const [ticketSent, setTicketSent] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
    })
  }, [])

  useEffect(() => {
    if (open) scrollToBottom()
  }, [messages, open, showTicketForm, scrollToBottom])

  useEffect(() => {
    if (open && !showTicketForm) inputRef.current?.focus()
  }, [open, showTicketForm])

  const addBotReply = (topic: SupportTopic | null, userText: string) => {
    if (topic) {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "bot",
          text: topic.answer,
          topic,
          links: topic.links,
        },
      ])
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "bot",
          text: `I couldn't find an exact match for "${userText}". Try one of the quick topics, visit our Support Center, or submit a ticket and our team will reply within 1 business day.`,
          links: [
            { label: "Support Center", href: "/support" },
            { label: "Contact us", href: "/contact" },
          ],
        },
      ])
    }
  }

  const handleSend = (text?: string) => {
    const trimmed = (text ?? input).trim()
    if (!trimmed) return

    setMessages((prev) => [...prev, { id: uid(), role: "user", text: trimmed }])
    setInput("")

    const topic = findSupportAnswer(trimmed)
    setTimeout(() => addBotReply(topic, trimmed), 400)
  }

  const handleTopicClick = (topic: SupportTopic) => {
    setMessages((prev) => [...prev, { id: uid(), role: "user", text: topic.label }])
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "bot",
          text: topic.answer,
          topic,
          links: topic.links,
        },
      ])
    }, 300)
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
          text: "Your support ticket has been submitted. We'll email you at the address on file (or the one you provided) within 1 business day.",
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
          text: "Couldn't submit the ticket right now. Please email us at support@buffindia.com or call +91-9512120366.",
        },
      ])
    } finally {
      setTicketSending(false)
    }
  }

  if (pathname?.startsWith("/admin")) return null

  return (
    <>
      {/* Floating launcher */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col items-end gap-3">
        {open && (
          <div
            className={cn(
              "w-[min(100vw-2rem,380px)] h-[min(85vh,560px)] flex flex-col",
              "rounded-2xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl shadow-black/10",
              "animate-in slide-in-from-bottom-4 fade-in duration-300",
            )}
            role="dialog"
            aria-label="Help chat"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border/50 bg-primary/5 rounded-t-2xl">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">Buffindia Help</p>
                  <p className="text-xs text-muted-foreground">Usually replies instantly</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8 rounded-full"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      msg.role === "bot" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {msg.role === "bot" ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  </div>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted/80 text-foreground rounded-bl-md",
                    )}
                  >
                    <p>{msg.text}</p>
                    {msg.links && msg.links.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {msg.links.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                              "inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                              msg.role === "user"
                                ? "bg-primary-foreground/20 hover:bg-primary-foreground/30"
                                : "bg-background hover:bg-background/80 text-primary border border-border/50",
                            )}
                            onClick={() => setOpen(false)}
                          >
                            {link.label}
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Topic chips (show after welcome if few messages) */}
              {messages.length <= 2 && !showTicketForm && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {SUPPORT_TOPICS.slice(0, 6).map((topic) => (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => handleTopicClick(topic)}
                      className="text-xs px-2.5 py-1.5 rounded-full border border-border/60 bg-background hover:bg-muted/60 transition-colors"
                    >
                      {topic.icon} {topic.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Ticket form */}
              {showTicketForm && !ticketSent && (
                <form onSubmit={handleSubmitTicket} className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-3">
                  <p className="text-xs font-medium text-foreground">Submit a support ticket</p>
                  <div className="space-y-1.5">
                    <Label htmlFor="chat-ticket-subject" className="text-xs">
                      Subject
                    </Label>
                    <Input
                      id="chat-ticket-subject"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="Brief summary"
                      className="h-8 text-sm bg-background"
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
                      className="text-sm bg-background resize-none"
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
                        className="h-8 text-sm bg-background"
                        required
                      />
                    </div>
                  )}
                  {!customer?.email && (
                    <p className="text-xs text-muted-foreground">
                      Sign in so we can reply to your registered email automatically.
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={ticketSending} className="flex-1">
                      {ticketSending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send ticket"}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowTicketForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Quick prompts */}
            {!showTicketForm && (
              <div className="px-3 pb-2 flex gap-1 overflow-x-auto scrollbar-none">
                {QUICK_PROMPTS.slice(0, 4).map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    className="shrink-0 text-[11px] px-2 py-1 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input area */}
            <div className="p-3 border-t border-border/50 space-y-2">
              {!showTicketForm && (
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type your question..."
                    className="h-9 text-sm rounded-full bg-muted/40 border-border/50"
                  />
                  <Button
                    size="icon"
                    className="h-9 w-9 rounded-full shrink-0"
                    onClick={() => handleSend()}
                    disabled={!input.trim()}
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <button
                  type="button"
                  className="hover:text-primary transition-colors"
                  onClick={() => {
                    setShowTicketForm(true)
                    setTicketSent(false)
                  }}
                >
                  Submit ticket
                </button>
                <Link href="/support" className="hover:text-primary transition-colors flex items-center gap-0.5" onClick={() => setOpen(false)}>
                  Support center
                  <ChevronDown className="w-3 h-3 -rotate-90" />
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="relative">
          <Button
            size="lg"
            className={cn(
              "h-14 w-14 rounded-full shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300",
              open && "scale-90 opacity-0 pointer-events-none absolute",
            )}
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close help chat" : "Open help chat"}
            aria-expanded={open}
          >
            {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
          </Button>

          {!open && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 pointer-events-none">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-40" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-primary text-[10px] text-primary-foreground items-center justify-center font-bold">
                ?
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Mini hint when closed */}
      {!open && (
        <div className="fixed bottom-[4.5rem] right-5 z-[99] pointer-events-none hidden sm:block">
          <div className="rounded-lg bg-background border border-border/60 shadow-md px-3 py-1.5 text-xs text-muted-foreground animate-in fade-in slide-in-from-right-2 duration-500 delay-1000">
            Need help?
          </div>
        </div>
      )}
    </>
  )
}
