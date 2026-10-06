"use client";

import { FileText, MessagesSquare, Package, Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDockie } from "@/components/dockie/dockie-provider";
import { Button } from "@/components/ui/button";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { chats } from "@/lib/data";
import { vehicleName } from "@/lib/format";
import { mainNav } from "@/lib/nav";
import { useWorkspace } from "./workspace-provider";

/** Global search (PRD §11): ⌘K, results grouped by entity, plus "Ask Dockie" with the typed text. */
export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { shipments, documents } = useWorkspace();
  const { ask } = useDockie();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="h-8 min-w-0 flex-1 shrink justify-start gap-2 bg-muted/40 px-2.5 font-normal text-muted-foreground shadow-none sm:w-64 sm:flex-initial lg:w-80">
        <Search />
        <span className="hidden truncate sm:inline">Search shipments, VINs, documents…</span>
        <span className="sm:hidden">Search</span>
        <KbdGroup className="ml-auto hidden sm:inline-flex">
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Search" description="Search shipments, VINs, documents and chats">
        <CommandInput placeholder="Search shipments, VINs, documents…" value={query} onValueChange={setQuery} />
        <CommandList>
          <CommandEmpty>No matches. Try a booking number like DK-10482 or the last 6 of a VIN.</CommandEmpty>
          {query.trim() && (
            <CommandGroup heading="Dockie">
              <CommandItem
                value={`ask ${query}`}
                onSelect={() => {
                  setOpen(false);
                  ask(query);
                }}
              >
                <Sparkles />
                Ask Dockie: “{query}”
              </CommandItem>
            </CommandGroup>
          )}
          <CommandGroup heading="Shipments">
            {shipments.map((s) => (
              <CommandItem key={s.id} value={`${s.id} ${s.vehicle.vin} ${vehicleName(s.vehicle)} ${s.vehicle.make} ${s.vehicle.model}`} onSelect={() => go(`/shipments/${s.id}`)}>
                <Package />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate">{vehicleName(s.vehicle)}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.id} · VIN {s.vehicle.vin}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Documents">
            {documents.slice(0, 8).map((d) => (
              <CommandItem key={d.id} value={`${d.type} ${d.shipmentId} ${d.fileName ?? ""}`} onSelect={() => go(`/documents?doc=${d.id}`)}>
                <FileText />
                {d.type} — {d.shipmentId}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Chats">
            {chats.map((c) => (
              <CommandItem key={c.id} value={`${c.title} ${c.object?.label ?? ""}`} onSelect={() => go(`/chats/${c.id}`)}>
                <MessagesSquare />
                {c.title}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Go to">
            {mainNav.map(({ href, label, icon: Icon }) => (
              <CommandItem key={href} value={`go ${label}`} onSelect={() => go(href)}>
                <Icon />
                {label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
