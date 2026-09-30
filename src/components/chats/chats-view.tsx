"use client";

import { Archive, ArrowLeft, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ConversationView } from "@/components/dockie/conversation-view";
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
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { chats as seedChats } from "@/lib/data";
import { dayLabel, formatTime } from "@/lib/format";
import type { ChatSummary } from "@/lib/types";

/** Chats: the persistent conversational workspace (PRD §5). */
export function ChatsView({ activeId }: { activeId?: string }) {
  const router = useRouter();
  const [chats, setChats] = useState(seedChats);
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<ChatSummary | null>(null);
  const active = chats.find((c) => c.id === activeId);

  const visible = chats.filter((c) => !query || `${c.title} ${c.object?.label ?? ""} ${c.lastMessage}`.toLowerCase().includes(query.toLowerCase()));
  const groups = new Map<string, ChatSummary[]>();
  for (const c of visible) groups.set(dayLabel(c.updatedAt), [...(groups.get(dayLabel(c.updatedAt)) ?? []), c]);

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
      {/* Chat list */}
      <aside className={cn("flex w-full flex-col border-r md:w-72 lg:w-80", activeId !== undefined && "hidden md:flex")}>
        <div className="space-y-3 border-b p-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Chats</h1>
            <Button size="sm" asChild>
              <Link href="/chats/new">
                <Plus /> New chat
              </Link>
            </Button>
          </div>
          <InputGroup>
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput placeholder="Search chats" value={query} onChange={(e) => setQuery(e.target.value)} />
          </InputGroup>
        </div>
        <nav className="flex-1 overflow-y-auto p-2" aria-label="Chats">
          {visible.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">No chats match.</p>}
          {[...groups].map(([day, list]) => (
            <div key={day} className="mb-3">
              <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">{day}</p>
              {list.map((c) => (
                <div key={c.id} className={cn("group relative rounded-lg", c.id === activeId ? "bg-muted" : "hover:bg-muted/60")}>
                  <Link href={`/chats/${c.id}`} className="block px-2.5 py-2 pr-9">
                    <span className="flex items-center gap-2">
                      {c.unread && <span className="size-2 shrink-0 rounded-full bg-info" aria-label="Unread" />}
                      <span className={cn("truncate text-sm", c.unread && "font-semibold")}>{c.title}</span>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">{formatTime(c.updatedAt)}</span>
                    </span>
                    {c.object && (
                      <Badge variant="outline" className="mt-1 max-w-full font-normal">
                        <span className="truncate">{c.object.label}</span>
                      </Badge>
                    )}
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">{c.lastMessage}</span>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-xs" className="absolute top-2 right-1.5 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100" aria-label={`Options for ${c.title}`}>
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
            <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
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
  const conversation = useConversation(context);
  const replayed = useRef(false);

  useEffect(() => {
    if (chat && !replayed.current) {
      replayed.current = true;
      conversation.send(chat.seed);
    }
  }, [chat, conversation]);

  return <ConversationView conversation={conversation} context={context} size="page" />;
}
