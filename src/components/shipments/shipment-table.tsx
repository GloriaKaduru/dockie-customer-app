"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ETADisplay } from "@/components/domain/eta-display";
import { StatusBadge } from "@/components/domain/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { timeAgo, vehicleName } from "@/lib/format";
import type { Shipment } from "@/lib/types";

export type Column = "vehicle" | "vin" | "booking" | "status" | "origin" | "destination" | "location" | "eta" | "updated";

const headers: Record<Column, string> = {
  vehicle: "Vehicle",
  vin: "VIN",
  booking: "Booking #",
  status: "Status",
  origin: "Origin",
  destination: "Destination",
  location: "Current location",
  eta: "ETA",
  updated: "Last updated",
};

/**
 * Shipments as a table on desktop and stacked cards on mobile.
 * Mobile order follows PRD §16: status, vehicle, location, ETA.
 */
export function ShipmentTable({ shipments, columns, dense }: { shipments: Shipment[]; columns: Column[]; dense?: boolean }) {
  const router = useRouter();

  const cell = (s: Shipment, c: Column) => {
    switch (c) {
      case "vehicle":
        return (
          <Link href={`/shipments/${s.id}`} className="font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
            {vehicleName(s.vehicle)}
          </Link>
        );
      case "vin":
        return <span className="font-mono text-xs text-muted-foreground">{s.vehicle.vin}</span>;
      case "booking":
        return <span className="tabular-nums">{s.id}</span>;
      case "status":
        return <StatusBadge status={s.status} />;
      case "origin":
        return s.origin;
      case "destination":
        return s.destination;
      case "location":
        return (
          <span className={cn(!s.location.available && "text-muted-foreground")}>
            {s.location.label}
            {!s.location.available && <span className="block text-xs">Last known</span>}
          </span>
        );
      case "eta":
        return <ETADisplay eta={s.eta} />;
      case "updated":
        return <span className="text-muted-foreground">{timeAgo(s.lastUpdated)}</span>;
    }
  };

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c} className={cn("first:pl-4", c === "updated" && "text-right")}>
                  {headers[c]}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.map((s) => (
              <TableRow key={s.id} className="cursor-pointer" onClick={() => router.push(`/shipments/${s.id}`)}>
                {columns.map((c) => (
                  <TableCell key={c} className={cn("first:pl-4", dense ? "py-2" : "py-3", c === "updated" && "text-right", c !== "vehicle" && c !== "location" && "whitespace-nowrap")}>
                    {cell(s, c)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y md:hidden">
        {shipments.map((s) => (
          <li key={s.id}>
            <Link href={`/shipments/${s.id}`} className="flex items-start gap-3 px-4 py-3 active:bg-muted">
              <div className="min-w-0 flex-1 space-y-1">
                <StatusBadge status={s.status} />
                <p className="font-medium">{vehicleName(s.vehicle)}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {s.id} · {s.location.label}
                </p>
              </div>
              <div className="text-right text-sm">
                <ETADisplay eta={s.eta} />
              </div>
              <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
