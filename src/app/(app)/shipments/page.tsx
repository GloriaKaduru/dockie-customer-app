import { ShipmentsView } from "@/components/shipments/shipments-view";
import type { StatusGroup } from "@/lib/status";
import type { ShipmentStatus } from "@/lib/types";

export const metadata = { title: "Shipments" };

// ?group=in_transit|awaiting_pickup|at_port|delivered|issues  or  ?status=<canonical state>
// lets Home's overview metrics open Shipments with a filter applied (PRD §1.5).
export default async function ShipmentsPage({ searchParams }: PageProps<"/shipments">) {
  const { group, status } = (await searchParams) as { group?: StatusGroup; status?: ShipmentStatus };
  return <ShipmentsView key={`${group}-${status}`} initialGroup={group} initialStatus={status} />;
}
