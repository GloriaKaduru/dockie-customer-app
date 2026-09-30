"use client";

import { Maximize2, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Chat } from "./chat";

/** Slide-in AI panel, available from the top bar on every page. */
export function AssistantPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-ink/20 lg:hidden" onClick={onClose} />}
      <aside
        aria-hidden={!open}
        inert={!open}
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-line bg-canvas shadow-2xl transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface px-4">
          <Sparkles className="size-4 text-brand" />
          <span className="text-sm font-semibold">Dockie AI</span>
          <div className="ml-auto flex gap-1">
            <Link href="/assistant" onClick={onClose} className="rounded-md p-1.5 text-muted hover:bg-subtle" aria-label="Open full page">
              <Maximize2 className="size-4" />
            </Link>
            <button onClick={onClose} className="rounded-md p-1.5 text-muted hover:bg-subtle" aria-label="Close">
              <X className="size-4" />
            </button>
          </div>
        </div>
        <Chat compact />
      </aside>
    </>
  );
}
