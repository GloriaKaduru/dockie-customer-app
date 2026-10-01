import { AlertTriangle, ArrowDownRight, ArrowUpRight, CircleDashed, Clock, PackageCheck, type LucideIcon } from "lucide-react";
import { toneIcon } from "@/components/domain/status-badge";
import { cn } from "@/lib/utils";
import { NOW, formatDate } from "@/lib/format";
import { shipmentStatus, type Tone } from "@/lib/status";
import type { Shipment } from "@/lib/types";

// Small, reusable pieces of a shipment row. Colour is reserved for meaning:
// issues (red), needs a decision (amber), done (green). Everything else stays neutral.

const DAY = 86_400_000;
const utcDay = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
const daysBetween = (from: string | Date, to: string | Date) => Math.round((utcDay(new Date(to)) - utcDay(new Date(from))) / DAY);

const toneText: Partial<Record<Tone, string>> = {
  critical: "text-destructive",
  warning: "text-warning",
  success: "text-success",
};

export const city = (place: string) => place.split(",")[0];

type Countdown = { kind: "number"; value: string | number; unit: string } | { kind: "label"; icon: LucideIcon; label: string; className?: string };

/** What the left column of a row shows: days to ETA, the delivery date, or a state word. */
export function countdown(s: Shipment): Countdown {
  if (s.status === "delivered" && s.eta.date) return { kind: "number", value: formatDate(s.eta.date, { day: "numeric" }), unit: formatDate(s.eta.date, { month: "short" }) };
  if (s.status === "issue_reported") return { kind: "label", icon: AlertTriangle, label: "Issue", className: "text-destructive" };
  if (s.status === "ready_for_collection") return { kind: "label", icon: PackageCheck, label: "Ready", className: "text-success" };
  if (s.eta.kind === "unknown" || !s.eta.date) return { kind: "label", icon: CircleDashed, label: "No ETA", className: "text-muted-foreground" };
  const days = daysBetween(NOW, s.eta.date);
  if (days <= 0) return { kind: "label", icon: Clock, label: days === 0 ? "Today" : "Due", className: "text-warning" };
  return { kind: "number", value: days, unit: days === 1 ? "day" : "days" };
}

/** Flighty-style countdown: a big number over a tiny uppercase unit, or an icon over a state word. */
export function CountdownCell({ shipment, className }: { shipment: Shipment; className?: string }) {
  const c = countdown(shipment);
  return (
    <div className={cn("flex w-14 shrink-0 flex-col items-center justify-center text-center", className)}>
      {c.kind === "number" ? (
        <>
          <span className="text-2xl leading-none font-semibold tracking-tight tabular-nums">{c.value}</span>
          <span className="mt-1 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">{c.unit}</span>
        </>
      ) : (
        <>
          <c.icon className={cn("size-5", c.className)} aria-hidden />
          <span className={cn("mt-1.5 text-[10px] font-medium tracking-wider uppercase", c.className)}>{c.label}</span>
        </>
      )}
    </div>
  );
}

/** Status as an icon and words. Neutral unless the status carries meaning. */
export function StatusLine({ shipment, className }: { shipment: Shipment; className?: string }) {
  const { label, tone } = shipmentStatus[shipment.status];
  const Icon = toneIcon[tone];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", toneText[tone] ?? "text-foreground", className)}>
      <Icon className={cn("size-3.5 shrink-0", !toneText[tone] && "text-muted-foreground")} aria-hidden />
      {label}
    </span>
  );
}

/** "Savannah to Accra", with the joining word quieter than the places. */
export function RouteText({ shipment, className }: { shipment: Shipment; className?: string }) {
  return (
    <span className={cn("min-w-0 truncate", className)} title={`${shipment.origin} to ${shipment.destination}`}>
      {city(shipment.origin)} <span className="font-normal text-muted-foreground">to</span> {city(shipment.destination)}
    </span>
  );
}

/** Origin and destination stacked with departure and arrival glyphs, for the web table. */
export function RouteStack({ shipment }: { shipment: Shipment }) {
  return (
    <div className="space-y-1 text-sm">
      <p className="flex items-center gap-1.5">
        <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" aria-label="From" />
        {shipment.origin}
      </p>
      <p className="flex items-center gap-1.5">
        <ArrowDownRight className="size-3.5 shrink-0 text-muted-foreground" aria-label="To" />
        {shipment.destination}
      </p>
    </div>
  );
}

/** ETA date plus one short note. Only the note that matters gets colour ("3d late", "Delivered"). */
export function EtaText({ shipment, stacked }: { shipment: Shipment; stacked?: boolean }) {
  const { eta } = shipment;
  let date: string | null = eta.date ? formatDate(eta.date) : null;
  let note: { text: string; className?: string } | null = null;

  if (eta.kind === "unknown" || !eta.date) {
    date = null;
    note = { text: "After pickup", className: "text-muted-foreground" };
  } else if (eta.kind === "delivered") {
    note = null; // the column or tab already says "Delivered"
  } else if (eta.kind === "delayed" && eta.previousDate) {
    note = { text: `${daysBetween(eta.previousDate, eta.date)}d late`, className: "text-destructive" };
  } else if (stacked) {
    note = { text: "Estimated", className: "text-muted-foreground" };
  }

  return (
    <span className={cn("text-sm tabular-nums", stacked ? "flex flex-col gap-1" : "inline-flex items-baseline gap-1.5")}>
      {date && <span className="font-medium text-foreground">{date}</span>}
      {note && <span className={cn(stacked && "text-xs", note.className)}>{note.text}</span>}
    </span>
  );
}
