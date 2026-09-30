"use client";

import { createContext, use, useCallback, useEffect, useMemo, useState } from "react";
import type { DockieContext } from "./engine";
import { useConversation, type Conversation } from "./use-conversation";

/**
 * Dockie panel state (PRD §4.1): closed → open (shares the workspace) → expanded (takes more space).
 * Full-screen = the Chats page. Pages register their context with <SetDockieContext>.
 */
type PanelMode = "closed" | "open" | "expanded";

interface DockieState {
  mode: PanelMode;
  setMode: (m: PanelMode) => void;
  context: DockieContext;
  setContext: (c: DockieContext) => void;
  conversation: Conversation;
  /** Open the panel and immediately ask something. */
  ask: (text: string) => void;
  startNewShipment: () => void;
}

const Ctx = createContext<DockieState | null>(null);

export function DockieProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<PanelMode>("closed");
  const [context, setContextState] = useState<DockieContext>({ kind: "home" });
  const conversation = useConversation(context);

  const setContext = useCallback((c: DockieContext) => {
    setContextState((prev) => (JSON.stringify(prev) === JSON.stringify(c) ? prev : c));
  }, []);

  const ask = useCallback(
    (text: string) => {
      setMode((m) => (m === "closed" ? "open" : m));
      conversation.send(text);
    },
    [conversation],
  );

  const value = useMemo<DockieState>(
    () => ({ mode, setMode, context, setContext, conversation, ask, startNewShipment: () => ask("Start a shipment") }),
    [mode, context, setContext, conversation, ask],
  );

  return <Ctx value={value}>{children}</Ctx>;
}

export function useDockie() {
  const v = use(Ctx);
  if (!v) throw new Error("useDockie must be used inside <DockieProvider>");
  return v;
}

/** Drop into any page to tell Dockie what the user is looking at (PRD §20). */
export function SetDockieContext({ context }: { context: DockieContext }) {
  const { setContext } = useDockie();
  const key = JSON.stringify(context);
  useEffect(() => {
    setContext(JSON.parse(key));
  }, [key, setContext]);
  return null;
}
