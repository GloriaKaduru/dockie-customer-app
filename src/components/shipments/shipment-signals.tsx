import { AlertTriangle, CircleDashed, Clock, PackageCheck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { NOW, formatDate } from "@/lib/format";
import type { Shipment } from "@/lib/types";

// Small, reusable pieces of a shipment row. Colour is reserved for meaning:
// issues (red), needs a decision (amber), done (green). Everything else stays neutral.

const DAY = 86_400_000;
const utcDay = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
const daysBetween = (from: string | Date, to: string | Date) => Math.round((utcDay(new Date(to)) - utcDay(new Date(from))) / DAY);

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
