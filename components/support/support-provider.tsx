"use client"

import { HelpChatbot } from "@/components/support/help-chatbot"

export function SupportProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <HelpChatbot />
    </>
  )
}
