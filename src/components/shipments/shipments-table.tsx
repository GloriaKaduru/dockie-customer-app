import Link from "next/link";
import type { Shipment } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/utils";
import { ShipmentStatusBadge } from "../ui/badge";
import { ModeIcon } from "../ui/mode-icon";

/** Table on desktop, stacked cards on phones. Each row links to the tracking page. */
export function ShipmentsTable({ shipments, showCost = true }: { shipments: Shipment[]; showCost?: boolean }) {
  return (
    <>
      <table className="hidden w-full text-sm md:table">
        <thead>
          <tr className="border-b border-line text-left text-xs text-muted">
            <th className="px-5 py-2.5 font-medium">Shipment</th>
            <th className="px-3 py-2.5 font-medium">Route</th>
            <th className="px-3 py-2.5 font-medium">Status</th>
            <th className="px-3 py-2.5 font-medium">ETA</th>
            {showCost && <th className="px-5 py-2.5 text-right font-medium">Cost</th>}
          </tr>
        </thead>
        <tbody>
          {shipments.map((s) => (
            <tr key={s.id} className="group relative border-b border-line last:border-0 hover:bg-subtle">
              <td className="px-5 py-3">
                {/* The link stretches over the whole row via the ::after pseudo-element */}
                <Link href={`/shipments/${s.id}`} className="font-medium after:absolute after:inset-0">
                  {s.id}
                </Link>
                <p className="text-xs text-muted">{s.reference}</p>
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <ModeIcon mode={s.mode} className="size-4 text-muted" />
                  <span>
                    {s.origin.city} → {s.destination.city}
                  </span>
                </div>
                <p className="text-xs text-muted">{s.carrier}</p>
              </td>
              <td className="px-3 py-3">
                <ShipmentStatusBadge status={s.status} />
              </td>
              <td className="px-3 py-3 tabular-nums">{formatDate(s.eta)}</td>
              {showCost && <td className="px-5 py-3 text-right tabular-nums">{formatMoney(s.cost, s.currency)}</td>}
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-line md:hidden">
        {shipments.map((s) => (
          <li key={s.id}>
            <Link href={`/shipments/${s.id}`} className="flex items-start justify-between gap-3 px-4 py-3 active:bg-subtle">
              <div className="min-w-0">
                <p className="font-medium">{s.id}</p>
                <p className="flex items-center gap-1.5 truncate text-sm text-muted">
                  <ModeIcon mode={s.mode} className="size-3.5 shrink-0" />
                  {s.origin.city} → {s.destination.city}
                </p>
                <p className="mt-0.5 text-xs text-muted">ETA {formatDate(s.eta)}</p>
              </div>
              <ShipmentStatusBadge status={s.status} />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
