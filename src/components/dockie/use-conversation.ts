"use client";

import { useCallback, useRef, useState } from "react";
import { useWorkspace } from "@/components/app/workspace-provider";
import { respond, type DockieContext, type Flow, type Message, type Part } from "./engine";

let counter = 0;
const uid = () => `m${++counter}-${Date.now()}`;

/**
 * Conversation state machine: messages, the agent's pending flow, and action execution
 * (confirm → running → success/failed). Used by both the Dockie panel and the Chats page.
 */
export function useConversation(context: DockieContext, initial: Message[] = [], { thinkMs = () => 650 }: { thinkMs?: () => number } = {}) {
  const ws = useWorkspace();
  const [messages, setMessages] = useState<Message[]>(initial);
  const [thinking, setThinking] = useState(false);
  const flow = useRef<Flow>(null);

  const env = { shipments: [...ws.shipments], documents: ws.documents, payments: ws.payments, role: ws.role };

  /** Send a message. `display` is what the user bubble shows when `input` is a command. */
  const send = useCallback(
    (input: string, display?: string) => {
      const t = input.trim();
      if (!t) return;
      if (t === "prompts") return; // "Ask another question" just refocuses the composer
      setMessages((m) => [...m, { id: uid(), role: "user", parts: [{ kind: "text", text: display ?? t }], at: Date.now() }]);
      setThinking(true);
      const delay = thinkMs();
      setTimeout(() => {
        const res = respond(t, context, env, flow.current);
        flow.current = res.flow;
        setMessages((m) => [...m, { id: uid(), role: "dockie", parts: res.parts, at: Date.now(), thoughtMs: delay }]);
        setThinking(false);
      }, delay);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [context, ws.shipments, ws.documents, ws.payments, ws.role],
  );

  const patchAction = (msgId: string, patch: Partial<Extract<Part, { kind: "action" }>>) =>
    setMessages((list) =>
      list.map((m) => (m.id === msgId ? { ...m, parts: m.parts.map((p) => (p.kind === "action" ? { ...p, ...patch } : p)) } : m)),
    );

  /** Execute a confirmed action. Never runs without the user pressing Confirm (PRD §4.6). */
  const confirmAction = useCallback(
    (msgId: string) => {
      const msg = messages.find((m) => m.id === msgId);
      const part = msg?.parts.find((p) => p.kind === "action");
      if (!part || part.kind !== "action") return;
      const { action } = part;
      patchAction(msgId, { state: "running", error: undefined });

      setTimeout(() => {
        if (action.type === "create_shipment") {
          ws.createDraftShipment(action.targetId);
          flow.current = null;
          patchAction(msgId, { state: "success" });
          return;
        }
        const target = ws.getShipment(action.targetId);
        if (target?.locked) {
          // ACTION_FAILED — the shipment is locked by operations
          patchAction(msgId, { state: "failed", error: "The shipment is currently locked by operations." });
          return;
        }
        if (action.type === "change_destination") ws.updateShipment(action.targetId, { destination: action.to }, `changed destination to ${action.to} with Dockie`);
        if (action.type === "update_pickup") ws.updateShipment(action.targetId, { origin: action.to }, `changed pickup to ${action.to} with Dockie`);
        patchAction(msgId, { state: "success" });
      }, 1100);
    },
    [messages, ws],
  );

  const cancelAction = useCallback((msgId: string) => {
    patchAction(msgId, { state: "cancelled" });
    flow.current = null;
  }, []);

  const reset = useCallback(() => {
    setMessages([]);
    flow.current = null;
  }, []);

  return { messages, thinking, send, confirmAction, cancelAction, reset };
}

export type Conversation = ReturnType<typeof useConversation>;
