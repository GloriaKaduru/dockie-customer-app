import type { Role } from "./types";

// Role-level controls with a clear capability summary (PRD §13.2).
// The UI uses these to disable or explain actions; the server must still enforce them.

export type Capability =
  | "shipments.view"
  | "shipments.create"
  | "shipments.edit"
  | "tracking.view"
  | "documents.upload"
  | "payments.view"
  | "payments.pay"
  | "dockie.use"
  | "team.manage"
  | "org.manage";

export const capabilityLabels: Record<Capability, string> = {
  "shipments.view": "View shipments",
  "shipments.create": "Create shipments",
  "shipments.edit": "Edit shipments",
  "tracking.view": "View tracking",
  "documents.upload": "Upload documents",
  "payments.view": "View payments",
  "payments.pay": "Make payments",
  "dockie.use": "Use Dockie",
  "team.manage": "Manage team",
  "org.manage": "Manage organization",
};

export const roles: Record<Role, { label: string; description: string; can: Capability[] }> = {
  admin: {
    label: "Admin",
    description: "Full access, including team and organization settings.",
    can: Object.keys(capabilityLabels) as Capability[],
  },
  operations: {
    label: "Operations",
    description: "Runs day-to-day shipments and paperwork.",
    can: ["shipments.view", "shipments.create", "shipments.edit", "tracking.view", "documents.upload", "dockie.use"],
  },
  finance: {
    label: "Finance",
    description: "Handles invoices and payments.",
    can: ["shipments.view", "tracking.view", "payments.view", "payments.pay", "dockie.use"],
  },
  viewer: {
    label: "Viewer",
    description: "Can see shipments and tracking, but not change anything.",
    can: ["shipments.view", "tracking.view", "dockie.use"],
  },
};

export function can(role: Role, capability: Capability) {
  return roles[role].can.includes(capability);
}
