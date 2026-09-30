"use client";

import { Maximize2, Minimize2, MessageSquarePlus, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { ConversationView } from "./conversation-view";
import { useDockie } from "./dockie-provider";
import type { DockieContext } from "./engine";

const contextLabel: Record<DockieContext["kind"], string> = {
  home: "Workspace",
  shipments: "All shipments",
  shipment: "Shipment",
  tracking: "Tracking",
  documents: "Documents",
  payments: "Payments",
  analytics: "Analytics",
  chats: "Chats",
};

/**
 * The contextual Dockie panel (PRD §4).
 * Desktop: a column beside the page, so content reflows instead of being covered.
 * Mobile/tablet: full-screen conversation.
 */
export function DockiePanel() {
  const { mode, setMode, context, conversation } = useDockie();
  const isMobile = useIsMobile();
  if (mode === "closed") return null;

  const expanded = mode === "expanded";
  const close = () => setMode("closed");

  return (
    <aside
      aria-label="Dockie"
      className={cn(
        "flex flex-col border-l bg-background",
        // mobile/tablet: full screen overlay
        "fixed inset-0 z-50 lg:sticky lg:top-0 lg:z-auto lg:h-svh lg:shrink-0",
        expanded ? "lg:w-[min(46vw,720px)]" : "lg:w-[380px] xl:w-[420px]",
      )}
    >
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
        <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
          <Sparkles className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-sm font-semibold">Dockie</p>
          {/* Context header (PRD §4.2) */}
          <p className="truncate text-xs text-muted-foreground">
            {context.kind === "shipment" ? (
              <>
                Shipment: <span className="text-foreground">{context.label}</span>
              </>
            ) : (
              contextLabel[context.kind]
            )}
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={conversation.reset} aria-label="New conversation">
              <MessageSquarePlus />
            </Button>
          </TooltipTrigger>
          <TooltipContent>New conversation</TooltipContent>
        </Tooltip>
        {!isMobile && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="hidden lg:inline-flex" onClick={() => setMode(expanded ? "open" : "expanded")} aria-label={expanded ? "Shrink panel" : "Expand panel"}>
                {expanded ? <Minimize2 /> : <Maximize2 />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{expanded ? "Shrink" : "Expand"}</TooltipContent>
          </Tooltip>
        )}
        <Button variant="ghost" size="icon-sm" onClick={close} aria-label="Close Dockie">
          <X />
        </Button>
      </header>
      {context.kind === "shipment" && conversation.messages.length === 0 && (
        <div className="border-b px-4 py-2">
          <Badge variant="secondary" className="font-normal">
            Dockie can see this shipment&apos;s tracking, documents and payments
          </Badge>
        </div>
      )}
      <ConversationView conversation={conversation} context={context} onNavigate={isMobile ? close : undefined} />
    </aside>
  );
}
