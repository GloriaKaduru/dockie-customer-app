import { invoices, rateOptions, shipments } from "./mock-data";
import type { ShipmentStatus } from "./types";

// The ONE place pages get data from.
// Today these read mock data. When the backend is ready, swap each body for a
// fetch() call, e.g. `return fetch(`${API_URL}/shipments`).then(r => r.json())`.
// Every function is async already so pages won't need to change.

export async function getShipments(filter?: { status?: ShipmentStatus[] }) {
  if (!filter?.status) return shipments;
  return shipments.filter((s) => filter.status!.includes(s.status));
}

export async function getShipment(id: string) {
  return shipments.find((s) => s.id === id) ?? null;
}

export async function getInvoices() {
  return invoices;
}

export async function getRates() {
  return rateOptions;
}
