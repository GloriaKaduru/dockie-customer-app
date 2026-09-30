"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AgentActionCard } from "./agent-action-card";
import { Composer } from "./composer";
import { mockTranscript, promptsFor, type DockieContext } from "./engine";
import { MessagePart } from "./message-parts";
import type { Conversation } from "./use-conversation";

/** Messages + composer. Used inside the Dockie panel and on the Chats page. */
export function ConversationView({
  conversation,
  context,
  onNavigate,
  size = "panel",
}: {
  conversation: Conversation;
  context: DockieContext;
  onNavigate?: () => void;
  size?: "panel" | "page";
}) {
  const { messages, thinking, send, confirmAction, cancelAction } = conversation;
  const end = useRef<HTMLDivElement>(null);
  const { heading, prompts } = promptsFor(context);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, thinking]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={cn("min-h-0 flex-1 overflow-y-auto", size === "page" ? "px-4 py-6 sm:px-8" : "p-4")}>
        <div className={cn("space-y-5", size === "page" && "mx-auto max-w-2xl")}>
          {messages.length === 0 && (
            // Initial state: contextual prompts, not "How can I help?" (PRD §4.3)
            <div className={cn(size === "page" && "pt-10 text-center")}>
              <span className={cn("grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground", size === "page" && "mx-auto")}>
                <Sparkles className="size-4" />
              </span>
              <p className={cn("mt-3 font-medium", size === "page" && "text-lg")}>{heading}</p>
              <div className={cn("mt-4 flex flex-wrap gap-2", size === "page" && "justify-center")}>
                {prompts.map((p) => (
                  <Button key={p} variant="outline" size="sm" onClick={() => send(p)}>
                    {p}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={m.id} className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground">
                {m.parts[0].kind === "text" && m.parts[0].text}
              </div>
            ) : (
              <div key={m.id} className="flex gap-2.5">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
                  <Sparkles className="size-3" />
                </span>
                <div className="min-w-0 flex-1 space-y-3">
                  {m.parts.map((p, j) =>
                    p.kind === "action" ? (
                      <AgentActionCard key={j} action={p.action} state={p.state} error={p.error} onConfirm={() => confirmAction(m.id)} onCancel={() => cancelAction(m.id)} />
                    ) : (
                      <MessagePart
                        key={j}
                        part={p}
                        h={{ send, onConfirm: () => confirmAction(m.id), onCancel: () => cancelAction(m.id), onNavigate, interactive: i === messages.length - 1 }}
                      />
                    ),
                  )}
                </div>
              </div>
            ),
          )}
          {thinking && (
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <span className="grid size-6 place-items-center rounded-md bg-primary text-primary-foreground">
                <Sparkles className="size-3 animate-pulse" />
              </span>
              Dockie is thinking…
            </div>
          )}
          <div ref={end} />
        </div>
      </div>
      <div className={cn("border-t bg-background", size === "page" ? "px-4 py-3 sm:px-8" : "p-3")}>
        <Composer onSend={send} transcript={() => mockTranscript(context)} className={cn(size === "page" && "mx-auto max-w-2xl")} />
        <p className="mt-2 text-center text-[11px] text-muted-foreground">Dockie can make mistakes. Changes always ask for your confirmation.</p>
      </div>
    </div>
  );
}
