import { Plane, Ship, Truck } from "lucide-react";
import type { ShipmentMode } from "@/lib/types";

const icons = { road: Truck, air: Plane, ocean: Ship };
const labels = { road: "Road", air: "Air", ocean: "Ocean" };

export function ModeIcon({ mode, className = "size-4" }: { mode: ShipmentMode; className?: string }) {
  const Icon = icons[mode];
  return <Icon className={className} aria-label={labels[mode]} />;
}

export function modeLabel(mode: ShipmentMode) {
  return labels[mode];
}
