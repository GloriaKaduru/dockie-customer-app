"use client";

import { ArrowRight, MapPin, Search, Ship } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/states";
import { useWorkspace } from "@/components/app/workspace-provider";
import { SetDockieContext } from "@/components/dockie/dockie-provider";
import { ETADisplay } from "@/components/domain/eta-display";
import { LocationDisplay } from "@/components/domain/location-display";
import { StatusBadge } from "@/components/domain/status-badge";
import { Timeline } from "@/components/domain/timeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { formatDateTime, timeAgo, vehicleName } from "@/lib/format";
import { journey, shipmentStatus } from "@/lib/status";
import type { Shipment } from "@/lib/types";

/** Tracking: "Where are my vehicles and what has happened to them?" (PRD §6) */
export function TrackingView({ selectedId }: { selectedId?: string }) {
  const { shipments } = useWorkspace();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [query, setQuery] = useState("");
  const active = shipments.filter((s) => s.status !== "delivered");
  const list = active.filter((s) => !query || [s.id, s.vehicle.vin, s.vehicle.make, s.vehicle.model].some((f) => f.toLowerCase().includes(query.toLowerCase())));
  const selected = shipments.find((s) => s.id === selectedId) ?? (isMobile ? undefined : list[0]);

  const counts = [
    { label: "In transit", n: active.filter((s) => shipmentStatus[s.status].group === "in_transit").length, href: "/shipments?group=in_transit" },
    { label: "At port", n: active.filter((s) => shipmentStatus[s.status].group === "at_port").length, href: "/shipments?group=at_port" },
    { label: "Issues", n: active.filter((s) => shipmentStatus[s.status].group === "issues").length, href: "/shipments?group=issues" },
  ];

  const select = (id: string) => router.replace(`/tracking?id=${id}`, { scroll: false });

  return (
    <>
      <SetDockieContext context={{ kind: "tracking" }} />
      <PageHeader title="Tracking" description="Last known location, ETA and events for every active vehicle.">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex gap-2">
            {counts.map((c) => (
              <Link key={c.label} href={c.href} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted">
                <span className={cn("font-semibold tabular-nums", c.label === "Issues" && c.n > 0 && "text-destructive")}>{c.n}</span> <span className="text-muted-foreground">{c.label}</span>
              </Link>
            ))}
          </div>
          <InputGroup className="sm:ml-auto sm:max-w-xs">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput placeholder="Search vehicle / booking" value={query} onChange={(e) => setQuery(e.target.value)} />
          </InputGroup>
        </div>
      </PageHeader>

      {list.length === 0 ? (
        <EmptyState icon={MapPin} title="Nothing to track" description={query ? "No active vehicles match your search." : "Vehicles appear here once a shipment is booked."} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
          <ul className="space-y-2">
            {list.map((s) => (
              <li key={s.id}>
                <TrackingCard s={s} selected={selected?.id === s.id} onSelect={() => select(s.id)} />
              </li>
            ))}
          </ul>
          {!isMobile && selected && <TrackingDetail s={selected} />}
        </div>
      )}

      {isMobile && (
        <Sheet open={!!selectedId} onOpenChange={(o) => !o && router.replace("/tracking", { scroll: false })}>
          <SheetContent side="bottom" className="max-h-[90svh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{selected && vehicleName(selected.vehicle)}</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-6">{selected && <TrackingDetail s={selected} />}</div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}

/** Tracking card (PRD §6.2) */
function TrackingCard({ s, selected, onSelect }: { s: Shipment; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      aria-pressed={selected}
      className={cn("w-full rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/40", selected && "border-primary ring-1 ring-primary")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{vehicleName(s.vehicle)}</p>
          <p className="text-xs text-muted-foreground">{s.id}</p>
        </div>
        <StatusBadge status={s.status} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
        <div className="col-span-2 min-w-0">
          <p className="text-xs text-muted-foreground">Last known location</p>
          <p className="truncate font-medium">{s.location.label}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">ETA</p>
          <ETADisplay eta={s.eta} />
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Last update {timeAgo(s.location.updatedAt)}</p>
    </button>
  );
}

function TrackingDetail({ s }: { s: Shipment }) {
  return (
    <div className="space-y-4">
      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {vehicleName(s.vehicle)} <span className="font-normal text-muted-foreground">· {s.id}</span>
            </span>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/shipments/${s.id}?tab=tracking`}>
                View shipment <ArrowRight />
              </Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RouteMap s={s} />
          <div className="grid gap-4 sm:grid-cols-2">
            <LocationDisplay location={s.location} size="lg" />
            <ETADisplay eta={s.eta} size="lg" />
          </div>
        </CardContent>
      </Card>

      {s.vessel && (
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ship className="size-4" /> {s.vessel.name} · {s.vessel.voyage}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <KV k="Origin port" v={s.vessel.originPort} />
            <KV k="Destination port" v={s.vessel.destinationPort} />
            <KV k="Departure" v={formatDateTime(s.vessel.departure)} />
            <KV k="Expected arrival" v={formatDateTime(s.vessel.arrival)} />
          </CardContent>
        </Card>
      )}

      <Card size="sm">
        <CardHeader>
          <CardTitle>Event history</CardTitle>
        </CardHeader>
        <CardContent>
          <Timeline events={s.events} />
        </CardContent>
      </Card>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{k}</p>
      <p className="font-medium">{v}</p>
    </div>
  );
}

/**
 * Lightweight route schematic. A map helps but is never the only representation (PRD §6.4):
 * the text location, timestamp and events above/below always render, even if a real map fails.
 */
function RouteMap({ s }: { s: Shipment }) {
  const { steps, current, done } = journey(s.type, s.status);
  const p = done ? 1 : Math.max(0.04, current / (steps.length - 1));
  const x = 24 + p * 352;
  const y = 70 - Math.sin(p * Math.PI) * 44;
  return (
    <div className="relative overflow-hidden rounded-lg border bg-muted/40" role="img" aria-label={`Route from ${s.origin} to ${s.destination}, currently at ${s.location.label}`}>
      <svg viewBox="0 0 400 96" className="h-28 w-full" preserveAspectRatio="xMidYMid meet">
        <path d="M24 70 Q200 -18 376 70" fill="none" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 5" />
        <path d="M24 70 Q200 -18 376 70" fill="none" stroke="var(--primary)" strokeWidth="2.5" pathLength={1} strokeDasharray={`${p} 1`} />
        <circle cx="24" cy="70" r="4" fill="var(--primary)" />
        <circle cx="376" cy="70" r="4" fill="var(--background)" stroke="var(--primary)" strokeWidth="2" />
        <circle cx={x} cy={y} r="7" fill="var(--primary)" opacity="0.15" />
        <circle cx={x} cy={y} r="4" fill={s.status === "issue_reported" ? "var(--destructive)" : "var(--primary)"} />
      </svg>
      <div className="absolute inset-x-3 bottom-2 flex justify-between text-[11px] text-muted-foreground">
        <span>{s.origin}</span>
        <span>{s.destination}</span>
      </div>
    </div>
  );
}
