import type { DocumentStatus, PaymentStatus, ShipmentStatus, ShipmentType } from "./types";

/**
 * Status tone drives colour AND icon, so status is never communicated by colour alone (PRD §2.3).
 */
export type Tone = "neutral" | "progress" | "info" | "success" | "warning" | "critical";

export const shipmentStatus: Record<ShipmentStatus, { label: string; tone: Tone; group: StatusGroup }> = {
  booked: { label: "Booked", tone: "neutral", group: "awaiting_pickup" },
  offer_received: { label: "Offer received", tone: "neutral", group: "awaiting_pickup" },
  transporter_assigned: { label: "Transporter assigned", tone: "neutral", group: "awaiting_pickup" },
  enroute_to_pickup: { label: "Enroute to pickup", tone: "info", group: "awaiting_pickup" },
  picked_up: { label: "Vehicle picked up", tone: "progress", group: "in_transit" },
  in_transit: { label: "In transit", tone: "progress", group: "in_transit" },
  issue_reported: { label: "Issue reported", tone: "critical", group: "issues" },
  in_storage: { label: "In storage", tone: "info", group: "at_port" },
  at_origin_port: { label: "At origin port", tone: "info", group: "at_port" },
  clearing_customs: { label: "Clearing customs", tone: "warning", group: "at_port" },
  loaded_on_vessel: { label: "Loaded on vessel", tone: "progress", group: "in_transit" },
  in_transit_ocean: { label: "In transit — ocean", tone: "progress", group: "in_transit" },
  arrived_destination_port: { label: "Arrived at destination port", tone: "info", group: "at_port" },
  ready_for_collection: { label: "Ready for collection", tone: "success", group: "at_port" },
  delivered: { label: "Delivered", tone: "success", group: "delivered" },
};

export const allStatuses = Object.keys(shipmentStatus) as ShipmentStatus[];

/** Groups used by Home's "Shipment overview" and list filters (PRD §1.5). */
export type StatusGroup = "in_transit" | "awaiting_pickup" | "at_port" | "delivered" | "issues";

export const statusGroups: { key: StatusGroup; label: string }[] = [
  { key: "in_transit", label: "In transit" },
  { key: "awaiting_pickup", label: "Awaiting pickup" },
  { key: "at_port", label: "At port" },
  { key: "delivered", label: "Delivered" },
  { key: "issues", label: "Issues" },
];

/** Journey milestones shown on Shipment Detail (PRD §3.3). */
const oceanJourney = [
  "Booked",
  "Transporter assigned",
  "Vehicle picked up",
  "At origin port",
  "Loaded on vessel",
  "In transit — ocean",
  "Arrived at destination",
  "Ready for collection",
  "Delivered",
];
const inlandJourney = ["Booked", "Transporter assigned", "Vehicle picked up", "In transit", "Delivered"];

const oceanStep: Record<ShipmentStatus, number> = {
  booked: 0,
  offer_received: 0,
  transporter_assigned: 1,
  enroute_to_pickup: 1,
  picked_up: 2,
  in_transit: 2,
  issue_reported: 3, // shown on the step where the issue happened (see shipment.status history)
  in_storage: 3,
  at_origin_port: 3,
  clearing_customs: 6,
  loaded_on_vessel: 4,
  in_transit_ocean: 5,
  arrived_destination_port: 6,
  ready_for_collection: 7,
  delivered: 8,
};
const inlandStep: Partial<Record<ShipmentStatus, number>> = {
  booked: 0,
  offer_received: 0,
  transporter_assigned: 1,
  enroute_to_pickup: 1,
  picked_up: 2,
  in_transit: 3,
  issue_reported: 3,
  in_storage: 3,
  delivered: 4,
};

export function journey(type: ShipmentType, status: ShipmentStatus) {
  const steps = type === "ocean" ? oceanJourney : inlandJourney;
  const current = type === "ocean" ? oceanStep[status] : (inlandStep[status] ?? 0);
  return { steps, current, done: status === "delivered" };
}

export const documentStatus: Record<DocumentStatus, { label: string; tone: Tone }> = {
  required: { label: "Required", tone: "critical" },
  uploaded: { label: "Uploaded", tone: "neutral" },
  processing: { label: "Processing", tone: "info" },
  verified: { label: "Verified", tone: "success" },
  rejected: { label: "Rejected", tone: "warning" },
};

export const paymentStatus: Record<PaymentStatus, { label: string; tone: Tone }> = {
  outstanding: { label: "Outstanding", tone: "warning" },
  pending: { label: "Pending", tone: "info" },
  paid: { label: "Paid", tone: "success" },
  overdue: { label: "Overdue", tone: "critical" },
};
