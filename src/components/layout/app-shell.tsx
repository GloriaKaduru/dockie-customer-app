"use client";

import { Bell, Menu, Search, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AssistantPanel } from "../assistant/assistant-panel";
import { Logo } from "./logo";
import { Sidebar } from "./sidebar";

/**
 * The frame around every signed-in page: sidebar on the left, top bar,
 * the page itself in the middle, and the Dockie AI panel that slides in from the right.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-line bg-surface lg:block">
        <Sidebar />
      </aside>

      {/* Mobile sidebar (drawer) */}
      {navOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/30" onClick={() => setNavOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-surface shadow-xl">
            <button
              onClick={() => setNavOpen(false)}
              className="absolute top-4 right-3 rounded-md p-1 text-muted hover:bg-subtle"
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
            <Sidebar onNavigate={() => setNavOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur sm:px-6">
          <button onClick={() => setNavOpen(true)} className="rounded-md p-1.5 text-muted hover:bg-subtle lg:hidden" aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <div className="lg:hidden">
            <Logo />
          </div>

          <label className="relative hidden max-w-md flex-1 sm:block">
            <span className="sr-only">Search</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <input
              placeholder="Search shipment ID, reference or city"
              className="h-9 w-full rounded-lg border border-line bg-subtle pr-3 pl-9 text-sm outline-none placeholder:text-muted focus:border-brand focus:bg-surface"
            />
          </label>

          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setAiOpen((v) => !v)}
              className={cn(
                "flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors",
                aiOpen ? "bg-brand text-white" : "bg-brand-soft text-brand hover:bg-brand hover:text-white",
              )}
            >
              <Sparkles className="size-4" />
              <span className="hidden sm:inline">Ask Dockie</span>
            </button>
            <button className="relative rounded-lg p-2 text-muted hover:bg-subtle hover:text-ink" aria-label="Notifications">
              <Bell className="size-5" />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-bad ring-2 ring-surface" />
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>

      <AssistantPanel open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}
