import { notFound } from "next/navigation";
import { ShipmentDetail } from "@/components/shipments/shipment-detail";
import { shipments } from "@/lib/data";
import { vehicleName } from "@/lib/format";

// /shipments/DK-10482 — [id] is a dynamic segment. ?tab=documents opens a tab directly.
export async function generateMetadata({ params }: PageProps<"/shipments/[id]">) {
  const { id } = await params;
  const s = shipments.find((x) => x.id === id);
  return { title: s ? `${vehicleName(s.vehicle)} · ${s.id}` : "Shipment" };
}

export default async function ShipmentPage({ params, searchParams }: PageProps<"/shipments/[id]">) {
  const { id } = await params;
  const { tab } = (await searchParams) as { tab?: string };
  if (!shipments.some((s) => s.id === id)) notFound();
  return <ShipmentDetail id={id} initialTab={tab} />;
}
