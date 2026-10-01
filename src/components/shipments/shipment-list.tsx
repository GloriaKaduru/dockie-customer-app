"use client";

import { ArrowDown, ArrowUp, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { timeAgo, vehicleName } from "@/lib/format";
import type { Shipment } from "@/lib/types";
import { CountdownCell, EtaText, RouteStack, RouteText, StatusLine } from "./shipment-signals";

export type SortKey = "updated" | "eta" | "booked" | "vehicle";
export type Sort = { key: SortKey; dir: "asc" | "desc" };

/**
 * Shipments as a calm, data-rich table on wide screens and as stacked rows on phones.
 * Both share the same anatomy: countdown, vehicle, status, route, ETA.
 */
export function ShipmentList({ shipments, sort, onSort, delivered }: { shipments: Shipment[]; sort: Sort; onSort: (k: SortKey) => void; delivered?: boolean }) {
  const router = useRouter();
  const open = (id: string) => router.push(`/shipments/${id}`);

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border lg:block">
        <Table>
          <TableHeader className="bg-muted/40 [&_th]:h-10 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-20 pl-4 text-center">
                <SortHeader label={delivered ? "Date" : "Arrives"} k="eta" sort={sort} onSort={onSort} />
              </TableHead>
              <TableHead>
                <SortHeader label="Vehicle" k="vehicle" sort={sort} onSort={onSort} />
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>{delivered ? "Delivered" : "ETA"}</TableHead>
              <TableHead className="pr-4 text-right">
                <SortHeader label="Updated" k="updated" sort={sort} onSort={onSort} align="right" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.map((s) => (
              <TableRow key={s.id} className="cursor-pointer" onClick={() => open(s.id)}>
                <TableCell className="py-4 pl-4">
                  <CountdownCell shipment={s} className="mx-auto" />
                </TableCell>
                <TableCell className="py-4">
                  <Link href={`/shipments/${s.id}`} onClick={(e) => e.stopPropagation()} className="font-medium hover:underline">
                    {vehicleName(s.vehicle)}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                    {s.id} <span aria-hidden>·</span> <span className="font-mono">{s.vehicle.vin}</span>
                  </p>
                </TableCell>
                <TableCell className="py-4">
                  <StatusLine shipment={s} />
                  <p className={cn("mt-1 max-w-56 truncate text-xs text-muted-foreground")} title={s.location.label}>
                    {s.location.available ? s.location.label : `Last known: ${s.location.label}`}
                  </p>
                </TableCell>
                <TableCell className="py-4">
                  <RouteStack shipment={s} />
                </TableCell>
                <TableCell className="py-4">
                  <EtaText shipment={s} stacked />
                </TableCell>
                <TableCell className="py-4 pr-4 text-right text-sm text-muted-foreground tabular-nums">{timeAgo(s.lastUpdated)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="-mx-4 border-y sm:-mx-6 lg:hidden">
        {shipments.map((s) => (
          <li key={s.id} className="border-b last:border-b-0">
            <Link href={`/shipments/${s.id}`} className="flex items-stretch gap-1 py-4 pr-4 pl-1 active:bg-muted sm:pr-6 sm:pl-3">
              <CountdownCell shipment={s} className="w-16" />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-baseline justify-between gap-3 text-xs text-muted-foreground tabular-nums">
                  <span className="truncate">
                    {s.id} <span aria-hidden>·</span> {timeAgo(s.lastUpdated)}
                  </span>
                  {s.status === "delivered" ? <EtaText shipment={s} /> : <span className="shrink-0">ETA <EtaText shipment={s} /></span>}
                </div>
                <p className="truncate font-semibold">{vehicleName(s.vehicle)}</p>
                <StatusLine shipment={s} />
                <RouteText shipment={s} className="block text-sm font-medium" />
              </div>
              <ChevronRight className="mt-6 size-4 shrink-0 self-start text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

function SortHeader({ label, k, sort, onSort, align }: { label: string; k: SortKey; sort: Sort; onSort: (k: SortKey) => void; align?: "right" }) {
  const active = sort.key === k;
  const Icon = sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onSort(k)}
      aria-label={`Sort by ${label}`}
      className={cn("inline-flex items-center gap-1 hover:text-foreground", active && "text-foreground", align === "right" && "flex-row-reverse")}
    >
      {label}
      <Icon className={cn("size-3", !active && "opacity-0")} aria-hidden />
    </button>
  );
}
