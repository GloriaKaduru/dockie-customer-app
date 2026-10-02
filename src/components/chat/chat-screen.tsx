"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AgentActionCard } from "@/components/dockie/agent-action-card";
import { mockTranscript, promptsFor, type DockieContext, type Message } from "@/components/dockie/engine";
import { MessagePart } from "@/components/dockie/message-parts";
import type { Conversation } from "@/components/dockie/use-conversation";
import { Button } from "@/components/ui/button";
import { AgentThinking } from "./agent-thinking";
import { ChatComposer } from "./chat-composer";

/**
 * Chat screen, modelled on Obvious: one centred reading column, quiet user bubbles,
 * un-boxed agent replies, and a raised composer pinned to the bottom.
 * The thinking orb appears only while Dockie is about to respond (see AgentThinking).
 */
export function ChatScreen({ conversation, context }: { conversation: Conversation; context: DockieContext }) {
  const { messages, thinking, send } = conversation;
  const end = useRef<HTMLDivElement>(null);
  const empty = messages.length === 0 && !thinking;

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, thinking]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-8">
        {empty ? (
          <EmptyState context={context} onPick={send} />
        ) : (
          <div className="mx-auto max-w-2xl space-y-8 pt-8 pb-10">
            {messages.map((m, i) =>
              m.role === "user" ? <UserMessage key={m.id} message={m} /> : <AgentMessage key={m.id} message={m} conversation={conversation} latest={i === messages.length - 1} />,
            )}
            {thinking && <AgentThinking />}
            <div ref={end} />
          </div>
        )}
      </div>

      {/* A soft wash behind the composer, like Obvious' warm footer glow. */}
      <div className="shrink-0 bg-gradient-to-t from-primary/[0.05] to-transparent px-4 pt-2 pb-4 sm:px-8">
        <ChatComposer onSend={send} transcript={() => mockTranscript(context)} disabled={thinking} className="mx-auto block max-w-2xl" />
        <p className="mt-2 text-center text-[11px] text-muted-foreground">Dockie can make mistakes. Changes always ask for your confirmation.</p>
      </div>
    </div>
  );
}

function EmptyState({ context, onPick }: { context: DockieContext; onPick: (text: string) => void }) {
  const { prompts } = promptsFor(context);
  const subject = context.kind === "shipment" ? context.label : "your shipments";

  return (
    <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center py-10 text-center">
      <h2 className="text-xl font-medium text-balance">Ready to work on {subject}?</h2>
      <p className="mt-2 text-sm text-pretty text-muted-foreground">Ask a question, share a document, or start a new shipment. I&apos;ll help you move forward.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {prompts.slice(0, 4).map((p) => (
          <Button key={p} variant="outline" size="sm" className="rounded-full font-normal" onClick={() => onPick(p)}>
            {p}
          </Button>
        ))}
      </div>
    </div>
  );
}

function UserMessage({ message }: { message: Message }) {
  const part = message.parts[0];
  return <div className="ml-auto w-fit max-w-[80%] rounded-2xl bg-muted px-4 py-2.5 text-[15px] leading-6 whitespace-pre-line">{part.kind === "text" && part.text}</div>;
}

function AgentMessage({ message, conversation, latest }: { message: Message; conversation: Conversation; latest: boolean }) {
  const { send, confirmAction, cancelAction } = conversation;
  const [showThought, setShowThought] = useState(false);
  const seconds = Math.max(1, Math.round((message.thoughtMs ?? 0) / 1000));

  return (
    <div className="space-y-3">
      {message.thoughtMs !== undefined && (
        <div>
          <button type="button" onClick={() => setShowThought((s) => !s)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" aria-expanded={showThought}>
            Thought for {seconds}s
            <ChevronDown className={`size-3 transition-transform ${showThought ? "rotate-180" : ""}`} />
          </button>
          {showThought && (
            <ol className="mt-2 space-y-1 border-l pl-3 text-xs text-muted-foreground">
              <li>Read the question</li>
              <li>Searched shipments, documents and payments in this workspace</li>
              <li>Drafted a reply{message.parts.some((p) => p.kind === "action") ? " and a change for you to confirm" : ""}</li>
            </ol>
          )}
        </div>
      )}
      {message.parts.map((p, j) =>
        p.kind === "action" ? (
          <AgentActionCard key={j} action={p.action} state={p.state} error={p.error} onConfirm={() => confirmAction(message.id)} onCancel={() => cancelAction(message.id)} />
        ) : (
          <MessagePart key={j} part={p} h={{ send, onConfirm: () => confirmAction(message.id), onCancel: () => cancelAction(message.id), interactive: latest }} />
        ),
      )}
    </div>
  );
}
