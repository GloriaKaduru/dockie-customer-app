"use client";

import { Archive, ArrowLeft, MessageSquarePlus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ChatScreen } from "@/components/chat/chat-screen";
import { SetDockieContext } from "@/components/dockie/dockie-provider";
import type { DockieContext } from "@/components/dockie/engine";
import { useConversation } from "@/components/dockie/use-conversation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { chats as seedChats } from "@/lib/data";
import type { ChatSummary } from "@/lib/types";

/** Chats: the persistent conversational workspace (PRD §5). */
export function ChatsView({ activeId }: { activeId?: string }) {
  const router = useRouter();
  const [chats, setChats] = useState(seedChats);
  const [deleting, setDeleting] = useState<ChatSummary | null>(null);
  const active = chats.find((c) => c.id === activeId);

  const [renaming, setRenaming] = useState<{ chat: ChatSummary; title: string } | null>(null);
  const rename = (c: ChatSummary) => setRenaming({ chat: c, title: c.title });
  const archive = (c: ChatSummary) => {
    setChats((l) => l.filter((x) => x.id !== c.id));
    toast("Chat archived", { action: { label: "Undo", onClick: () => setChats((l) => [c, ...l]) } });
    if (c.id === activeId) router.push("/chats");
  };

  return (
    <div className="-mx-4 -my-6 flex h-[calc(100svh-3.5rem)] sm:-mx-6 lg:-mx-8">
      <SetDockieContext context={{ kind: "chats" }} />
      {/* Chat list: modelled on Reddit's chat list — a title and a one-line snippet per row */}
      <aside className={cn("flex w-full flex-col border-r md:w-72 lg:w-80", activeId !== undefined && "hidden md:flex")}>
        <div className="flex h-14 shrink-0 items-center justify-between px-4">
          <h1 className="text-lg font-semibold">Chats</h1>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" asChild>
                <Link href="/chats/new" aria-label="New chat">
                  <MessageSquarePlus />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>New chat</TooltipContent>
          </Tooltip>
        </div>
        <nav className="flex-1 overflow-y-auto" aria-label="Chats">
          {chats.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">No chats yet.</p>}
          {chats.map((c) => (
            <div key={c.id} className={cn("group relative", c.id === activeId ? "bg-muted" : "hover:bg-muted/50")}>
              <Link href={`/chats/${c.id}`} aria-current={c.id === activeId ? "page" : undefined} className="block px-4 py-2.5 pr-10">
                <span className={cn("block truncate text-sm", c.unread && "font-semibold")}>{c.title}</span>
                <span className={cn("mt-0.5 block truncate text-sm text-muted-foreground", c.unread && "text-foreground")}>{c.lastMessage}</span>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-xs" className="absolute top-1/2 right-2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100" aria-label={`Options for ${c.title}`}>
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => rename(c)}>
                    <Pencil /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => archive(c)}>
                    <Archive /> Archive
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(c)}>
                    <Trash2 /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </nav>
      </aside>

      {/* Conversation */}
      <section className={cn("min-w-0 flex-1 flex-col", activeId === undefined ? "hidden md:flex" : "flex")}>
        {activeId === undefined ? (
          <ChatPane key="none" chat={undefined} />
        ) : (
          <>
            <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
              <Button variant="ghost" size="icon-sm" className="md:hidden" asChild>
                <Link href="/chats" aria-label="Back to chats">
                  <ArrowLeft />
                </Link>
              </Button>
              <p className="truncate text-sm font-medium">{active?.title ?? "New chat"}</p>
              {active?.object && (
                <Badge variant="secondary" asChild className="ml-1 font-normal">
                  <Link href={`/shipments/${active.object.id}`}>{active.object.label}</Link>
                </Badge>
              )}
            </header>
            <ChatPane key={activeId} chat={active} />
          </>
        )}
      </section>

      <Dialog open={!!renaming} onOpenChange={(o) => !o && setRenaming(null)}>
        <DialogContent className="sm:max-w-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (renaming?.title.trim()) setChats((l) => l.map((x) => (x.id === renaming.chat.id ? { ...x, title: renaming.title.trim() } : x)));
              setRenaming(null);
            }}
            className="space-y-4"
          >
            <DialogHeader>
              <DialogTitle>Rename chat</DialogTitle>
            </DialogHeader>
            <Input autoFocus value={renaming?.title ?? ""} onChange={(e) => setRenaming((r) => r && { ...r, title: e.target.value })} aria-label="Chat name" />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRenaming(null)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleting?.title}” will be permanently deleted. Shipments and documents it mentions are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setChats((l) => l.filter((x) => x.id !== deleting?.id));
                if (deleting?.id === activeId) router.push("/chats");
                setDeleting(null);
              }}
            >
              Delete chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** One conversation. Seeded chats replay their first question so the thread isn't empty. */
function ChatPane({ chat }: { chat?: ChatSummary }) {
  const context: DockieContext = chat?.object ? { kind: "shipment", id: chat.object.id, label: chat.object.label } : { kind: "chats" };
  // Long enough to watch the thinking orb move through its stages.
  const conversation = useConversation(context, [], { thinkMs: () => 1800 + Math.random() * 1000 });
  const replayed = useRef(false);

  useEffect(() => {
    if (chat && !replayed.current) {
      replayed.current = true;
      conversation.send(chat.seed);
    }
  }, [chat, conversation]);

  return <ChatScreen conversation={conversation} context={context} />;
}
