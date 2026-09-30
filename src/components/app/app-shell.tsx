"use client";

import { Sparkles } from "lucide-react";
import { DockiePanel } from "@/components/dockie/dockie-panel";
import { DockieProvider, useDockie } from "@/components/dockie/dockie-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { roles } from "@/lib/permissions";
import { AppSidebar } from "./app-sidebar";
import { GlobalSearch } from "./global-search";
import { Notifications } from "./notifications";
import { UserMenu } from "./user-menu";
import { useWorkspace, WorkspaceProvider } from "./workspace-provider";

/**
 * Global application shell (PRD §0):
 * sidebar · header (search, bell, user) · page · Dockie panel.
 * Opening Dockie reflows the page instead of floating over it.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <DockieProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="flex-row">
            <div className="flex min-w-0 flex-1 flex-col">
              <Header />
              <div className="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</div>
            </div>
            <DockiePanel />
          </SidebarInset>
        </SidebarProvider>
      </DockieProvider>
    </WorkspaceProvider>
  );
}

function Header() {
  const { mode, setMode } = useDockie();
  const { role } = useWorkspace();
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/90 px-3 backdrop-blur sm:px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-4" />
      <GlobalSearch />
      <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
        {role !== "admin" && (
          <Badge variant="outline" className="mr-1 hidden md:inline-flex">
            Viewing as {roles[role].label}
          </Badge>
        )}
        <Button variant={mode === "closed" ? "outline" : "secondary"} size="sm" onClick={() => setMode(mode === "closed" ? "open" : "closed")} aria-pressed={mode !== "closed"}>
          <Sparkles /> <span className="hidden sm:inline">Ask Dockie</span>
        </Button>
        <Notifications />
        <UserMenu />
      </div>
    </header>
  );
}
