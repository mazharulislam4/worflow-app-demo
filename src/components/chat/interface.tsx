"use client";

import * as React from "react";

interface ChatInterfaceProps {
  chatId: string;
}

export function ChatInterface({ chatId }: ChatInterfaceProps) {
  const [messages, setMessages] = React.useState([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm AI, your assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const viewportRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const storedMessages = sessionStorage.getItem(`chat-${chatId}`);
    if (storedMessages) {
      const parsed = JSON.parse(storedMessages);
      setMessages(parsed);
      // Simulate AI response to the initial user message
      if (parsed.length > 1 && parsed[parsed.length - 1].role === "user") {
        setIsLoading(true);
        setTimeout(() => {
          const aiResponse = {
            id: Date.now().toString(),
            role: "assistant",
            content:
              "This is a demo response. Your Django backend will handle real AI responses later.",
          };
          setMessages((prev) => [...prev, aiResponse]);
          setIsLoading(false);
        }, 1500);
      }
    }
  }, [chatId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Mock AI response after delay
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "This is a demo response. Your Django backend will handle real AI responses later.",
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  React.useEffect(() => {
    const el = viewportRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isLoading]);

  return (
    <>
      <div
        ref={viewportRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`${
                m.role === "user"
                  ? "bg-purple-600 text-white"
                  : "bg-slate-100 text-slate-800"
              } rounded-2xl px-4 py-2 max-w-[70%] text-sm whitespace-pre-wrap`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-2xl px-4 py-2 text-sm text-slate-500">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 p-3">
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-3xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Type a message…"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-400/50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="rounded-xl bg-purple-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-purple-700 disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </button>
        </form>
      </div>
    </>
  );
}
