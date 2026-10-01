"use client";

import { Anchor, Ship, Truck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { shipmentStatus, type StatusGroup } from "@/lib/status";
import type { Shipment } from "@/lib/types";

export type SummaryGroup = Extract<StatusGroup, "in_transit" | "at_port" | "awaiting_pickup">;

const cards: { key: SummaryGroup; label: string; icon: LucideIcon; tile: string; context: (list: Shipment[]) => string }[] = [
  {
    key: "in_transit",
    label: "In transit",
    icon: Ship,
    tile: "bg-primary/10 text-primary",
    context: (list) => {
      const next = list.map((s) => s.eta.date).filter(Boolean).sort()[0];
      return next ? `Next arrival ${formatDate(next)}` : "Nothing on the move";
    },
  },
  {
    key: "at_port",
    label: "At port",
    icon: Anchor,
    tile: "bg-info/12 text-info",
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
    icon: Truck,
    tile: "bg-success/12 text-success",
    context: (list) => {
      const enroute = list.filter((s) => s.status === "enroute_to_pickup").length;
      return enroute ? `${enroute} transporter${enroute === 1 ? "" : "s"} on the way` : "Waiting on a transporter";
    },
  },
];

/**
 * The landing strip: three global counts of active shipments.
 * Counts never change with table filters; selecting a card filters the list below it.
 */
export function ShipmentSummary({ shipments, selected, onSelect }: { shipments: Shipment[]; selected: SummaryGroup | null; onSelect: (g: SummaryGroup | null) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3" role="group" aria-label="Active shipments by stage">
      {cards.map(({ key, label, icon: Icon, tile, context }) => {
        const list = shipments.filter((s) => shipmentStatus[s.status].group === key);
        const active = selected === key;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(active ? null : key)}
            className={cn(
              "group flex min-w-0 flex-col items-start rounded-xl border bg-card p-3 text-left transition-colors sm:p-4",
              "hover:border-foreground/20 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
              active && "border-primary/60 bg-primary/[0.03] ring-1 ring-primary/30 hover:border-primary/60",
            )}
          >
            <span className="flex w-full items-start justify-between gap-2">
              <span className="pt-0.5 text-[11px] leading-tight font-medium tracking-wider text-muted-foreground uppercase sm:text-xs">{label}</span>
              <span className={cn("hidden size-7 shrink-0 place-items-center rounded-lg sm:grid", tile)}>
                <Icon className="size-4" aria-hidden />
              </span>
            </span>
            <span className="mt-auto pt-3 text-[28px] leading-none font-semibold tracking-tight tabular-nums sm:text-[32px]">{list.length}</span>
            <span className="mt-2 hidden w-full truncate text-sm text-muted-foreground sm:block">{context(list)}</span>
          </button>
        );
      })}
    </div>
  );
}
