// Shared shapes for the data the UI shows.
// When the backend is ready, its API responses should match these types.

export type ShipmentStatus =
  | "booked"
  | "picked_up"
  | "in_transit"
  | "customs"
  | "out_for_delivery"
  | "delivered"
  | "delayed";

export type ShipmentMode = "road" | "air" | "ocean";

export interface Place {
  city: string;
  country: string;
  address?: string;
}

export interface TrackingEvent {
  at: string; // ISO date
  label: string;
  location: string;
  done: boolean;
}

export interface Shipment {
  id: string; // e.g. DK-10482
  reference: string; // customer's own PO / reference
  status: ShipmentStatus;
  mode: ShipmentMode;
  carrier: string;
  origin: Place;
  destination: Place;
  createdAt: string;
  eta: string;
  weightKg: number;
  pieces: number;
  cost: number;
  currency: string;
  aiNote?: string; // Dockie AI insight shown on the tracking page
  events: TrackingEvent[];
}

export type InvoiceStatus = "paid" | "due" | "overdue";

export interface Invoice {
  id: string;
  shipmentIds: string[];
  issuedAt: string;
  dueAt: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
}

export interface RateOption {
  id: string;
  carrier: string;
  service: string;
  mode: ShipmentMode;
  transitDays: [number, number];
  price: number;
  currency: string;
  co2Kg: number;
  tags: ("cheapest" | "fastest" | "recommended" | "greenest")[];
}
