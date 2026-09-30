// Data shapes for the Dockie workspace.
// The backend's API responses should match these types.

/** The 15 canonical shipment states (PRD §2.4). */
export type ShipmentStatus =
  | "booked"
  | "offer_received"
  | "transporter_assigned"
  | "enroute_to_pickup"
  | "picked_up"
  | "in_transit"
  | "issue_reported"
  | "in_storage"
  | "at_origin_port"
  | "clearing_customs"
  | "loaded_on_vessel"
  | "in_transit_ocean"
  | "arrived_destination_port"
  | "ready_for_collection"
  | "delivered";

/** Inland shipments hide ocean-specific states. */
export type ShipmentType = "inland" | "ocean";

export interface Vehicle {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  color?: string;
  purchaseDate: string;
}

export type LocationSource = "Carrier GPS" | "Vessel AIS" | "Port system" | "Operations" | "Customer";

export interface KnownLocation {
  label: string;
  updatedAt: string;
  source: LocationSource;
  /** false when we have no current fix and only a last-known location */
  available: boolean;
}

export type EtaKind = "estimated" | "unknown" | "delayed" | "delivered";

export interface Eta {
  kind: EtaKind;
  date?: string;
  previousDate?: string; // set when delayed
  updatedAt?: string;
}

export interface Vessel {
  name: string;
  voyage: string;
  originPort: string;
  destinationPort: string;
  departure: string;
  arrival: string;
}

export interface TimelineEvent {
  id: string;
  at: string;
  title: string;
  location?: string;
  source?: LocationSource | "Dockie";
  metadata?: string;
}

export interface ActivityEntry {
  at: string;
  actor: string;
  text: string;
}

export type PhotoCategory = "Vehicle" | "Pickup" | "Condition" | "Arrival";

export interface Photo {
  id: string;
  category: PhotoCategory;
  caption: string;
  takenAt: string;
}

export interface Shipment {
  id: string; // booking number, e.g. DK-10482
  vehicle: Vehicle;
  status: ShipmentStatus;
  type: ShipmentType;
  origin: string;
  destination: string;
  location: KnownLocation;
  eta: Eta;
  vessel?: Vessel;
  bookedAt: string;
  lastUpdated: string;
  delayReason?: string;
  /** Operations has locked the shipment; Dockie actions on it fail (demo of ACTION_FAILED). */
  locked?: boolean;
  /** Seeded for the "new shipment" demo; hidden from lists until created. */
  draft?: boolean;
  timing: { purchaseToPickup?: number; pickupToBooking?: number; bookingToDeparture?: number };
  events: TimelineEvent[];
  activity: ActivityEntry[];
  photos: Photo[];
}

export type DocumentStatus = "required" | "uploaded" | "processing" | "verified" | "rejected";
export type DocumentType = "Title" | "Dock receipt" | "Bill of lading" | "Invoice" | "Payment receipt" | "Photo ID";

export interface ShipmentDocument {
  id: string;
  type: DocumentType;
  shipmentId: string;
  status: DocumentStatus;
  required: boolean;
  fileName?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  note?: string; // e.g. rejection reason
}

export type PaymentStatus = "outstanding" | "pending" | "paid" | "overdue";

export interface Payment {
  id: string; // invoice number
  shipmentId: string;
  description: string;
  amount: number;
  status: PaymentStatus;
  dueAt: string;
  paidAt?: string;
}

export type Role = "admin" | "operations" | "finance" | "viewer";

export interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "invited";
  lastActive?: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  href: string;
  at: string;
  unread: boolean;
  tone: "info" | "warning" | "critical" | "success";
}

export interface ChatSummary {
  id: string;
  title: string;
  object?: { type: "shipment" | "document" | "payment"; id: string; label: string };
  lastMessage: string;
  updatedAt: string;
  unread?: boolean;
  /** the first user message, replayed when the chat opens */
  seed: string;
}
