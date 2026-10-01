import { ShipmentsView, type DemoState } from "@/components/shipments/shipments-view";
import type { StatusGroup } from "@/lib/status";
import type { ShipmentStatus } from "@/lib/types";

export const metadata = { title: "Shipments" };

// ?group=in_transit|awaiting_pickup|at_port|delivered|issues  or  ?status=<canonical state>
// lets Home's overview metrics open Shipments with a filter applied (PRD §1.5).
// Add ?state=empty | no-active | no-delivered to preview the empty states.
export default async function ShipmentsPage({ searchParams }: PageProps<"/shipments">) {
  const { group, status, state } = (await searchParams) as { group?: StatusGroup; status?: ShipmentStatus; state?: DemoState };
  return <ShipmentsView key={`${group}-${status}-${state}`} initialGroup={group} initialStatus={status} demo={state} />;
}
