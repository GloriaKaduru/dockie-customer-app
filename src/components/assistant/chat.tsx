"use client";

import { ArrowUp, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { shipments } from "@/lib/mock-data";
import { cn, formatDate } from "@/lib/utils";
import { ShipmentStatusBadge } from "../ui/badge";

type Message =
  | { role: "user"; text: string }
  | { role: "ai"; text: string; shipmentIds?: string[] };

const suggestions = [
  "Which shipments are delayed?",
  "Where is DK-10482?",
  "What's arriving this week?",
  "Cheapest way to ship 500 kg Lagos → Accra",
];

// Fake answers until the real AI backend is connected.
// Replace `reply()` with a call to your API (e.g. POST /api/assistant).
function reply(question: string): Message {
  const q = question.toLowerCase();
  const idMatch = question.match(/DK-\d+/i);
  if (idMatch) {
    const s = shipments.find((x) => x.id.toLowerCase() === idMatch[0].toLowerCase());
    if (s) return { role: "ai", text: s.aiNote ?? `${s.id} is on schedule. ETA ${formatDate(s.eta)}.`, shipmentIds: [s.id] };
  }
  if (q.includes("delay") || q.includes("late")) {
    const ids = shipments.filter((s) => s.status === "delayed" || s.status === "customs").map((s) => s.id);
    return { role: "ai", text: `${ids.length} shipments need attention. One is delayed at port, one is waiting on a customs document.`, shipmentIds: ids };
  }
  if (q.includes("week") || q.includes("arriv")) {
    const ids = shipments.filter((s) => s.status !== "delivered").slice(0, 3).map((s) => s.id);
    return { role: "ai", text: "These shipments are due in the next 7 days:", shipmentIds: ids };
  }
  if (q.includes("cheap") || q.includes("quote") || q.includes("ship ")) {
    return { role: "ai", text: "Road Standard with Dockie Freight is the cheapest option at about $1,180 and 4–6 days. Open Get a quote to compare every option." };
  }
  return { role: "ai", text: "I can track shipments, flag delays, compare rates and explain invoices. Try one of the suggestions above." };
}

export function Chat({ compact = false }: { compact?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, thinking]);

  function send(text: string) {
    const t = text.trim();
    if (!t || thinking) return;
    setMessages((m) => [...m, { role: "user", text: t }]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      setMessages((m) => [...m, reply(t)]);
      setThinking(false);
    }, 700);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className={cn("flex flex-col", compact ? "pt-2" : "items-center pt-16 text-center")}>
            <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand">
              <Sparkles className="size-5" />
            </span>
            <h2 className={cn("mt-3 font-semibold", compact ? "text-base" : "text-xl")}>How can I help with your freight?</h2>
            <p className="mt-1 text-sm text-muted">Ask about any shipment, delay, quote or invoice.</p>
            <div className={cn("mt-5 flex flex-wrap gap-2", !compact && "justify-center")}>
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-line bg-surface px-3 py-1.5 text-left text-sm text-ink hover:border-brand hover:text-brand"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-brand px-3.5 py-2 text-sm text-white">
              {m.text}
            </div>
          ) : (
            <div key={i} className="max-w-[92%] space-y-2">
              <p className="text-sm leading-relaxed">{m.text}</p>
              {m.shipmentIds?.map((id) => {
                const s = shipments.find((x) => x.id === id)!;
                return (
                  <Link
                    key={id}
                    href={`/shipments/${id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-2 text-sm hover:border-brand"
                  >
                    <span className="min-w-0">
                      <span className="font-medium">{s.id}</span>
                      <span className="block truncate text-xs text-muted">
                        {s.origin.city} → {s.destination.city} · ETA {formatDate(s.eta)}
                      </span>
                    </span>
                    <ShipmentStatusBadge status={s.status} />
                  </Link>
                );
              })}
            </div>
          ),
        )}
        {thinking && <p className="animate-pulse text-sm text-muted">Dockie is thinking…</p>}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-line p-3"
      >
        <div className="flex items-end gap-2 rounded-xl border border-line bg-surface p-2 focus-within:border-brand">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder="Ask Dockie anything…"
            className="max-h-32 min-h-8 flex-1 resize-none bg-transparent px-1.5 py-1 text-sm outline-none placeholder:text-muted"
          />
          <button
            type="submit"
            disabled={!input.trim() || thinking}
            className="grid size-8 place-items-center rounded-lg bg-brand text-white disabled:opacity-40"
            aria-label="Send"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-muted">Dockie AI can make mistakes. Check important details.</p>
      </form>
    </div>
  );
}
