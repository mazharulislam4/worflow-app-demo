"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export function WelcomeForm() {
  const [value, setValue] = useState("");
  const [row, setRow] = useState(1);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const maxRows = 6;

  const clamp = (n: number, min = 1, max = maxRows) =>
    Math.max(min, Math.min(max, n));
  const calcRowsFromText = (text: string) => clamp(text.split("\n").length);

  async function handleSend() {
    const text = value.trim();
    if (!text || pending) return;
    setPending(true);

    const chatId = crypto.randomUUID();
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

  const infraSuggestions = [
    {
      icon: "🚀",
      text: "CI/CD Pipeline",
      prompt:
        "Design a GitHub Actions CI/CD pipeline with build, test, preview, and production deploy stages.",
    },
    {
      icon: "🐳",
      text: "Docker & Compose",
      prompt:
        "Create production-ready Dockerfiles and a docker-compose.yml for app, DB, and reverse proxy.",
    },
    {
      icon: "☸️",
      text: "Kubernetes Deploy",
      prompt:
        "Generate Kubernetes manifests or a Helm chart with ingress, HPA, readiness/liveness probes.",
    },
    {
      icon: "🧱",
      text: "Infrastructure as Code",
      prompt:
        "Write Terraform to provision VPC, subnets, load balancer, managed DB, and object storage.",
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-3 mb-8">
        {infraSuggestions.map((suggestion, i) => (
          <button
            key={i}
            onClick={() => {
              setValue(suggestion.prompt);
              setRow(calcRowsFromText(suggestion.prompt));
            }}
            className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-purple-200 transition-colors text-left"
          >
            <div className="text-lg mb-1">{suggestion.icon}</div>
            <div className="text-sm font-medium text-slate-700">
              {suggestion.text}
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-2 rounded-xl border-2 bg-white border-border p-1">
        <textarea
          value={value}
          onChange={(e) => {
            const next = e.target.value;
            setValue(next);
            setRow(calcRowsFromText(next));
          }}
          onKeyDown={(e) => {
            // Grow with Shift+Enter (newline will be inserted naturally)
            if (e.shiftKey && e.key === "Enter") {
              setRow((r) => clamp(r + 1));
              return; // don't preventDefault to keep the newline
            }
            // Send with Cmd/Ctrl+Enter
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type your message here…"
          rows={row}
          className="flex-1 resize-none px-2 py-3 text-sm outline-none"
        />
        {value.length > 0 && (
          <button
            onClick={handleSend}
            disabled={!value.trim() || pending}
            className="action-button-contained"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </button>
        )}
      </div>
    </>
  );
}
