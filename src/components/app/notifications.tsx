"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";
import { useWorkspace } from "./workspace-provider";

const dot = { info: "bg-info", warning: "bg-warning", critical: "bg-destructive", success: "bg-success" };

/** Actionable notifications (PRD §12). Each item opens its context. */
export function Notifications() {
  const { notifications, markAllRead, markRead } = useWorkspace();
  const unread = notifications.filter((n) => n.unread).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
          <Bell />
          {unread > 0 && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive ring-2 ring-background" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,380px)] p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={markAllRead}>
              Mark all as read
            </Button>
          )}
        </div>
        <Separator />
        <ul className="max-h-96 overflow-y-auto py-1">
          {notifications.map((n) => (
            <li key={n.id}>
              <Link href={n.href} onClick={() => markRead(n.id)} className="flex gap-3 px-4 py-2.5 hover:bg-muted">
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.unread ? dot[n.tone] : "bg-transparent")} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-sm", n.unread && "font-medium")}>
                    {n.title}
                    {n.unread && <span className="sr-only"> (unread)</span>}
                  </span>
                  <span className="block text-sm text-muted-foreground">{n.body}</span>
                  <span className="text-xs text-muted-foreground">{timeAgo(n.at)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
