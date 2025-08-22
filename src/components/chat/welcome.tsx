"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export function WelcomeForm() {
  const [value, setValue] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const router = useRouter();

  async function handleSend() {
    const text = value.trim();
    if (!text || pending) return;
    setPending(true);

    const chatId = crypto.randomUUID();
    // Store the initial message in sessionStorage for the chat page to pick up
    sessionStorage.setItem(
      `chat-${chatId}`,
      JSON.stringify([
        {
          id: "1",
          role: "assistant",
          content: "Hello! I'm AI, your assistant. How can I help you today?",
        },
        { id: "2", role: "user", content: text },
      ])
    );

    router.push(`/chat/${chatId}`);
    setPending(false);
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 mb-8">
        {[
          {
            icon: "✨",
            text: "Creative writing",
            prompt: "Help me write a creative story",
          },
          {
            icon: "💡",
            text: "Problem solving",
            prompt: "Help me solve a complex problem",
          },
          { icon: "📚", text: "Learning", prompt: "Explain a concept to me" },
          {
            icon: "🔧",
            text: "Coding help",
            prompt: "Help me with programming",
          },
        ].map((suggestion, i) => (
          <button
            key={i}
            onClick={() => setValue(suggestion.prompt)}
            className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-purple-200 transition-colors text-left"
          >
            <div className="text-lg mb-1">{suggestion.icon}</div>
            <div className="text-sm font-medium text-slate-700">
              {suggestion.text}
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type your message here…"
          rows={3}
          className="flex-1 resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-300"
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || pending}
          className="self-end rounded-xl bg-purple-600 px-4 py-3 text-sm font-medium text-white shadow hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </button>
      </div>
    </>
  );
}
