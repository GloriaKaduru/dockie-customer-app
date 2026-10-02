"use client";

import { FileText, LifeBuoy, MapPin } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { dayLabel, formatDate, timeAgo, vehicleName } from "@/lib/format";
import type { Shipment } from "@/lib/types";
import { city, countdown, EtaText } from "./shipment-signals";
import { Pill, PillLink, RouteMap, StatusTag } from "./uber";

export type SortKey = "updated" | "eta" | "booked" | "vehicle";
export type Sort = { key: SortKey; dir: "asc" | "desc" };

/**
 * Shipments as Uber trip cards: a map thumbnail with the route and an ETA chip on the left,
 * the vehicle, when, status and route on the right, and grey pill actions underneath.
 * Rows are grouped under bold date headings, like Uber's "Past · Nov 21".
 */
export function ShipmentList({ shipments, sort, delivered }: { shipments: Shipment[]; sort: Sort; delivered?: boolean }) {
  const groups = groupRows(shipments, sort, delivered);

  return (
    <div className="space-y-8">
      {groups.map(({ title, rows }) => (
        <section key={title} aria-label={title}>
          {title && <h3 className="mb-3 heading-xs">{title}</h3>}
          <ul className="space-y-3">
            {rows.map((s) => (
              <li key={s.id}>
                <ShipmentCard shipment={s} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** Group by a date heading when the list is ordered by a date; otherwise one untitled group. */
function groupRows(rows: Shipment[], sort: Sort, delivered?: boolean) {
  if (sort.key === "vehicle") return [{ title: "", rows }];
  const keyOf = (s: Shipment) => {
    const iso = sort.key === "eta" ? s.eta.date : sort.key === "booked" ? s.bookedAt : s.lastUpdated;
    if (!iso) return delivered ? "Date unknown" : "Waiting for pickup";
    if (sort.key === "updated") return dayLabel(iso);
    return formatDate(iso, { month: "long", year: "numeric" });
  };
  const map = new Map<string, Shipment[]>();
  for (const s of rows) map.set(keyOf(s), [...(map.get(keyOf(s)) ?? []), s]);
  return [...map].map(([title, list]) => ({ title, rows: list }));
}

function etaBadge(s: Shipment) {
  const c = countdown(s);
  if (c.kind === "number") return s.status === "delivered" ? `${c.unit} ${c.value}` : `${c.value} ${c.unit}`;
  return c.label;
}

export function ShipmentCard({ shipment: s }: { shipment: Shipment }) {
  const href = `/shipments/${s.id}`;
  const issue = s.status === "issue_reported";
  return (
    <article className="group relative flex gap-4 rounded-xl border bg-card p-2 transition-colors hover:border-foreground/30 sm:gap-5 sm:p-3">
      <div className="relative w-28 shrink-0 overflow-hidden rounded-lg sm:w-52 lg:w-60">
        <RouteMap shipment={s} className="absolute inset-0" />
        <span className={cn("absolute top-2 left-2 px-2 py-1 label-xs tabular-nums", issue ? "bg-destructive text-white" : "bg-foreground text-background")}>{etaBadge(s)}</span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col py-1 pr-1">
        <div className="flex items-start justify-between gap-3">
          <h4 className="min-w-0 truncate label-l max-sm:label-m">
            {/* Stretched link: the whole card opens the shipment; pills stay clickable above it. */}
            <Link href={href} className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-ring">
              {vehicleName(s.vehicle)}
            </Link>
          </h4>
          <StatusTag shipment={s} className="max-sm:hidden" />
        </div>
        <p className="mt-1 paragraph-s text-muted-foreground tabular-nums">
          {!s.eta.date ? "ETA after pickup" : <>{s.status === "delivered" ? "Delivered " : "ETA "}<EtaText shipment={s} /></>} <span aria-hidden>·</span> {s.id}
        </p>
        <p className="mt-0.5 truncate paragraph-s" title={`${s.origin} to ${s.destination}`}>
          {city(s.origin)} <span className="text-muted-foreground">→</span> {city(s.destination)}
        </p>
        <StatusTag shipment={s} className="mt-2 self-start sm:hidden" />

        <div className="relative z-10 mt-auto flex flex-wrap items-center gap-2 pt-3 max-sm:hidden">
          <PillLink size="sm" href={`${href}?tab=tracking`}>
            <MapPin /> Track
          </PillLink>
          <PillLink size="sm" href={`${href}?tab=documents`}>
            <FileText /> Documents
          </PillLink>
          <Pill size="sm" onClick={() => toast.success("Support request sent", { description: `Operations will reply about ${s.id} within an hour.` })}>
            <LifeBuoy /> Help
          </Pill>
          <span className="ml-auto label-xs text-muted-foreground tabular-nums">Updated {timeAgo(s.lastUpdated)}</span>
        </div>
      </div>
    </article>
  );
}
