import type React from "react"
import { ChatSidebar } from "@/components/chat/sidebar"

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto p-4">
      <div className="flex h-[calc(100vh-6rem)] gap-3">
        <ChatSidebar />
        <main className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white/80 backdrop-blur shadow-sm">
          {children}
        </main>
      </div>
    </div>
  )
}
