"use client";

import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { shipmentStatus, type StatusGroup } from "@/lib/status";
import type { Shipment } from "@/lib/types";

export type SummaryGroup = Extract<StatusGroup, "in_transit" | "at_port" | "awaiting_pickup">;

const cards: { key: SummaryGroup; label: string; context: (list: Shipment[]) => string }[] = [
  {
    key: "in_transit",
    label: "In transit",
    context: (list) => {
      const next = list.map((s) => s.eta.date).filter(Boolean).sort()[0];
      return next ? `Next arrival ${formatDate(next)}` : "Nothing on the move";
    },
  },
  {
    key: "at_port",
    label: "At port",
    context: (list) => {
      const ready = list.filter((s) => s.status === "ready_for_collection").length;
      const customs = list.filter((s) => s.status === "clearing_customs").length;
      if (ready) return `${ready} ready for collection`;
      if (customs) return `${customs} clearing customs`;
      return "Waiting to load";
    },
  },
  {
    key: "awaiting_pickup",
    label: "Awaiting pickup",
    context: (list) => {
      const enroute = list.filter((s) => s.status === "enroute_to_pickup").length;
      return enroute ? `${enroute} transporter${enroute === 1 ? "" : "s"} on the way` : "Waiting on a transporter";
    },
  },
];

/**
 * The landing strip: three global counts of active shipments, as Uber-style grey tiles.
 * Selecting one inverts it to black (Uber's selected state) and filters the list below.
 * Counts never change with list filters.
 */
export function ShipmentSummary({ shipments, selected, onSelect }: { shipments: Shipment[]; selected: SummaryGroup | null; onSelect: (g: SummaryGroup | null) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3" role="group" aria-label="Active shipments by stage">
      {cards.map(({ key, label, context }) => {
        const list = shipments.filter((s) => shipmentStatus[s.status].group === key);
        const active = selected === key;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(active ? null : key)}
            className={cn(
              "flex min-w-0 flex-col items-start rounded-xl p-3 text-left transition-colors sm:p-5",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
              active ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-secondary",
            )}
          >
            <span className="label-s max-sm:label-xs">{label}</span>
            <span className="mt-auto pt-4 heading-l tabular-nums max-sm:heading-s">{list.length}</span>
            <span className={cn("mt-1 hidden w-full truncate paragraph-s sm:block", active ? "text-primary-foreground/70" : "text-muted-foreground")}>{context(list)}</span>
          </button>
        );
      })}
    </div>
  );
}
